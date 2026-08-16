/**
 * Test Suite: Profile Setup, Auto-Fill, Resume Extraction & Persistence Verification
 */

const axios = require('axios');
const prisma = require('./src/db');
const { generateAccessToken } = require('./src/utils/jwt');
const bcrypt = require('bcryptjs');

const API_BASE = 'http://localhost:5000/api';

async function runProfileTests() {
  console.log('🧪 Starting Profile Setup, Auto-Fill & Resume Import Test Suite...\n');

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
    // 1. Create a fresh test student
    const testEmail = '127088999@sastra.ac.in';
    const passwordHash = await bcrypt.hash('Password123!', 10);

    await prisma.user.deleteMany({ where: { email: testEmail } });

    console.log('[Step 1] Creating fresh student without profile completion...');
    const student = await prisma.user.create({
      data: {
        email: testEmail,
        name: 'Haroon Irfan',
        fullName: 'Haroon Irfan',
        passwordHash,
        role: 'STUDENT',
        isActive: true,
        rollNumber: '127088999',
        rollNo: '127088999',
        department: '', // Not chosen yet
        branch: '',
        graduationYear: 2026,
        cgpa: '',       // Empty initially
        section: '',    // Empty initially
        placementGoal: '', // Empty initially
        profileCompleted: false,
      },
    });

    const token = generateAccessToken(student);
    assert(token !== null, 'Generated student token');

    // 2. Fetch /api/auth/me to verify auto-fill does not return fake defaults
    console.log('\n[Step 2] Verifying /api/auth/me does not force fake dummy defaults (8.50, CSE, etc.)...');
    const meRes = await axios.get(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert(meRes.status === 200, 'Fetched /api/auth/me');
    assert(meRes.data.user.cgpa === '', 'CGPA is empty string, not hardcoded 8.50');
    assert(meRes.data.user.section === '', 'Section is empty string, not hardcoded A');
    assert(meRes.data.user.placementGoal === '', 'Placement Goal is empty string, not hardcoded Software Engineer');
    assert(meRes.data.user.profileCompleted === false, 'profileCompleted is false');

    // 3. Simulate Resume Auto-Fill & Review Submission
    console.log('\n[Step 3] Submitting profile update via PATCH /api/users/me (Resume Extracted Data)...');
    const resumeExtractedPayload = {
      fullName: 'Shaik Haroon Irfan',
      rollNumber: '127088999',
      department: 'Information Technology (IT)',
      degree: 'B.Tech',
      graduationYear: 2026,
      section: 'C',
      cgpa: '8.85',
      placementGoal: 'Full Stack Engineer',
      interestedRoles: ['Full Stack Developer', 'Software Engineer'],
      programmingLanguages: 'Java, Python, TypeScript, SQL',
      frameworks: 'React, Node.js, Express, Tailwind CSS',
      technologies: 'Git, Docker, PostgreSQL, AWS',
      github: 'https://github.com/shaikharoon',
      linkedin: 'https://linkedin.com/in/shaikharoon',
      leetcode: 'https://leetcode.com/u/shaikharoon',
      codeforces: 'https://codeforces.com/profile/shaikharoon',
      codechef: 'https://codechef.com/users/shaikharoon',
      resume: 'https://drive.google.com/file/d/test-resume',
      bio: 'Enthusiastic software engineer focused on cloud native and full stack systems.',
      isSetup: true,
    };

    const updateRes = await axios.patch(`${API_BASE}/users/me`, resumeExtractedPayload, {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert(updateRes.status === 200, 'PATCH /api/users/me returned status 200');
    assert(updateRes.data.user.department === 'Information Technology (IT)', 'Saved department is Information Technology (IT)');
    assert(updateRes.data.user.cgpa === '8.85', 'Saved CGPA is 8.85');
    assert(updateRes.data.user.section === 'C', 'Saved section is C');
    assert(updateRes.data.user.placementGoal === 'Full Stack Engineer', 'Saved placement goal is Full Stack Engineer');
    assert(updateRes.data.user.github === 'https://github.com/shaikharoon', 'Saved GitHub URL correctly');

    // 4. Persistence check: Re-fetch /api/auth/me to verify DB is single source of truth
    console.log('\n[Step 4] Re-fetching /api/auth/me to verify persistence in DB across reloads...');
    const reMeRes = await axios.get(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert(reMeRes.data.user.department === 'Information Technology (IT)', 'Persisted department loaded from database');
    assert(reMeRes.data.user.cgpa === '8.85', 'Persisted CGPA loaded from database');
    assert(reMeRes.data.user.section === 'C', 'Persisted section loaded from database');
    assert(reMeRes.data.user.placementGoal === 'Full Stack Engineer', 'Persisted goal loaded from database');
    assert(reMeRes.data.user.profileCompleted === true, 'profileCompleted updated to true');

    // 5. User Edits Auto-Filled Data & Saves
    console.log('\n[Step 5] Editing auto-filled profile fields (Changing CGPA to 9.20, Department to AI&DS, Goal to AI Engineer)...');
    const editPayload = {
      ...resumeExtractedPayload,
      department: 'Computer Science (AI & DS)',
      cgpa: '9.20',
      section: 'A',
      placementGoal: 'AI Engineer',
    };

    const editRes = await axios.patch(`${API_BASE}/users/me`, editPayload, {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert(editRes.data.user.department === 'Computer Science (AI & DS)', 'Updated department to Computer Science (AI & DS)');
    assert(editRes.data.user.cgpa === '9.20', 'Updated CGPA to 9.20');
    assert(editRes.data.user.section === 'A', 'Updated section to A');
    assert(editRes.data.user.placementGoal === 'AI Engineer', 'Updated goal to AI Engineer');

    // 6. Validation Rejection Tests
    console.log('\n[Step 6] Testing validation rejection for invalid inputs...');
    try {
      await axios.patch(`${API_BASE}/users/me`, { rollNumber: '123' }, { headers: { Authorization: `Bearer ${token}` } });
      assert(false, 'Should reject invalid roll number');
    } catch (err) {
      assert(err.response?.status === 400, 'Rejects roll numbers that are not 9 digits with status 400');
    }

    try {
      await axios.patch(`${API_BASE}/users/me`, { cgpa: '11.50' }, { headers: { Authorization: `Bearer ${token}` } });
      assert(false, 'Should reject invalid CGPA > 10.0');
    } catch (err) {
      assert(err.response?.status === 400, 'Rejects CGPA > 10.0 with status 400');
    }

    // Clean up test user
    await prisma.user.delete({ where: { id: student.id } });

    console.log(`\n========================================`);
    console.log(`Test Results: ${passed} Passed, ${failed} Failed`);
    console.log(`========================================\n`);

    if (failed === 0) {
      console.log('🎉 ALL PROFILE SETUP & AUTO-FILL TESTS PASSED PERFECTLY!\n');
      process.exit(0);
    } else {
      process.exit(1);
    }
  } catch (err) {
    console.error('Test error:', err);
    process.exit(1);
  }
}

runProfileTests();
