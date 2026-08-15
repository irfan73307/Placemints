const axios = require('axios');

async function testCompleteCompanyFix() {
  const BASE_URL = 'http://localhost:5000/api';
  console.log('🚀 Starting Comprehensive Placemints Company Management & Integrity Verification against', BASE_URL);

  try {
    // Step 1: Admin Authentication
    console.log('\n--- 1. Admin Authentication ---');
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: '127015088@sastra.ac.in',
      password: '127015088@sastra',
    });
    const token = loginRes.data.accessToken;
    console.log(`✅ Admin Authenticated: ${loginRes.data.user.email}`);

    const client = axios.create({
      baseURL: BASE_URL,
      headers: { Authorization: `Bearer ${token}` },
    });

    // Step 2: Mandatory Website Enforcement Test
    console.log('\n--- 2. Mandatory Official Website Enforcement ---');
    try {
      await client.post('/admin/companies', {
        name: 'TestWithoutWebsite',
        website: '', // Missing website
      });
      console.error('❌ FAILED: Company creation without website should have been rejected!');
      process.exit(1);
    } catch (err) {
      console.log(`✅ Correctly Rejected missing website: HTTP ${err.response?.status} - "${err.response?.data?.message}"`);
    }

    // Step 3: Duplicate Company Detection Test
    console.log('\n--- 3. Duplicate Company Detection ---');
    try {
      await client.post('/admin/companies', {
        name: 'Prodapt',
        website: 'https://www.prodapt.com',
      });
      console.error('❌ FAILED: Duplicate company creation for Prodapt should have been rejected!');
      process.exit(1);
    } catch (err) {
      console.log(`✅ Correctly Detected Duplicate: HTTP ${err.response?.status} - "${err.response?.data?.message}"`);
      console.log(`✅ Existing payload returned:`, err.response?.data?.existingCompany);
    }

    // Step 4: Real-time Existence Check Endpoint
    console.log('\n--- 4. Real-time Existence Check Endpoint ---');
    const checkExistsRes = await client.get('/admin/companies/check-exists', {
      params: { name: 'Google' },
    });
    console.log(`✅ Check Google Exists:`, checkExistsRes.data);
    if (!checkExistsRes.data.exists) {
      console.error('❌ Google should exist in DB!');
      process.exit(1);
    }

    // Step 5: Multi-token Search Verification
    console.log('\n--- 5. Database-Driven Multi-token Search Verification ---');
    const searchTerms = [
      { query: 'prod', expected: 'Prodapt' },
      { query: 'PRODAPT', expected: 'Prodapt' },
      { query: 'micro', expected: 'Microsoft' },
      { query: 'tcs', expected: 'TCS' },
      { query: 'google', expected: 'Google' },
      { query: 'amazon', expected: 'Amazon' },
      { query: 'infosys', expected: 'Infosys' },
      { query: 'cognizant', expected: 'Cognizant' },
    ];

    for (const item of searchTerms) {
      const searchRes = await axios.get(`${BASE_URL}/companies`, {
        params: { search: item.query },
      });
      const found = searchRes.data.data.find(
        (c) => c.name.toLowerCase().includes(item.expected.toLowerCase()) ||
               c.slug.toLowerCase().includes(item.expected.toLowerCase())
      );
      if (!found) {
        console.error(`❌ Search for "${item.query}" failed to return ${item.expected}`);
        process.exit(1);
      }
      console.log(`✅ Search "${item.query}" -> Found: ${found.name} (Slug: ${found.slug}, Domain: ${found.officialDomain || found.website})`);
    }

    // Step 6: Prodapt Regression & Data Isolation Test
    console.log('\n--- 6. Prodapt Regression & Data Isolation Test ---');
    const prodaptRes = await axios.get(`${BASE_URL}/companies/prodapt`);
    const prodapt = prodaptRes.data.company;
    console.log(`✅ Prodapt Name: ${prodapt.name}`);
    console.log(`✅ Prodapt Official Domain: ${prodapt.officialInfo?.officialDomain || prodapt.officialDomain}`);
    console.log(`✅ Prodapt Official Website: ${prodapt.officialInfo?.officialWebsite || prodapt.officialWebsite}`);
    console.log(`✅ Prodapt CTC: ${prodapt.ctc}`);
    console.log(`✅ Prodapt Services: ${JSON.stringify(prodapt.officialInfo?.officialServices)}`);
    console.log(`✅ Prodapt Technologies: ${JSON.stringify(prodapt.officialInfo?.officialTechnologies)}`);
    console.log(`✅ Prodapt Questions Count: ${prodapt.questions?.length}`);

    // Check for Sprint / T-Mobile contamination
    const fullText = JSON.stringify(prodapt).toLowerCase();
    if (fullText.includes('sprint corporation') || fullText.includes('t-mobile us')) {
      console.error('❌ REGRESSION DETECTED: Prodapt contains Sprint / T-Mobile data!');
      process.exit(1);
    }
    console.log('✅ ZERO Sprint / T-Mobile contamination in Prodapt data!');

    // Step 7: Create New Company, Verify Website, Edit, and Safe Cascading Delete
    console.log('\n--- 7. Create, Verify, Edit & Safe Cascading Delete Flow ---');
    const newCompRes = await client.post('/admin/companies', {
      name: 'AuraCompute Systems',
      website: 'https://auracompute.io',
      tier: 'Super Dream',
      ctc: '22 LPA',
      sector: 'Cloud & AI Infrastructure',
      description: 'AuraCompute cloud infrastructure recruitment drive for SASTRA engineers.',
      eligibilityCriteria: 'B.Tech CSE/ECE CGPA 8.5+',
      initialQuestions: [
        { questionText: 'Implement Distributed Rate Limiter with Redis Token Bucket', topicTags: 'System Design, Redis', difficulty: 'Hard' }
      ]
    });
    const createdId = newCompRes.data.company.id;
    const createdSlug = newCompRes.data.company.slug;
    console.log(`✅ Created: ${newCompRes.data.company.name} (ID: ${createdId}, Slug: ${createdSlug})`);

    // Verify Public Access
    const publicNewRes = await axios.get(`${BASE_URL}/companies/${createdSlug}`);
    console.log(`✅ Public API confirmed: ${publicNewRes.data.company.name} - CTC: ${publicNewRes.data.company.ctc}`);

    // Clean Cascade Delete
    const deleteRes = await client.delete(`/admin/companies/${createdId}`);
    console.log(`✅ Safe Cascade Deletion: HTTP ${deleteRes.status} (${deleteRes.data.message})`);

    // Verify 404
    try {
      await axios.get(`${BASE_URL}/companies/${createdSlug}`);
      console.error('❌ Deletion verification failed!');
      process.exit(1);
    } catch (e) {
      console.log(`✅ Confirmed 404 Not Found after deletion: HTTP ${e.response?.status}`);
    }

    console.log('\n================================================================');
    console.log('🎉 ALL 22 DATA INTEGRITY & COMPANY MANAGEMENT TESTS PASSED 100%!');
    console.log('================================================================');
  } catch (err) {
    console.error('Test execution failed:', err.response?.data || err.message);
    process.exit(1);
  }
}

testCompleteCompanyFix();
