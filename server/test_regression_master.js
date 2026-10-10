import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from './src/models/User.js';
import Event from './src/models/Event.js';

dotenv.config();

const BASE_URL = 'http://localhost:5000/api';

async function runMasterRegression() {
  console.log('===========================================================');
  console.log('       MEMORA MASTER REGRESSION TEST SUITE (PHASE 7)       ');
  console.log('===========================================================');

  await mongoose.connect(process.env.MONGO_URI);

  const timestamp = Date.now();
  const userAEmail = `master_user_a_${timestamp}@memora.app`;
  const userBEmail = `master_user_b_${timestamp}@memora.app`;
  const password = 'StrongPassword123!';

  let tokenA = '';
  let tokenB = '';
  let userAId = '';
  let userBId = '';
  let eventAId = '';
  let eventWithPhotoId = '';

  let totalTests = 0;
  let passedTests = 0;

  const assert = (condition, testName) => {
    totalTests++;
    if (!condition) {
      console.error(`❌ FAILED: ${testName}`);
      throw new Error(`Regression Assertion Failed: ${testName}`);
    }
    passedTests++;
    console.log(`✓ [${totalTests}] PASS: ${testName}`);
  };

  try {
    // -------------------------------------------------------------
    // SECTION 1: SYSTEM HEALTH CHECK
    // -------------------------------------------------------------
    console.log('\n--- SECTION 1: SYSTEM HEALTH ---');
    const healthRes = await fetch(`${BASE_URL}/health`);
    const healthData = await healthRes.json();
    assert(healthRes.status === 200, 'GET /api/health returns 200 OK');
    assert(healthData.success === true, 'Health check reports success: true');
    assert(healthData.tagline === 'Every Date Has a Story.', 'Brand tagline returned in health check');

    // -------------------------------------------------------------
    // SECTION 2: AUTHENTICATION & SECURITY
    // -------------------------------------------------------------
    console.log('\n--- SECTION 2: AUTHENTICATION & SECURITY ---');

    // 2.1 Register User A
    const regARes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Curator Alice', email: userAEmail, password }),
    });
    const regAData = await regARes.json();
    assert(regARes.status === 201, 'POST /api/auth/register returns 201 Created');
    assert(Boolean(regAData.token), 'JWT token returned on registration');
    assert(!regAData.user.password, 'Password hash is strictly omitted from registration response');
    tokenA = regAData.token;
    userAId = regAData.user.id;

    // 2.2 Duplicate Email Rejection (Case-Insensitive)
    const dupRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Clone Alice', email: userAEmail.toUpperCase(), password }),
    });
    assert(dupRes.status === 409, 'Duplicate registration returns 409 Conflict');

    // 2.3 Invalid Registration Payload
    const badRegRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'A', email: 'notanemail', password: '123' }),
    });
    assert(badRegRes.status === 400, 'Invalid registration payload rejected with 400 Bad Request');

    // 2.4 Login User A
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: userAEmail, password }),
    });
    const loginData = await loginRes.json();
    assert(loginRes.status === 200, 'POST /api/auth/login returns 200 OK');
    assert(Boolean(loginData.token), 'JWT returned on login');
    assert(!loginData.user.password, 'Password omitted from login response');

    // 2.5 Invalid Credentials Rejection
    const badLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: userAEmail, password: 'WrongPassword999' }),
    });
    assert(badLoginRes.status === 401, 'Invalid password returns 401 Unauthorized');

    // 2.6 Protected Profile Access (GET /api/auth/me)
    const meRes = await fetch(`${BASE_URL}/auth/me`, {
      headers: { 'Authorization': `Bearer ${tokenA}` },
    });
    const meData = await meRes.json();
    assert(meRes.status === 200, 'GET /api/auth/me returns 200 OK with Bearer token');
    assert(meData.user.email === userAEmail.toLowerCase(), 'Profile data belongs to authenticated user');

    // 2.7 Unauthorized Access (No Token)
    const noTokRes = await fetch(`${BASE_URL}/auth/me`);
    assert(noTokRes.status === 401, 'Protected route without token returns 401 Unauthorized');

    // 2.8 Tampered Token
    const badTokRes = await fetch(`${BASE_URL}/auth/me`, {
      headers: { 'Authorization': 'Bearer forged.tampered.token' },
    });
    assert(badTokRes.status === 401, 'Tampered token rejected with 401 Unauthorized');

    // Register User B for Isolation Tests
    const regBRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'User Bob', email: userBEmail, password }),
    });
    const regBData = await regBRes.json();
    tokenB = regBData.token;
    userBId = regBData.user.id;
    assert(regBRes.status === 201, 'User B registered successfully for isolation validation');

    // -------------------------------------------------------------
    // SECTION 3: EVENT MANAGEMENT & MULTIPART UPLOADS
    // -------------------------------------------------------------
    console.log('\n--- SECTION 3: EVENT MANAGEMENT & UPLOADS ---');

    // 3.1 Create Standard Event
    const e1Res = await fetch(`${BASE_URL}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenA}` },
      body: JSON.stringify({
        title: 'Lavender Autumn Picnic',
        caption: 'Sitting under the golden oak trees enjoying lavender honey tea.',
        date: '2026-10-18',
        time: '14:00',
        category: 'Family',
      }),
    });
    const e1Data = await e1Res.json();
    assert(e1Res.status === 201, 'POST /api/events creates standard event (201 Created)');
    assert(e1Data.event.title === 'Lavender Autumn Picnic', 'Event title persisted accurately');
    eventAId = e1Data.event.id;

    // 3.2 Strict Date Validation (Invalid Calendar Date: 2026-02-31)
    const badDateRes = await fetch(`${BASE_URL}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenA}` },
      body: JSON.stringify({ title: 'Invalid Date', date: '2026-02-31' }),
    });
    assert(badDateRes.status === 400, 'Impossible calendar date (2026-02-31) rejected with 400');

    // 3.3 Create Event with Multipart Photo
    const formData = new FormData();
    formData.append('title', 'Venice Gondola Memory');
    formData.append('caption', 'Gliding through twilight canals.');
    formData.append('date', '2026-10-24');
    formData.append('time', '19:45');
    formData.append('category', 'Romantic');
    const dummyJpeg = new Blob([new Uint8Array([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xFF, 0xD9])], { type: 'image/jpeg' });
    formData.append('photo', dummyJpeg, 'venice.jpg');

    const photoEventRes = await fetch(`${BASE_URL}/events`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${tokenA}` },
      body: formData,
    });
    const photoEventData = await photoEventRes.json();
    assert(photoEventRes.status === 201, 'Event with photo upload returns 201 Created');
    assert(Boolean(photoEventData.event.imageUrl), 'Cloudinary image URL attached to event');
    assert(Boolean(photoEventData.event.imagePublicId), 'Cloudinary public ID tracked for cleanup');
    eventWithPhotoId = photoEventData.event.id;

    // 3.4 Invalid File Format Rejection
    const badFileForm = new FormData();
    badFileForm.append('title', 'Bad File');
    badFileForm.append('date', '2026-10-28');
    badFileForm.append('photo', new Blob(['fake text file'], { type: 'text/plain' }), 'bad.txt');
    const badFileRes = await fetch(`${BASE_URL}/events`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${tokenA}` },
      body: badFileForm,
    });
    assert(badFileRes.status === 400, 'Non-image file format rejected with 400 Bad Request');

    // -------------------------------------------------------------
    // SECTION 4: DISCOVERY, SEARCH & FILTERS
    // -------------------------------------------------------------
    console.log('\n--- SECTION 4: DISCOVERY, SEARCH & FILTERS ---');

    // 4.1 Month-wise Calendar Query
    const monthRes = await fetch(`${BASE_URL}/events?month=2026-10`, {
      headers: { 'Authorization': `Bearer ${tokenA}` },
    });
    const monthData = await monthRes.json();
    assert(monthRes.status === 200, 'GET /api/events?month=2026-10 returns 200 OK');
    assert(monthData.count >= 2, 'Month query retrieves events for active month');

    // 4.2 Search by Title
    const sTitleRes = await fetch(`${BASE_URL}/events?search=Gondola`, {
      headers: { 'Authorization': `Bearer ${tokenA}` },
    });
    const sTitleData = await sTitleRes.json();
    assert(sTitleData.count === 1 && sTitleData.events[0].id === eventWithPhotoId, 'Search by title matches correctly');

    // 4.3 Search by Caption
    const sCapRes = await fetch(`${BASE_URL}/events?search=twilight`, {
      headers: { 'Authorization': `Bearer ${tokenA}` },
    });
    const sCapData = await sCapRes.json();
    assert(sCapData.count === 1 && sCapData.events[0].id === eventWithPhotoId, 'Search by caption matches correctly');

    // 4.4 Category Filter
    const catRes = await fetch(`${BASE_URL}/events?category=Romantic`, {
      headers: { 'Authorization': `Bearer ${tokenA}` },
    });
    const catData = await catRes.json();
    assert(catData.count === 1 && catData.events[0].category === 'Romantic', 'Category filter matches exact category');

    // 4.5 Upcoming Events Query
    const upRes = await fetch(`${BASE_URL}/events/upcoming`, {
      headers: { 'Authorization': `Bearer ${tokenA}` },
    });
    const upData = await upRes.json();
    assert(upRes.status === 200, 'GET /api/events/upcoming returns 200 OK');
    assert(Array.isArray(upData.events), 'Upcoming events returns chronological array');

    // -------------------------------------------------------------
    // SECTION 5: USER DATA ISOLATION & PERMISSION DEFENSE
    // -------------------------------------------------------------
    console.log('\n--- SECTION 5: USER ISOLATION ---');

    // 5.1 User B cannot read User A's event
    const isoGet = await fetch(`${BASE_URL}/events/${eventAId}`, {
      headers: { 'Authorization': `Bearer ${tokenB}` },
    });
    assert(isoGet.status === 404, 'User B GET User A event is blocked with 404 Not Found');

    // 5.2 User B cannot edit User A's event
    const isoPut = await fetch(`${BASE_URL}/events/${eventAId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenB}` },
      body: JSON.stringify({ title: 'Hacked by Bob' }),
    });
    assert(isoPut.status === 404, 'User B PUT User A event is blocked with 404 Not Found');

    // 5.3 User B cannot delete User A's event
    const isoDel = await fetch(`${BASE_URL}/events/${eventAId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${tokenB}` },
    });
    assert(isoDel.status === 404, 'User B DELETE User A event is blocked with 404 Not Found');

    // 5.4 User B sees 0 events in their calendar/gallery
    const isoList = await fetch(`${BASE_URL}/events`, {
      headers: { 'Authorization': `Bearer ${tokenB}` },
    });
    const isoListData = await isoList.json();
    assert(isoListData.count === 0, 'User B query returns 0 events (absolute user data isolation)');

    // -------------------------------------------------------------
    // SECTION 6: UPDATE, DELETE & LIFECYCLE CLEANUP
    // -------------------------------------------------------------
    console.log('\n--- SECTION 6: UPDATE & DELETION ---');

    // 6.1 Update Event by Owner
    const updateRes = await fetch(`${BASE_URL}/events/${eventAId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenA}` },
      body: JSON.stringify({ title: 'Lavender Autumn Harvest Picnic' }),
    });
    const updateData = await updateRes.json();
    assert(updateRes.status === 200, 'PUT /api/events/:id returns 200 OK');
    assert(updateData.event.title === 'Lavender Autumn Harvest Picnic', 'Updated title persisted');

    // 6.2 Delete Event by Owner
    const delRes = await fetch(`${BASE_URL}/events/${eventAId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${tokenA}` },
    });
    assert(delRes.status === 200, 'DELETE /api/events/:id returns 200 OK');

    // 6.3 Confirm Subsequent Retrieval is 404
    const checkDelRes = await fetch(`${BASE_URL}/events/${eventAId}`, {
      headers: { 'Authorization': `Bearer ${tokenA}` },
    });
    assert(checkDelRes.status === 404, 'Deleted event yields 404 on subsequent lookup');

    // -------------------------------------------------------------
    // CLEANUP TEST USERS AND REMAINING TEST EVENTS
    // -------------------------------------------------------------
    await Event.deleteMany({ user: { $in: [userAId, userBId] } });
    await User.deleteMany({ _id: { $in: [userAId, userBId] } });
    console.log('\n✓ Database cleanup: Test users and events safely removed.');

    console.log('\n===========================================================');
    console.log(`🏆 ALL ${passedTests}/${totalTests} MASTER REGRESSION TESTS PASSED!`);
    console.log('===========================================================');
  } catch (err) {
    console.error('\n❌ MASTER REGRESSION FAILED:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

runMasterRegression();
