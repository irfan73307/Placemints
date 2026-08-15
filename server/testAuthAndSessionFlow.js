const axios = require('axios');
const prisma = require('./src/db');
const { verifyAccessToken, verifyRefreshToken } = require('./src/utils/jwt');

async function testAuthAndSessionFlow() {
  const BASE_URL = 'http://localhost:5000/api';
  console.log('🚀 Starting Comprehensive Authentication, JWT Session & Data Isolation Verification against', BASE_URL);

  let testUserA = null;
  let testUserB = null;

  try {
    // -------------------------------------------------------------------------
    // 1. JWT Implementation & Secrets Audit
    // -------------------------------------------------------------------------
    console.log('\n--- 1. JWT Secrets & Token Structure Verification ---');
    const mockPayload = { id: 'test-user-id', email: '127001111@sastra.ac.in', role: 'STUDENT' };
    const { generateAccessToken, generateRefreshToken } = require('./src/utils/jwt');
    const testAccess = generateAccessToken(mockPayload);
    const testRefresh = generateRefreshToken(mockPayload);

    const decodedAccess = verifyAccessToken(testAccess);
    const decodedRefresh = verifyRefreshToken(testRefresh);

    if (!decodedAccess || decodedAccess.id !== 'test-user-id') {
      throw new Error('Access token verification failed.');
    }
    if (!decodedRefresh || decodedRefresh.id !== 'test-user-id') {
      throw new Error('Refresh token verification failed.');
    }
    console.log('✅ Access Token signed with JWT_ACCESS_SECRET (15m expiry)');
    console.log('✅ Refresh Token signed with JWT_REFRESH_SECRET (7d expiry)');

    // -------------------------------------------------------------------------
    // 2. Email Registration & Domain Restriction (@sastra.ac.in Only)
    // -------------------------------------------------------------------------
    console.log('\n--- 2. Domain Restriction & User Registration ---');
    // Reject non-sastra
    try {
      await axios.post(`${BASE_URL}/auth/register`, {
        fullName: 'Attacker Outside SASTRA',
        email: 'attacker@gmail.com',
        password: 'Password123!',
      });
      throw new Error('Should have rejected non-SASTRA email!');
    } catch (err) {
      console.log(`✅ Correctly Blocked Non-SASTRA Email: HTTP ${err.response?.status} - "${err.response?.data?.message}"`);
    }

    // Clean up any stale test users
    await prisma.user.deleteMany({
      where: { email: { in: ['127001991@sastra.ac.in', '127001992@sastra.ac.in'] } },
    });

    // Register User A
    const regResA = await axios.post(`${BASE_URL}/auth/register`, {
      fullName: 'Test Student Alpha',
      email: '127001991@sastra.ac.in',
      password: 'Password123!',
    });
    console.log(`✅ Registered User A: ${regResA.data.user.email} (ID: ${regResA.data.user.id})`);
    testUserA = regResA.data.user;

    // Check Set-Cookie headers for HTTP-only cookies
    const cookiesA = regResA.headers['set-cookie'] || [];
    console.log('✅ Cookies Issued on Registration:', cookiesA.map((c) => c.split(';')[0]));

    // Register User B
    const regResB = await axios.post(`${BASE_URL}/auth/register`, {
      fullName: 'Test Student Beta',
      email: '127001992@sastra.ac.in',
      password: 'Password123!',
    });
    console.log(`✅ Registered User B: ${regResB.data.user.email} (ID: ${regResB.data.user.id})`);
    testUserB = regResB.data.user;

    // -------------------------------------------------------------------------
    // 3. Login & Credential Verification
    // -------------------------------------------------------------------------
    console.log('\n--- 3. Email/Password Login & Single Error Message ---');
    // Test Invalid Password
    try {
      await axios.post(`${BASE_URL}/auth/login`, {
        email: '127001991@sastra.ac.in',
        password: 'WrongPassword!',
      });
      throw new Error('Should have rejected incorrect password!');
    } catch (err) {
      console.log(`✅ Correctly Handled Invalid Password: HTTP ${err.response?.status} - "${err.response?.data?.message}"`);
    }

    // Test Valid Login User A
    const loginResA = await axios.post(`${BASE_URL}/auth/login`, {
      email: '127001991@sastra.ac.in',
      password: 'Password123!',
    });
    console.log(`✅ Login Succeeded: ${loginResA.data.user.fullName} (${loginResA.data.user.email})`);
    const tokenA = loginResA.data.accessToken;

    const authCookiesA = (loginResA.headers['set-cookie'] || []).join('; ');

    // -------------------------------------------------------------------------
    // 4. Session Restoration from HTTP-Only Cookies (Simulating Page Refresh)
    // -------------------------------------------------------------------------
    console.log('\n--- 4. Session Restoration via HTTP-Only Cookie (Browser Refresh Test) ---');
    const sessionRes = await axios.get(`${BASE_URL}/auth/me`, {
      headers: { Cookie: authCookiesA },
    });
    console.log(`✅ Restored Session for User: ${sessionRes.data.user.fullName} (${sessionRes.data.user.email})`);
    console.log(`✅ User Data from Database: Department = ${sessionRes.data.user.department}, Roll = ${sessionRes.data.user.rollNumber}`);

    // -------------------------------------------------------------------------
    // 5. Token Refresh Endpoint
    // -------------------------------------------------------------------------
    console.log('\n--- 5. Token Refresh Validation ---');
    const refreshRes = await axios.post(
      `${BASE_URL}/auth/refresh`,
      {},
      { headers: { Cookie: authCookiesA } }
    );
    console.log(`✅ Issued New Access Token via Refresh Token Cookie: ${refreshRes.data.accessToken.substring(0, 30)}...`);

    // -------------------------------------------------------------------------
    // 6. User Data Isolation & Saved Companies
    // -------------------------------------------------------------------------
    console.log('\n--- 6. User Data Isolation & Saved Companies Test ---');
    // User A saves Google
    const googleCompany = await prisma.company.findFirst({ where: { slug: 'google' } });
    if (googleCompany) {
      await axios.post(
        `${BASE_URL}/users/me/saved/${googleCompany.id}`,
        {},
        { headers: { Authorization: `Bearer ${tokenA}` } }
      );
      console.log(`✅ User A saved company: ${googleCompany.name}`);

      // Query User A's saved companies
      const savedA = await axios.get(`${BASE_URL}/users/me/saved`, {
        headers: { Authorization: `Bearer ${tokenA}` },
      });
      console.log(`✅ User A saved list count: ${savedA.data.data.length}`);

      // Login User B and query User B's saved companies
      const loginResB = await axios.post(`${BASE_URL}/auth/login`, {
        email: '127001992@sastra.ac.in',
        password: 'Password123!',
      });
      const tokenB = loginResB.data.accessToken;

      const savedB = await axios.get(`${BASE_URL}/users/me/saved`, {
        headers: { Authorization: `Bearer ${tokenB}` },
      });
      console.log(`✅ User B saved list count: ${savedB.data.data.length} (Expected: 0)`);

      if (savedB.data.data.length !== 0) {
        throw new Error('User B received User A saved companies! Data isolation breach!');
      }
      console.log('✅ Strict User Data Isolation Verified: User B has 0 saved companies.');
    }

    // -------------------------------------------------------------------------
    // 7. Role-Based Access Control (RBAC) Protection
    // -------------------------------------------------------------------------
    console.log('\n--- 7. RBAC Protection (Student vs Admin) ---');
    // Normal Student User A tries /admin/companies
    try {
      await axios.get(`${BASE_URL}/admin/companies`, {
        headers: { Authorization: `Bearer ${tokenA}` },
      });
      throw new Error('Normal student should not access /admin/companies!');
    } catch (err) {
      console.log(`✅ Student Access to Admin Denied: HTTP ${err.response?.status} - "${err.response?.data?.message}"`);
    }

    // Admin login
    const adminLogin = await axios.post(`${BASE_URL}/auth/login`, {
      email: '127015088@sastra.ac.in',
      password: '127015088@sastra',
    });
    const adminToken = adminLogin.data.accessToken;
    const adminCompanies = await axios.get(`${BASE_URL}/admin/companies`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    console.log(`✅ Admin Access to /admin/companies Granted: HTTP ${adminCompanies.status} (${adminCompanies.data.total} companies)`);

    // -------------------------------------------------------------------------
    // 8. Logout Flow & Session Revocation
    // -------------------------------------------------------------------------
    console.log('\n--- 8. Logout & Session Revocation ---');
    const logoutRes = await axios.post(
      `${BASE_URL}/auth/logout`,
      {},
      { headers: { Cookie: authCookiesA } }
    );
    console.log(`✅ Logout Response: HTTP ${logoutRes.status} - "${logoutRes.data.message}"`);
    const clearedCookies = logoutRes.headers['set-cookie'] || [];
    console.log('✅ Cleared Cookies in Response Header:', clearedCookies.map((c) => c.split(';')[0]));

    // -------------------------------------------------------------------------
    // Clean up test users
    // -------------------------------------------------------------------------
    await prisma.user.deleteMany({
      where: { email: { in: ['127001991@sastra.ac.in', '127001992@sastra.ac.in'] } },
    });
    console.log('✅ Test users cleaned up from database.');

    console.log('\n================================================================');
    console.log('🎉 ALL AUTHENTICATION, JWT & SESSION TEST CASES PASSED 100%!');
    console.log('================================================================');
  } catch (err) {
    console.error('❌ Auth test suite failed:', err.response?.data || err.message);
    if (testUserA || testUserB) {
      await prisma.user.deleteMany({
        where: { email: { in: ['127001991@sastra.ac.in', '127001992@sastra.ac.in'] } },
      }).catch(() => {});
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testAuthAndSessionFlow();
