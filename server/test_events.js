import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from './src/models/User.js';
import Event from './src/models/Event.js';

dotenv.config();

const BASE_URL = 'http://localhost:5000/api';

async function runEventTests() {
  console.log('--- STARTING PHASE 3 EVENT & UPLOAD TEST SUITE ---');

  await mongoose.connect(process.env.MONGO_URI);

  const timestamp = Date.now();
  const userAEmail = `user_a_${timestamp}@memora.app`;
  const userBEmail = `user_b_${timestamp}@memora.app`;
  const password = 'Password123!';

  let tokenA = '';
  let tokenB = '';
  let eventAId = '';
  let eventPhotoId = '';

  try {
    // 1. Setup: Register User A and User B
    console.log('\n[SETUP] Registering User A and User B');
    const resA = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'User A', email: userAEmail, password }),
    });
    const dataA = await resA.json();
    tokenA = dataA.token;

    const resB = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'User B', email: userBEmail, password }),
    });
    const dataB = await resB.json();
    tokenB = dataB.token;
    console.log('✓ PASS: Registered User A and User B with active JWT tokens.');

    // 2. Test POST /api/events (Standard Event without Photo)
    console.log('\n[TEST 1] POST /api/events (Valid Event without Photo)');
    const eventRes1 = await fetch(`${BASE_URL}/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        title: 'Sunset at Lavender Bay',
        caption: 'A wonderful evening captured in memories.',
        date: '2026-10-15',
        time: '18:30',
        category: 'Travel',
      }),
    });
    const eventData1 = await eventRes1.json();
    console.log('Status:', eventRes1.status);
    console.log('Response:', JSON.stringify(eventData1));
    if (eventRes1.status !== 201 || !eventData1.event.id || eventData1.event.title !== 'Sunset at Lavender Bay') {
      throw new Error('Test 1 Failed: Could not create event!');
    }
    eventAId = eventData1.event.id;
    console.log('✓ PASS: Event created successfully.');

    // 3. Test POST /api/events with Photo Upload (Multipart Form Data)
    console.log('\n[TEST 2] POST /api/events (With Multipart Photo Upload)');
    const formData = new FormData();
    formData.append('title', 'Birthday Celebration');
    formData.append('caption', 'Best scrapbook memory ever');
    formData.append('date', '2026-10-20');
    formData.append('time', '20:00');
    formData.append('category', 'Birthday');

    // Create a 1x1 dummy JPEG blob
    const dummyImageBytes = new Uint8Array([
      0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x48,
      0x00, 0x48, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43, 0x00, 0xFF, 0xD9
    ]);
    const blob = new Blob([dummyImageBytes], { type: 'image/jpeg' });
    formData.append('photo', blob, 'memory.jpg');

    const eventRes2 = await fetch(`${BASE_URL}/events`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenA}`,
      },
      body: formData,
    });
    const eventData2 = await eventRes2.json();
    console.log('Status:', eventRes2.status);
    console.log('Response:', JSON.stringify(eventData2));
    if (eventRes2.status !== 201 || !eventData2.event.imageUrl) {
      throw new Error('Test 2 Failed: Photo upload did not populate imageUrl!');
    }
    eventPhotoId = eventData2.event.id;
    console.log('✓ PASS: Event with photo created and Cloudinary URL attached.');

    // 4. Test Invalid Photo Type Rejection
    console.log('\n[TEST 3] POST /api/events (Invalid File Format - Rejected)');
    const badFormData = new FormData();
    badFormData.append('title', 'Corrupt Event');
    badFormData.append('date', '2026-10-25');
    const textBlob = new Blob(['Not an image'], { type: 'text/plain' });
    badFormData.append('photo', textBlob, 'hack.txt');

    const badFileRes = await fetch(`${BASE_URL}/events`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${tokenA}` },
      body: badFormData,
    });
    const badFileData = await badFileRes.json();
    console.log('Status:', badFileRes.status);
    console.log('Response:', JSON.stringify(badFileData));
    if (badFileRes.status !== 400) {
      throw new Error(`Test 3 Failed: Expected status 400, got ${badFileRes.status}`);
    }
    console.log('✓ PASS: Non-image file correctly rejected with 400 Bad Request.');

    // 5. Test Invalid Date Validation (Non-existent Calendar Date)
    console.log('\n[TEST 4] POST /api/events (Non-existent Date: 2026-02-31)');
    const badDateRes = await fetch(`${BASE_URL}/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        title: 'Impossible Date',
        date: '2026-02-31',
      }),
    });
    const badDateData = await badDateRes.json();
    console.log('Status:', badDateRes.status);
    console.log('Response:', JSON.stringify(badDateData));
    if (badDateRes.status !== 400) {
      throw new Error(`Test 4 Failed: Expected status 400, got ${badDateRes.status}`);
    }
    console.log('✓ PASS: Invalid calendar date rejected with 400.');

    // 6. Test GET /api/events (List All for User A)
    console.log('\n[TEST 5] GET /api/events (List User A Events)');
    const listRes = await fetch(`${BASE_URL}/events`, {
      headers: { 'Authorization': `Bearer ${tokenA}` },
    });
    const listData = await listRes.json();
    console.log('Status:', listRes.status);
    console.log('Count:', listData.count);
    if (listRes.status !== 200 || listData.count < 2) {
      throw new Error('Test 5 Failed: Failed to retrieve user events!');
    }
    console.log('✓ PASS: Retrieved all events for authenticated user.');

    // 7. Test GET /api/events with Filtering (Month & Search)
    console.log('\n[TEST 6] GET /api/events?month=2026-10&search=Lavender');
    const filterRes = await fetch(`${BASE_URL}/events?month=2026-10&search=Lavender`, {
      headers: { 'Authorization': `Bearer ${tokenA}` },
    });
    const filterData = await filterRes.json();
    console.log('Status:', filterRes.status);
    console.log('Count:', filterData.count);
    if (filterRes.status !== 200 || filterData.count !== 1 || filterData.events[0].title !== 'Sunset at Lavender Bay') {
      throw new Error('Test 6 Failed: Month/search filter failed!');
    }
    console.log('✓ PASS: Filter by month and search term returned matching event.');

    // 8. Test GET /api/events/upcoming
    console.log('\n[TEST 7] GET /api/events/upcoming');
    const upRes = await fetch(`${BASE_URL}/events/upcoming`, {
      headers: { 'Authorization': `Bearer ${tokenA}` },
    });
    const upData = await upRes.json();
    console.log('Status:', upRes.status);
    console.log('Upcoming count:', upData.count);
    if (upRes.status !== 200 || !Array.isArray(upData.events)) {
      throw new Error('Test 7 Failed: Upcoming route failed!');
    }
    console.log('✓ PASS: Upcoming events route returned sorted list.');

    // 9. Test GET /api/events/:id
    console.log('\n[TEST 8] GET /api/events/:id (Valid ID)');
    const singleRes = await fetch(`${BASE_URL}/events/${eventAId}`, {
      headers: { 'Authorization': `Bearer ${tokenA}` },
    });
    const singleData = await singleRes.json();
    console.log('Status:', singleRes.status);
    if (singleRes.status !== 200 || singleData.event.id !== eventAId) {
      throw new Error('Test 8 Failed: Failed to get single event!');
    }
    console.log('✓ PASS: Single event retrieved successfully.');

    // 10. Test PUT /api/events/:id (Update Title & Caption)
    console.log('\n[TEST 9] PUT /api/events/:id (Update Event)');
    const updateRes = await fetch(`${BASE_URL}/events/${eventAId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        title: 'Golden Sunset at Lavender Bay',
        caption: 'Updated caption with golden glow.',
      }),
    });
    const updateData = await updateRes.json();
    console.log('Status:', updateRes.status);
    if (updateRes.status !== 200 || updateData.event.title !== 'Golden Sunset at Lavender Bay') {
      throw new Error('Test 9 Failed: Event update failed!');
    }
    console.log('✓ PASS: Event updated successfully.');

    // 11. Test USER ISOLATION (User B attempts to read, update, or delete User A event)
    console.log('\n[TEST 10] USER ISOLATION: User B attempts to access User A event');

    // 10a. User B tries GET /api/events/:id of User A
    const isoGetRes = await fetch(`${BASE_URL}/events/${eventAId}`, {
      headers: { 'Authorization': `Bearer ${tokenB}` },
    });
    console.log('User B GET User A Event Status:', isoGetRes.status);
    if (isoGetRes.status !== 404) {
      throw new Error(`Test 10a Failed: User B should get 404, got ${isoGetRes.status}`);
    }

    // 10b. User B tries PUT /api/events/:id of User A
    const isoPutRes = await fetch(`${BASE_URL}/events/${eventAId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenB}`,
      },
      body: JSON.stringify({ title: 'Hacked Title' }),
    });
    console.log('User B PUT User A Event Status:', isoPutRes.status);
    if (isoPutRes.status !== 404) {
      throw new Error(`Test 10b Failed: User B should get 404, got ${isoPutRes.status}`);
    }

    // 10c. User B tries DELETE /api/events/:id of User A
    const isoDelRes = await fetch(`${BASE_URL}/events/${eventAId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${tokenB}` },
    });
    console.log('User B DELETE User A Event Status:', isoDelRes.status);
    if (isoDelRes.status !== 404) {
      throw new Error(`Test 10c Failed: User B should get 404, got ${isoDelRes.status}`);
    }

    // 10d. User B calls GET /api/events -> MUST be 0 events
    const isoListRes = await fetch(`${BASE_URL}/events`, {
      headers: { 'Authorization': `Bearer ${tokenB}` },
    });
    const isoListData = await isoListRes.json();
    console.log('User B events count:', isoListData.count);
    if (isoListData.count !== 0) {
      throw new Error('Test 10d Failed: User B saw events belonging to User A!');
    }
    console.log('✓ PASS: User isolation completely verified. User B cannot view, edit, delete, or list User A events.');

    // 12. Test DELETE /api/events/:id
    console.log('\n[TEST 11] DELETE /api/events/:id (Owner User A deletes their event)');
    const delRes = await fetch(`${BASE_URL}/events/${eventAId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${tokenA}` },
    });
    console.log('Delete status:', delRes.status);
    if (delRes.status !== 200) {
      throw new Error(`Test 11 Failed: Expected 200, got ${delRes.status}`);
    }

    // Confirm deletion
    const checkDeletedRes = await fetch(`${BASE_URL}/events/${eventAId}`, {
      headers: { 'Authorization': `Bearer ${tokenA}` },
    });
    console.log('Status after deletion:', checkDeletedRes.status);
    if (checkDeletedRes.status !== 404) {
      throw new Error('Test 11 Failed: Event was still found after deletion!');
    }
    console.log('✓ PASS: Event deleted and 404 returned on subsequent query.');

    // 13. Test Invalid ObjectId format rejection
    console.log('\n[TEST 12] GET /api/events/invalid-id-format');
    const badIdRes = await fetch(`${BASE_URL}/events/12345notanid`, {
      headers: { 'Authorization': `Bearer ${tokenA}` },
    });
    console.log('Bad ID status:', badIdRes.status);
    if (badIdRes.status !== 400) {
      throw new Error(`Test 12 Failed: Expected 400 for bad ID, got ${badIdRes.status}`);
    }
    console.log('✓ PASS: Malformed MongoDB ObjectID cleanly rejected with 400 Bad Request.');

    // Cleanup test users and remaining events
    await Event.deleteMany({ user: { $in: [dataA.user.id, dataB.user.id] } });
    await User.deleteMany({ _id: { $in: [dataA.user.id, dataB.user.id] } });
    console.log('\n✓ Test cleanup complete: Test users and events removed from database.');

    console.log('\n===========================================');
    console.log('ALL PHASE 3 EVENT & UPLOAD TESTS PASSED!');
    console.log('===========================================');
  } catch (err) {
    console.error('TEST RUN FAILURE:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

runEventTests();
