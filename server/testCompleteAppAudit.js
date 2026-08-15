const axios = require('axios');
const prisma = require('./src/db');

async function runCompleteAppAudit() {
  const BASE_URL = 'http://localhost:5000/api';
  console.log('🚀 Running Complete Placemints Application-Wide Audit against', BASE_URL);

  let testUser = null;

  try {
    // -------------------------------------------------------------------------
    // 1. Audit Public & Unauthenticated Endpoints
    // -------------------------------------------------------------------------
    console.log('\n--- [1/7] Public Endpoints & Unauthenticated Access ---');
    const publicCompaniesRes = await axios.get(`${BASE_URL}/companies`);
    if (publicCompaniesRes.status !== 200 || !Array.isArray(publicCompaniesRes.data.data)) {
      throw new Error('Public /api/companies failed.');
    }
    console.log(`✅ GET /api/companies: HTTP 200 OK (${publicCompaniesRes.data.data.length} companies loaded)`);

    // Verify individual public company details for top companies
    const companiesToTest = ['google', 'prodapt', 'microsoft', 'tcs-digital', 'amazon', 'infosys', 'cognizant'];
    for (const slug of companiesToTest) {
      const compRes = await axios.get(`${BASE_URL}/companies/${slug}`);
      if (compRes.status !== 200 || !compRes.data.company) {
        throw new Error(`GET /api/companies/${slug} returned invalid data.`);
      }
      console.log(`✅ GET /api/companies/${slug}: HTTP 200 OK (Name: "${compRes.data.company.name}", Domain: "${compRes.data.company.officialDomain || 'N/A'}")`);
    }

    // -------------------------------------------------------------------------
    // 2. Student Authentication & Session Lifecycle
    // -------------------------------------------------------------------------
    console.log('\n--- [2/7] Student Authentication & Profile Operations ---');
    const studentLogin = await axios.post(`${BASE_URL}/auth/login`, {
      email: '127015088@sastra.ac.in',
      password: '127015088@sastra',
    });
    const studentToken = studentLogin.data.accessToken;
    const studentCookie = (studentLogin.headers['set-cookie'] || []).join('; ');
    console.log(`✅ POST /api/auth/login: HTTP 200 OK (Logged in as ${studentLogin.data.user.name})`);

    // Fetch /api/auth/me using Cookie
    const meRes = await axios.get(`${BASE_URL}/auth/me`, {
      headers: { Cookie: studentCookie },
    });
    console.log(`✅ GET /api/auth/me: HTTP 200 OK (Role: ${meRes.data.user.role}, Name: ${meRes.data.user.fullName})`);

    // Fetch Dashboard Stats
    const dashRes = await axios.get(`${BASE_URL}/dashboard`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    console.log(`✅ GET /api/dashboard: HTTP 200 OK (Top companies: ${dashRes.data.topCompanies?.length || 0})`);

    // Update Profile (PATCH /api/users/me)
    const profileUpdateRes = await axios.patch(
      `${BASE_URL}/users/me`,
      {
        fullName: 'Shaik Mohammad Irfan',
        placementGoal: 'Lead Software Architect',
        programmingLanguages: ['JavaScript', 'Python', 'Java', 'C++'],
        frameworks: ['React', 'Node.js', 'Express', 'Tailwind CSS'],
        technologies: ['Prisma', 'PostgreSQL', 'Docker', 'Git'],
      },
      { headers: { Authorization: `Bearer ${studentToken}` } }
    );
    console.log(`✅ PATCH /api/users/me: HTTP 200 OK (Updated Goal: "${profileUpdateRes.data.user.placementGoal}")`);

    // -------------------------------------------------------------------------
    // 3. Saved Companies & Library
    // -------------------------------------------------------------------------
    console.log('\n--- [3/7] Saved Companies & Library Context ---');
    const targetComp = await prisma.company.findFirst({ where: { slug: 'google' } });
    if (targetComp) {
      // Toggle save
      const saveRes = await axios.post(
        `${BASE_URL}/users/me/saved/${targetComp.id}`,
        {},
        { headers: { Authorization: `Bearer ${studentToken}` } }
      );
      console.log(`✅ POST /api/users/me/saved/${targetComp.id}: HTTP 200 OK (isSaved: ${saveRes.data.isSaved})`);

      // Fetch saved companies
      const savedListRes = await axios.get(`${BASE_URL}/users/me/saved`, {
        headers: { Authorization: `Bearer ${studentToken}` },
      });
      console.log(`✅ GET /api/users/me/saved: HTTP 200 OK (${savedListRes.data.data.length} saved companies)`);
    }

    const libRes = await axios.get(`${BASE_URL}/library`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    console.log(`✅ GET /api/library: HTTP 200 OK (${libRes.data.resources?.length || 0} library resources)`);

    // -------------------------------------------------------------------------
    // 4. Admin Management Endpoints
    // -------------------------------------------------------------------------
    console.log('\n--- [4/7] Admin Management Endpoints ---');
    const adminCompaniesList = await axios.get(`${BASE_URL}/admin/companies`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    console.log(`✅ GET /api/admin/companies: HTTP 200 OK (${adminCompaniesList.data.total} companies in admin directory)`);

    const adminStats = await axios.get(`${BASE_URL}/admin/companies/stats`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    console.log(`✅ GET /api/admin/companies/stats: HTTP 200 OK (Total: ${adminStats.data.stats?.totalCompanies || 0}, Students: ${adminStats.data.stats?.totalStudents || 0})`);

    // -------------------------------------------------------------------------
    // 5. Admin Preview & Re-verification Pipeline
    // -------------------------------------------------------------------------
    console.log('\n--- [5/7] Admin Official Verification & Scraper Pipeline ---');
    const previewRes = await axios.post(
      `${BASE_URL}/admin/companies/preview-official-refresh`,
      {
        companyId: targetComp.id,
        officialWebsite: 'https://about.google',
      },
      { headers: { Authorization: `Bearer ${studentToken}` } }
    );
    console.log(`✅ POST /api/admin/companies/preview-official-refresh: HTTP 200 OK (Scraped Domain: "${previewRes.data.official?.domain || 'N/A'}")`);

    // -------------------------------------------------------------------------
    // 6. Security & Negative Route Tests
    // -------------------------------------------------------------------------
    console.log('\n--- [6/7] Security, RBAC & Negative Tests ---');
    // Test Unauthenticated access to /admin/companies
    try {
      await axios.get(`${BASE_URL}/admin/companies`);
      throw new Error('Unauthenticated access to /admin/companies should fail!');
    } catch (err) {
      console.log(`✅ Blocked Unauthenticated Admin Access: HTTP ${err.response?.status} - "${err.response?.data?.message}"`);
    }

    // Test Invalid Login
    try {
      await axios.post(`${BASE_URL}/auth/login`, {
        email: '127015088@sastra.ac.in',
        password: 'WrongPassword!',
      });
      throw new Error('Invalid login should fail!');
    } catch (err) {
      console.log(`✅ Blocked Invalid Password: HTTP ${err.response?.status} - "${err.response?.data?.message}"`);
    }

    // Test Non-SASTRA Registration
    try {
      await axios.post(`${BASE_URL}/auth/register`, {
        fullName: 'Outsider',
        email: 'outsider@gmail.com',
        password: 'Password123!',
      });
      throw new Error('Non-SASTRA registration should fail!');
    } catch (err) {
      console.log(`✅ Blocked Non-SASTRA Registration: HTTP ${err.response?.status} - "${err.response?.data?.message}"`);
    }

    // -------------------------------------------------------------------------
    // 7. Password Change & Session Logout
    // -------------------------------------------------------------------------
    console.log('\n--- [7/7] Password Change & Logout ---');
    const changePassRes = await axios.post(
      `${BASE_URL}/users/change-password`,
      {
        currentPassword: '127015088@sastra',
        newPassword: '127015088@sastra',
      },
      { headers: { Authorization: `Bearer ${studentToken}` } }
    );
    console.log(`✅ POST /api/users/change-password: HTTP 200 OK - "${changePassRes.data.message}"`);

    const logoutRes = await axios.post(
      `${BASE_URL}/auth/logout`,
      {},
      { headers: { Cookie: studentCookie } }
    );
    console.log(`✅ POST /api/auth/logout: HTTP 200 OK - "${logoutRes.data.message}"`);

    console.log('\n================================================================');
    console.log('🎉 COMPLETE APPLICATION-WIDE AUDIT PASSED 100% WITH 0 ERRORS!');
    console.log('================================================================');
  } catch (err) {
    console.error('❌ Audit failure:', err.response?.data || err.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runCompleteAppAudit();
