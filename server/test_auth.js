import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from './src/models/User.js';

dotenv.config();

const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('--- STARTING PHASE 2 AUTHENTICATION SUITE ---');

  // Connect directly to DB to clean up test user if needed
  await mongoose.connect(process.env.MONGO_URI);
  const testEmail = `test_${Date.now()}@memora.app`;
  const testPassword = 'Password123!';
  const testName = 'Scrapbook Tester';

  let authToken = '';

  try {
    // 1. Test Valid Registration
    console.log('\n[TEST 1] POST /api/auth/register (Valid User)');
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: testName, email: testEmail, password: testPassword }),
    });
    const regData = await regRes.json();
    console.log('Status:', regRes.status);
    console.log('Response:', JSON.stringify(regData));
    if (regRes.status !== 201 || !regData.token || regData.user.password) {
      throw new Error('Test 1 Failed: Registration response invalid or password exposed!');
    }
    authToken = regData.token;
    console.log('✓ PASS: Registration successful, token received, password not exposed.');

    // 2. Test Duplicate Registration
    console.log('\n[TEST 2] POST /api/auth/register (Duplicate Email)');
    const dupRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Another Name', email: testEmail.toUpperCase(), password: 'AnotherPassword' }),
    });
    const dupData = await dupRes.json();
    console.log('Status:', dupRes.status);
    console.log('Response:', JSON.stringify(dupData));
    if (dupRes.status !== 409) {
      throw new Error(`Test 2 Failed: Expected status 409, got ${dupRes.status}`);
    }
    console.log('✓ PASS: Duplicate email rejected with 409 Conflict.');

    // 3. Test Invalid Body Validation
    console.log('\n[TEST 3] POST /api/auth/register (Invalid Short Password & Invalid Email)');
    const invRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Shorty', email: 'invalid-email', password: '123' }),
    });
    const invData = await invRes.json();
    console.log('Status:', invRes.status);
    console.log('Response:', JSON.stringify(invData));
    if (invRes.status !== 400) {
      throw new Error(`Test 3 Failed: Expected status 400, got ${invRes.status}`);
    }
    console.log('✓ PASS: Invalid payload rejected with 400 Bad Request.');

    // 4. Test Valid Login
    console.log('\n[TEST 4] POST /api/auth/login (Correct Credentials)');
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: testPassword }),
    });
    const loginData = await loginRes.json();
    console.log('Status:', loginRes.status);
    console.log('Response:', JSON.stringify(loginData));
    if (loginRes.status !== 200 || !loginData.token || loginData.user.password) {
      throw new Error('Test 4 Failed: Login response invalid or password exposed!');
    }
    console.log('✓ PASS: Login successful, valid token received.');

    // 5. Test Invalid Login Credentials
    console.log('\n[TEST 5] POST /api/auth/login (Wrong Password)');
    const wrongPassRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: 'WrongPassword999' }),
    });
    const wrongPassData = await wrongPassRes.json();
    console.log('Status:', wrongPassRes.status);
    console.log('Response:', JSON.stringify(wrongPassData));
    if (wrongPassRes.status !== 401) {
      throw new Error(`Test 5 Failed: Expected status 401, got ${wrongPassRes.status}`);
    }
    console.log('✓ PASS: Wrong password rejected with 401 Unauthorized.');

    // 6. Test Protected Endpoint GET /api/auth/me (With Valid Token)
    console.log('\n[TEST 6] GET /api/auth/me (Valid Bearer Token)');
    const meRes = await fetch(`${BASE_URL}/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });
    const meData = await meRes.json();
    console.log('Status:', meRes.status);
    console.log('Response:', JSON.stringify(meData));
    if (meRes.status !== 200 || meData.user.email !== testEmail.toLowerCase() || meData.user.password) {
      throw new Error('Test 6 Failed: Profile retrieval failed or password exposed!');
    }
    console.log('✓ PASS: Authenticated profile fetched successfully.');

    // 7. Test Protected Endpoint GET /api/auth/me (No Token)
    console.log('\n[TEST 7] GET /api/auth/me (No Token)');
    const noTokenRes = await fetch(`${BASE_URL}/auth/me`);
    const noTokenData = await noTokenRes.json();
    console.log('Status:', noTokenRes.status);
    console.log('Response:', JSON.stringify(noTokenData));
    if (noTokenRes.status !== 401) {
      throw new Error(`Test 7 Failed: Expected status 401, got ${noTokenRes.status}`);
    }
    console.log('✓ PASS: Missing token rejected with 401.');

    // 8. Test Protected Endpoint GET /api/auth/me (Invalid / Tampered Token)
    console.log('\n[TEST 8] GET /api/auth/me (Tampered Token)');
    const badTokenRes = await fetch(`${BASE_URL}/auth/me`, {
      headers: { 'Authorization': 'Bearer invalid.token.value' },
    });
    const badTokenData = await badTokenRes.json();
    console.log('Status:', badTokenRes.status);
    console.log('Response:', JSON.stringify(badTokenData));
    if (badTokenRes.status !== 401) {
      throw new Error(`Test 8 Failed: Expected status 401, got ${badTokenRes.status}`);
    }
    console.log('✓ PASS: Invalid token rejected with 401.');

    // 9. Test Protected Endpoint with Deleted User
    console.log('\n[TEST 9] GET /api/auth/me (Deleted User Token)');
    await User.deleteOne({ email: testEmail });
    const deletedUserRes = await fetch(`${BASE_URL}/auth/me`, {
      headers: { 'Authorization': `Bearer ${authToken}` },
    });
    const deletedUserData = await deletedUserRes.json();
    console.log('Status:', deletedUserRes.status);
    console.log('Response:', JSON.stringify(deletedUserData));
    if (deletedUserRes.status !== 401 || !deletedUserData.message.includes('no longer exists')) {
      throw new Error(`Test 9 Failed: Expected status 401 with user not found, got ${deletedUserRes.status}`);
    }
    console.log('✓ PASS: Deleted user token rejected with 401.');

    console.log('\n========================================');
    console.log('ALL PHASE 2 AUTHENTICATION TESTS PASSED!');
    console.log('========================================');
  } catch (err) {
    console.error('TEST RUN FAILURE:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

runTests();
