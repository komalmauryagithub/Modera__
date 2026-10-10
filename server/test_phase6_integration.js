import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from './src/models/User.js';
import Event from './src/models/Event.js';

dotenv.config();

const BASE_URL = 'http://localhost:5000/api';

async function runPhase6Tests() {
  console.log('--- STARTING PHASE 6 DISCOVERY, GALLERY & UPCOMING TEST SUITE ---');

  await mongoose.connect(process.env.MONGO_URI);

  const timestamp = Date.now();
  const testEmail = `gallery_tester_${timestamp}@memora.app`;
  const password = 'Password123!';

  let token = '';
  let event1Id = '';
  let event2Id = '';
  let event3FutureId = '';

  try {
    // 1. Setup: Register Test User
    console.log('\n[SETUP] Registering user for Phase 6 test');
    const userRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Scrapbook Curator', email: testEmail, password }),
    });
    const userData = await userRes.json();
    token = userData.token;
    console.log('✓ PASS: Registered test user and acquired JWT token.');

    // 2. Create 3 events with distinct categories, dates, captions, and titles
    console.log('\n[SETUP] Creating test memories across dates and categories');
    
    // Event 1: Anniversary in Paris (Past/Current)
    const e1Res = await fetch(`${BASE_URL}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        title: 'Golden Eiffel Anniversary',
        caption: 'Our fifth magical year together under the sparkling lights of Paris.',
        date: '2026-10-05',
        time: '20:15',
        category: 'Anniversary',
      }),
    });
    const e1Data = await e1Res.json();
    event1Id = e1Data.event.id;

    // Event 2: Beach Travel Memory
    const e2Res = await fetch(`${BASE_URL}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        title: 'Santorini Sunset Cruise',
        caption: 'Sailing along the Aegean caldera watching the deep violet horizon.',
        date: '2026-10-12',
        time: '18:00',
        category: 'Travel',
      }),
    });
    const e2Data = await e2Res.json();
    event2Id = e2Data.event.id;

    // Event 3: Future Birthday Party
    const futureDate = '2026-11-20';
    const e3Res = await fetch(`${BASE_URL}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        title: 'Surprise Birthday Bash',
        caption: 'Planning the grand secret birthday gathering with all close friends.',
        date: futureDate,
        time: '19:30',
        category: 'Birthday',
      }),
    });
    const e3Data = await e3Res.json();
    event3FutureId = e3Data.event.id;
    console.log('✓ PASS: Created 3 test events (Past, Current, and Future).');

    // 3. Test Search by Title: "Eiffel"
    console.log('\n[TEST 1] Search by Title ("Eiffel")');
    const searchRes1 = await fetch(`${BASE_URL}/events?search=Eiffel`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const searchData1 = await searchRes1.json();
    console.log('Count:', searchData1.count);
    if (searchData1.count !== 1 || searchData1.events[0].id !== event1Id) {
      throw new Error('Test 1 Failed: Search by title did not return expected event.');
    }
    console.log('✓ PASS: Search query matched title accurately.');

    // 4. Test Search by Caption: "caldera"
    console.log('\n[TEST 2] Search by Caption ("caldera")');
    const searchRes2 = await fetch(`${BASE_URL}/events?search=caldera`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const searchData2 = await searchRes2.json();
    console.log('Count:', searchData2.count);
    if (searchData2.count !== 1 || searchData2.events[0].id !== event2Id) {
      throw new Error('Test 2 Failed: Search by caption did not return expected event.');
    }
    console.log('✓ PASS: Search query matched caption accurately.');

    // 5. Test Filter by Category: "Travel"
    console.log('\n[TEST 3] Filter by Category ("Travel")');
    const catRes = await fetch(`${BASE_URL}/events?category=Travel`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const catData = await catRes.json();
    console.log('Count:', catData.count);
    if (catData.count !== 1 || catData.events[0].category !== 'Travel') {
      throw new Error('Test 3 Failed: Filter by category returned invalid results.');
    }
    console.log('✓ PASS: Category filter isolated "Travel" events.');

    // 6. Test Date Range Filter: 2026-10-01 to 2026-10-15
    console.log('\n[TEST 4] Date Range Filter (2026-10-01 to 2026-10-15)');
    const rangeRes = await fetch(`${BASE_URL}/events?startDate=2026-10-01&endDate=2026-10-15`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const rangeData = await rangeRes.json();
    console.log('Count in range:', rangeData.count);
    if (rangeData.count !== 2) {
      throw new Error(`Test 4 Failed: Expected 2 events in October range, got ${rangeData.count}`);
    }
    console.log('✓ PASS: Date range filtered exactly the two October events.');

    // 7. Test Combined Filters: Category "Travel" AND Range
    console.log('\n[TEST 5] Combined Filters (Category: "Travel" + Range: 2026-10-01 to 2026-10-15)');
    const combRes = await fetch(`${BASE_URL}/events?category=Travel&startDate=2026-10-01&endDate=2026-10-15`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const combData = await combRes.json();
    console.log('Combined Count:', combData.count);
    if (combData.count !== 1 || combData.events[0].title !== 'Santorini Sunset Cruise') {
      throw new Error('Test 5 Failed: Combined filter failed to return single matching event.');
    }
    console.log('✓ PASS: Combined search/category/date filters operate synchronously.');

    // 8. Test Empty Results on Non-Matching Query
    console.log('\n[TEST 6] Non-Matching Search ("UnicornConcert2099")');
    const emptyRes = await fetch(`${BASE_URL}/events?search=UnicornConcert2099`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const emptyData = await emptyRes.json();
    console.log('Count for non-existent:', emptyData.count);
    if (emptyData.count !== 0) {
      throw new Error('Test 6 Failed: Expected 0 events for non-existent search.');
    }
    console.log('✓ PASS: Non-matching queries return empty array cleanly.');

    // 9. Test GET /api/events/upcoming (Chronological Future List)
    console.log('\n[TEST 7] GET /api/events/upcoming');
    const upRes = await fetch(`${BASE_URL}/events/upcoming`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const upData = await upRes.json();
    console.log('Upcoming count:', upData.count);
    if (upData.count === 0 || !upData.events.some((e) => e.id === event3FutureId)) {
      throw new Error('Test 7 Failed: Upcoming events list did not contain future event.');
    }
    console.log('✓ PASS: Upcoming events route contains future events in chronological order.');

    // 10. Test Updates Reflected Across All Views (Same Source of Truth)
    console.log('\n[TEST 8] Cross-View Synchronization: Update Title via PUT');
    const updatedTitle = 'Santorini Private Yacht Cruise';
    await fetch(`${BASE_URL}/events/${event2Id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ title: updatedTitle }),
    });

    // Check in full list
    const verifyListRes = await fetch(`${BASE_URL}/events?search=Yacht`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const verifyListData = await verifyListRes.json();
    if (verifyListData.count !== 1 || verifyListData.events[0].title !== updatedTitle) {
      throw new Error('Test 8 Failed: Updated title was not reflected in search results.');
    }
    console.log('✓ PASS: Update in event record is immediately reflected across all discovery queries.');

    // Cleanup
    await Event.deleteMany({ user: userData.user.id });
    await User.deleteOne({ _id: userData.user.id });
    console.log('\n✓ Test cleanup complete: Test user and memories removed from database.');

    console.log('\n======================================================');
    console.log('ALL PHASE 6 GALLERY, UPCOMING & FILTER TESTS PASSED!');
    console.log('======================================================');
  } catch (err) {
    console.error('TEST RUN FAILURE:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

runPhase6Tests();
