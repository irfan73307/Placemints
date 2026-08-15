const axios = require('axios');
const prisma = require('./src/db');

async function testLegacyReverificationFlow() {
  const BASE_URL = 'http://localhost:5000/api';
  console.log('🚀 Starting Legacy Company Re-Verification & Preview Flow Automated Test against', BASE_URL);

  let legacyCompany = null;
  try {
    // 1. Admin Login
    console.log('\nStep 1: Admin Login...');
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

    // 2. Create a Legacy Company directly in PostgreSQL with null official website
    console.log('\nStep 2: Seed Legacy Company (null official website) with Placement Data in DB...');
    legacyCompany = await prisma.company.create({
      data: {
        name: 'Prodapt Technologies',
        slug: 'prodapt-legacy-test',
        website: null,
        officialWebsite: null,
        officialDomain: null,
        description: 'Old outdated legacy description (possible cross-mapping or unverified data).',
        industry: 'Legacy Tech',
        tier: 'Super Dream',
        ctc: '15 LPA',
        tags: 'IT Services, Telecom',
        eligibilityCriteria: 'B.Tech CSE/ECE with CGPA 8.0+',
        selectionProcess: 'OA -> Technical Round 1 -> HR',
        placementNotes: 'Important notes from SASTRA senior batch: Prepare DP and Trie.',
        rounds: {
          create: [
            { roundNumber: 1, title: 'OA Round', description: 'Online coding and aptitude test' },
            { roundNumber: 2, title: 'Tech Interview', description: 'Technical DSA and system design round' },
          ],
        },
        questions: {
          create: [
            {
              questionText: 'Find maximum length substring with at most k distinct characters',
              topicTags: 'Strings, Sliding Window',
              difficulty: 'Medium',
            },
            {
              questionText: 'Design a high-throughput messaging queue in C++',
              topicTags: 'System Design, C++',
              difficulty: 'Hard',
            },
          ],
        },
      },
      include: {
        rounds: true,
        questions: true,
      },
    });

    console.log(`✅ Legacy Company Seeded: ${legacyCompany.name} (ID: ${legacyCompany.id})`);
    console.log(`- Initial Website: ${legacyCompany.officialWebsite}`);
    console.log(`- Archived Questions in DB: ${legacyCompany.questions.length}`);
    console.log(`- Archived Selection Rounds in DB: ${legacyCompany.rounds.length}`);

    // 3. Test Preview Before Refresh (Side-by-Side Comparison)
    console.log('\nStep 3: Test Preview Before Refresh Endpoint with official website (https://www.prodapt.com)...');
    const previewRes = await client.post(`/admin/companies/${legacyCompany.id}/preview-official-refresh`, {
      website: 'https://www.prodapt.com',
    });
    console.log(`✅ Preview Status: ${previewRes.status}`);
    const previewData = previewRes.data;
    console.log('✅ Current DB Info in Preview:', previewData.current);
    console.log('✅ Scraped Official Info in Preview:', {
      name: previewData.official.name,
      domain: previewData.official.domain,
      website: previewData.official.website,
      services: previewData.official.services,
      technologies: previewData.official.technologies,
    });
    console.log('✅ Preserved Placement Data Guarantee in Preview:', previewData.placementPreserved);

    if (previewData.placementPreserved.questionsCount !== 2 || previewData.placementPreserved.roundsCount !== 2) {
      console.error('❌ Placement count guarantee mismatch!');
      process.exit(1);
    }

    // 4. Test Apply Official Refresh
    console.log('\nStep 4: Admin Confirms "Apply Official Information"...');
    const applyRes = await client.post(`/admin/companies/${legacyCompany.id}/apply-official-refresh`, {
      website: 'https://www.prodapt.com',
      selectedData: previewData.official,
    });
    console.log(`✅ Apply Refresh Status: ${applyRes.status} (${applyRes.data.message})`);

    // 5. Verify Database State & 100% Placement Data Preservation
    console.log('\nStep 5: Verify Database Record State...');
    const updatedCompanyInDb = await prisma.company.findUnique({
      where: { id: legacyCompany.id },
      include: { rounds: true, questions: true },
    });

    console.log(`✅ Updated Official Domain: ${updatedCompanyInDb.officialDomain}`);
    console.log(`✅ Updated Official Website: ${updatedCompanyInDb.officialWebsite}`);
    console.log(`✅ Updated Source Type: ${updatedCompanyInDb.officialSourceType}`);
    console.log(`✅ Updated General Description: ${updatedCompanyInDb.officialDescription.substring(0, 80)}...`);
    console.log(`✅ Preserved Questions Count: ${updatedCompanyInDb.questions.length} (Expected: 2)`);
    console.log(`✅ Preserved Rounds Count: ${updatedCompanyInDb.rounds.length} (Expected: 2)`);
    console.log(`✅ Preserved Placement Notes: "${updatedCompanyInDb.placementNotes}"`);
    console.log(`✅ Preserved CTC: "${updatedCompanyInDb.ctc}"`);

    if (updatedCompanyInDb.questions.length !== 2 || updatedCompanyInDb.rounds.length !== 2) {
      console.error('❌ Placement questions or rounds were improperly deleted or modified!');
      process.exit(1);
    }

    // 6. Test Unreachable Website Re-Verification Rejection
    console.log('\nStep 6: Test Unreachable Website Rejection and Data Preservation...');
    try {
      await client.post(`/admin/companies/${legacyCompany.id}/preview-official-refresh`, {
        website: 'https://this-domain-definitely-does-not-exist-xyz123.com',
      });
      console.error('❌ Unreachable website should have been rejected!');
      process.exit(1);
    } catch (err) {
      console.log(`✅ Correctly Handled Unreachable Website: HTTP ${err.response?.status} - "${err.response?.data?.message}"`);
    }

    // 7. Clean Cascade Delete of Test Legacy Company
    console.log('\nStep 7: Clean Cascade Deletion...');
    const delRes = await client.delete(`/admin/companies/${legacyCompany.id}`);
    console.log(`✅ Deleted Test Company: HTTP ${delRes.status}`);

    console.log('\n================================================================');
    console.log('🎉 LEGACY RE-VERIFICATION & DATA PRESERVATION PIPELINE VERIFIED 100%!');
    console.log('================================================================');
  } catch (err) {
    console.error('Test execution failed:', err.response?.data || err.message);
    if (legacyCompany) {
      await prisma.company.deleteMany({ where: { id: legacyCompany.id } }).catch(() => {});
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testLegacyReverificationFlow();
