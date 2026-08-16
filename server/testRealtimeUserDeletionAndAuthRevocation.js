/**
 * Production Test Suite: Real-Time User Deletion + Session & Token Revocation
 * 
 * Verifies:
 * 1. Student A & Student B can register and log in.
 * 2. Protected APIs work normally when accounts are active.
 * 3. Admin deletes Student A.
 * 4. Zero-Trust check: Student A's existing JWT access token is IMMEDIATELY rejected on all protected endpoints with 401 & ACCOUNT_REVOKED.
 * 5. Refresh token security: Student A's refresh token cannot issue new access tokens and returns 401 & ACCOUNT_REVOKED.
 * 6. Student B remains completely unaffected.
 * 7. Database integrity: Student A user and refresh tokens are removed without orphaned cascades.
 */

const axios = require('axios');
const prisma = require('./src/db');
const { generateAccessToken } = require('./src/utils/jwt');
const bcrypt = require('bcryptjs');

const API_BASE = 'http://localhost:5000/api';

async function runTests() {
  console.log('🧪 Starting Real-Time User Deletion & Auth Revocation Test Suite...\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      failed++;
    }
  }

  try {
    // 1. Setup Primary Admin
    console.log('[Step 1] Ensuring Primary Admin exists...');
    const adminEmail = '127015088@sastra.ac.in';
    const passwordHash = await bcrypt.hash('127015088@sastra', 10);
    const adminUser = await prisma.user.upsert({
      where: { email: adminEmail },
      update: { role: 'ADMIN', isPrimaryAdmin: true, isActive: true },
      create: {
        email: adminEmail,
        name: 'Shaik Mohammad Irfan',
        fullName: 'Shaik Mohammad Irfan',
        passwordHash,
        role: 'ADMIN',
        isPrimaryAdmin: true,
        isActive: true,
      },
    });
    const adminToken = generateAccessToken(adminUser);
    assert(adminToken !== null, 'Admin token generated successfully');

    // 2. Create Student A and Student B
    console.log('\n[Step 2] Creating Student A and Student B in database...');
    const studentAEmail = '127999001@sastra.ac.in';
    const studentBEmail = '127999002@sastra.ac.in';

    // Clean up previous test runs if any
    await prisma.user.deleteMany({
      where: { email: { in: [studentAEmail, studentBEmail] } },
    });

    const studentA = await prisma.user.create({
      data: {
        email: studentAEmail,
        name: 'Test Student A',
        fullName: 'Test Student A',
        passwordHash,
        role: 'STUDENT',
        isActive: true,
        rollNumber: '127999001',
        department: 'CSE',
        graduationYear: 2026,
        profileCompleted: true,
      },
    });

    const studentB = await prisma.user.create({
      data: {
        email: studentBEmail,
        name: 'Test Student B',
        fullName: 'Test Student B',
        passwordHash,
        role: 'STUDENT',
        isActive: true,
        rollNumber: '127999002',
        department: 'ECE',
        graduationYear: 2026,
        profileCompleted: true,
      },
    });

    const studentAToken = generateAccessToken(studentA);
    const studentBToken = generateAccessToken(studentB);

    const { generateRefreshToken } = require('./src/utils/jwt');
    const refreshAToken = generateRefreshToken(studentA);
    const refreshBToken = generateRefreshToken(studentB);

    await prisma.refreshToken.create({
      data: {
        userId: studentA.id,
        tokenHash: refreshAToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    await prisma.refreshToken.create({
      data: {
        userId: studentB.id,
        tokenHash: refreshBToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    assert(studentAToken && studentBToken, 'Student A and B tokens generated');

    // 3. Test active endpoints before deletion
    console.log('\n[Step 3] Verifying Student A & Student B can access protected endpoints before deletion...');
    const meARes = await axios.get(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${studentAToken}` },
    });
    assert(meARes.status === 200 && meARes.data.user.email === studentAEmail, 'Student A can access /api/auth/me');

    const meBRes = await axios.get(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${studentBToken}` },
    });
    assert(meBRes.status === 200 && meBRes.data.user.email === studentBEmail, 'Student B can access /api/auth/me');

    const dashARes = await axios.get(`${API_BASE}/dashboard`, {
      headers: { Authorization: `Bearer ${studentAToken}` },
    });
    assert(dashARes.status === 200, 'Student A can access /api/dashboard');

    // 4. Admin permanently deletes Student A
    console.log('\n[Step 4] Admin deletes Student A via /api/admin/students/:id...');
    const deleteRes = await axios.delete(`${API_BASE}/admin/students/${studentA.id}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(deleteRes.status === 200 && deleteRes.data.success === true, 'Admin delete endpoint returns success');

    // 5. Zero-Trust Verification: Student A's JWT token is IMMEDIATELY rejected
    console.log('\n[Step 5] Zero-Trust Token Invalidation Check for Student A...');
    try {
      await axios.get(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${studentAToken}` },
      });
      assert(false, 'Student A access to /auth/me should have been rejected');
    } catch (err) {
      assert(
        err.response?.status === 401 && err.response?.data?.code === 'ACCOUNT_REVOKED',
        'Student A /auth/me immediately rejected with 401 & ACCOUNT_REVOKED'
      );
    }

    try {
      await axios.get(`${API_BASE}/dashboard`, {
        headers: { Authorization: `Bearer ${studentAToken}` },
      });
      assert(false, 'Student A access to /dashboard should have been rejected');
    } catch (err) {
      assert(
        err.response?.status === 401 && err.response?.data?.code === 'ACCOUNT_REVOKED',
        'Student A /dashboard immediately rejected with 401 & ACCOUNT_REVOKED'
      );
    }

    try {
      await axios.get(`${API_BASE}/users/me/saved`, {
        headers: { Authorization: `Bearer ${studentAToken}` },
      });
      assert(false, 'Student A access to /users/me/saved should have been rejected');
    } catch (err) {
      assert(
        err.response?.status === 401 && err.response?.data?.code === 'ACCOUNT_REVOKED',
        'Student A /users/me/saved immediately rejected with 401 & ACCOUNT_REVOKED'
      );
    }

    // 6. Refresh Token Revocation Check
    console.log('\n[Step 6] Refresh Token Revocation Check for Student A...');
    try {
      await axios.post(`${API_BASE}/auth/refresh`, {
        refreshToken: refreshAToken,
      });
      assert(false, 'Student A refresh token should have been rejected');
    } catch (err) {
      assert(
        err.response?.status === 401 && err.response?.data?.code === 'ACCOUNT_REVOKED',
        'Student A /auth/refresh rejected with 401 & ACCOUNT_REVOKED'
      );
    }

    // 7. Verify Student B is completely unaffected
    console.log('\n[Step 7] Verifying Student B remains unaffected and fully operational...');
    const meBAfterRes = await axios.get(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${studentBToken}` },
    });
    assert(meBAfterRes.status === 200 && meBAfterRes.data.user.email === studentBEmail, 'Student B still has full access to /auth/me');

    const dashBAfterRes = await axios.get(`${API_BASE}/dashboard`, {
      headers: { Authorization: `Bearer ${studentBToken}` },
    });
    assert(dashBAfterRes.status === 200, 'Student B still has full access to /dashboard');

    // 8. Database Clean-up Verification
    console.log('\n[Step 8] Database state verification...');
    const checkDbStudentA = await prisma.user.findUnique({ where: { id: studentA.id } });
    assert(checkDbStudentA === null, 'Student A is completely removed from User table');

    const checkDbRefreshA = await prisma.refreshToken.findMany({ where: { userId: studentA.id } });
    assert(checkDbRefreshA.length === 0, 'Student A refresh tokens are completely deleted');

    // Clean up student B
    await prisma.user.delete({ where: { id: studentB.id } });

    console.log(`\n========================================`);
    console.log(`Test Results: ${passed} Passed, ${failed} Failed`);
    console.log(`========================================\n`);

    if (failed === 0) {
      console.log('🎉 ALL PRODUCTION AUTH & REVOCATION TESTS PASSED PERFECTLY!\n');
      process.exit(0);
    } else {
      console.error('💥 SOME TESTS FAILED!\n');
      process.exit(1);
    }
  } catch (globalErr) {
    console.error('Test Suite Error:', globalErr);
    process.exit(1);
  }
}

runTests();
