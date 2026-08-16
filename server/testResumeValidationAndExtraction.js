async function runTestSuite() {
  console.log('🧪 Starting Resume Validation & Entity Extraction Test Suite...\n');

  const {
    classifyResumeDocument,
    normalizeSastraDepartment,
    extractStructuredResumeData,
    validateResumeFileMetadata,
    RESUME_REJECTION_MESSAGE,
  } = await import('../src/utils/resumeParser.js');

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

  // =========================================================================
  // TEST GROUP 1: Document Classification (Accept Valid Resumes, Reject Non-Resumes)
  // =========================================================================
  console.log('[Test Group 1] Document Classification & Non-Resume Rejection...');

  // 1.1 Valid Standard Resume
  const validResumeText = `
    Shaik Haroon Irfan
    Email: 127015088@sastra.ac.in | Phone: 9876543210
    GitHub: https://github.com/shaikharoon | LinkedIn: https://linkedin.com/in/shaikharoon | LeetCode: https://leetcode.com/u/shaikharoon
    
    EDUCATION
    SASTRA Deemed University, Thanjavur
    B.Tech in Information Technology
    Graduation Year: 2026 | CGPA: 8.75 / 10
    Roll Number: 127015088
    
    TECHNICAL SKILLS
    Programming Languages: Java, Python, C++, TypeScript, SQL
    Frameworks & Libraries: React, Node.js, Express, Spring Boot, Tailwind CSS
    Developer Tools: Git, Docker, Kubernetes, PostgreSQL, AWS
    
    PROJECTS
    Placemints - Placement Automation Portal
    - Built real-time campus recruitment preparation platform for SASTRA students using React and Node.js.
    - Integrated intelligent resume parsing and automated topic extraction.
    
    CAREER OBJECTIVE
    Aspiring Software Engineer aiming to leverage full-stack engineering skills in campus recruitment.
  `;
  const validClassification = classifyResumeDocument(validResumeText, 'Haroon_Resume.pdf');
  assert(validClassification.isResume === true, 'Accepts standard complete student resume');

  // 1.2 Minimal Resume (Education + Skills only)
  const minimalResumeText = `
    Kishore Kumar
    Email: 127014022@sastra.ac.in
    
    ACADEMIC DETAILS
    SASTRA University - B.Tech Electronics and Communication Engineering
    Batch of 2026 | Score: 8.42 CGPA
    
    SKILLS
    C, C++, Python, Embedded C, Verilog, MATLAB, Git
  `;
  const minimalClassification = classifyResumeDocument(minimalResumeText, 'Resume.docx');
  assert(minimalClassification.isResume === true, 'Accepts minimal resume with 2 standard sections');

  // 1.3 Reject Certificate PDF
  const certificateText = `
    COURSERA / UDEMY ONLINE CERTIFICATE
    This is to certify that
    Mandaloju Uva Sri Krishna Sai
    has successfully completed the course in Data Structures and Algorithms with Python.
    Certificate of Completion
    Certificate ID: CERT-98234-XYZ
    Date of Issue: 12th August 2025
    Course Instructor: Prof. Andrew Ng
  `;
  const certClassification = classifyResumeDocument(certificateText, 'Python_Certificate.pdf');
  assert(certClassification.isResume === false, 'Rejects standalone Certificate of Completion PDF');

  // 1.4 Reject Semester Marksheet / Grade Card PDF
  const marksheetText = `
    SASTRA DEEMED TO BE UNIVERSITY
    Office of Controller of Examinations
    STATEMENT OF MARKS / SEMESTER GRADE REPORT
    Register Number: 127158030
    Student Name: M. Uva Sri Krishna Sai
    Semester: IV Examinations - May 2025
    Course Code | Course Title | Grade | Credits
    BIT401 | Database Systems | S | 4
    BIT402 | Computer Networks | A+ | 4
    BIT403 | Operating Systems | S | 4
    Semester SGPA: 8.92 | Cumulative CGPA: 8.64
    Controller of Examinations: Signed
  `;
  const marksheetClassification = classifyResumeDocument(marksheetText, 'Semester_IV_Marksheet.pdf');
  assert(marksheetClassification.isResume === false, 'Rejects Semester Grade Report / Marksheet PDF');

  // 1.5 Reject Random Non-Resume Document (Invoice / Terms)
  const invoiceText = `
    TAX INVOICE / PURCHASE ORDER
    Invoice Number: INV-2026-90412
    Billing Address: ABC Technologies Pvt Ltd, Bangalore
    Total Amount Due: $1,250.00
    Terms and Conditions: Payment due within 30 days of receipt.
  `;
  const invoiceClassification = classifyResumeDocument(invoiceText, 'Invoice_001.pdf');
  assert(invoiceClassification.isResume === false, 'Rejects random business Invoice PDF');

  // 1.6 Reject Empty / Tiny Document
  const emptyText = 'Hello world';
  const emptyClassification = classifyResumeDocument(emptyText, 'empty.pdf');
  assert(emptyClassification.isResume === false, 'Rejects empty or unstructured document');

  // =========================================================================
  // TEST GROUP 2: SASTRA Department Normalization (Strictly avoiding CSE confusion)
  // =========================================================================
  console.log('\n[Test Group 2] SASTRA Department Normalization...');

  assert(
    normalizeSastraDepartment('Information Technology') === 'Information Technology (IT)',
    'Maps "Information Technology" -> "Information Technology (IT)"'
  );
  assert(
    normalizeSastraDepartment('B.Tech in IT') === 'Information Technology (IT)',
    'Maps "B.Tech in IT" -> "Information Technology (IT)"'
  );
  assert(
    normalizeSastraDepartment('Dept of IT') === 'Information Technology (IT)',
    'Maps "Dept of IT" -> "Information Technology (IT)"'
  );
  assert(
    normalizeSastraDepartment('Computer Science and Engineering') === 'Computer Science Engineering (CSE)',
    'Maps "Computer Science and Engineering" -> "Computer Science Engineering (CSE)"'
  );
  assert(
    normalizeSastraDepartment('Computer Science & Business Systems') === 'Computer Science & Business Systems (CSBS)',
    'Maps "Computer Science & Business Systems" -> "Computer Science & Business Systems (CSBS)"'
  );
  assert(
    normalizeSastraDepartment('Artificial Intelligence and Data Science') === 'Computer Science (AI & DS)',
    'Maps "Artificial Intelligence and Data Science" -> "Computer Science (AI & DS)"'
  );
  assert(
    normalizeSastraDepartment('Electronics and Communication Engineering') === 'Electronics & Communication Engineering (ECE)',
    'Maps "Electronics and Communication Engineering" -> "Electronics & Communication Engineering (ECE)"'
  );

  // =========================================================================
  // TEST GROUP 3: Structured Entity Extraction & Data Normalization
  // =========================================================================
  console.log('\n[Test Group 3] Structured Entity Extraction & Normalization...');

  const extractedData = extractStructuredResumeData(validResumeText);
  assert(extractedData.extracted.fullName === 'Shaik Haroon Irfan', 'Extracted exact Full Name');
  assert(extractedData.extracted.rollNumber === '127015088', 'Extracted 9-digit SASTRA Roll Number');
  assert(extractedData.extracted.department === 'Information Technology (IT)', 'Extracted normalized IT Department');
  assert(extractedData.extracted.degree === 'B.Tech', 'Extracted B.Tech degree');
  assert(extractedData.extracted.graduationYear === 2026, 'Extracted 2026 graduation year');
  assert(extractedData.extracted.cgpa === '8.75', 'Extracted and normalized CGPA from "8.75 / 10"');
  assert(extractedData.extracted.github === 'https://github.com/shaikharoon', 'Extracted GitHub profile');
  assert(extractedData.extracted.linkedin === 'https://linkedin.com/in/shaikharoon', 'Extracted LinkedIn profile');
  assert(extractedData.extracted.leetcode === 'https://leetcode.com/u/shaikharoon', 'Extracted LeetCode profile');
  assert(extractedData.extracted.programmingLanguages.includes('Java'), 'Extracted Java in programming languages');
  assert(extractedData.extracted.frameworks.includes('React'), 'Extracted React in frameworks');
  assert(extractedData.extracted.technologies.includes('Docker'), 'Extracted Docker in technologies');

  // =========================================================================
  // TEST GROUP 4: Zero Guessing (Missing fields remain empty)
  // =========================================================================
  console.log('\n[Test Group 4] Zero Guessing on Missing Fields...');

  const resumeWithoutCgpa = `
    Rohan Sharma
    Email: 127019999@sastra.ac.in
    EDUCATION: SASTRA University - Mechanical Engineering (MECH), Batch 2027
    SKILLS: AutoCAD, SolidWorks, Python, MATLAB
    PROJECTS: Electric Vehicle Gearbox Design
  `;
  const noCgpaData = extractStructuredResumeData(resumeWithoutCgpa);
  assert(noCgpaData.extracted.cgpa === undefined, 'CGPA is undefined when not in resume (never guessed)');
  assert(noCgpaData.extracted.section === undefined, 'Section is undefined when not in resume (never guessed)');
  assert(noCgpaData.extracted.department === 'Mechanical Engineering (MECH)', 'Correctly identified MECH');

  // =========================================================================
  // TEST GROUP 5: Conflict Detection (Database vs Resume)
  // =========================================================================
  console.log('\n[Test Group 5] Conflict Detection (Database Profile vs Resume)...');

  const existingDbUser = {
    email: '127015088@sastra.ac.in',
    department: 'Information Technology (IT)',
    cgpa: '8.54',
  };

  const resumeWithDifferentDept = `
    Shaik Haroon Irfan
    Email: 127015088@sastra.ac.in
    EDUCATION: SASTRA University - Computer Science and Engineering, CGPA: 9.10
    SKILLS: Java, Spring Boot, React, AWS
  `;
  const conflictData = extractStructuredResumeData(resumeWithDifferentDept, existingDbUser);
  assert(conflictData.conflicts.length >= 1, 'Detected conflict between DB and Resume');
  const deptConflict = conflictData.conflicts.find((c) => c.field === 'department');
  assert(
    deptConflict && deptConflict.current === 'Information Technology (IT)' && deptConflict.extracted === 'Computer Science Engineering (CSE)',
    'Identified department conflict (DB: IT vs Resume: CSE)'
  );

  console.log(`\n========================================`);
  console.log(`Test Results: ${passed} Passed, ${failed} Failed`);
  console.log(`========================================\n`);

  if (failed === 0) {
    console.log('🎉 ALL RESUME VALIDATION & EXTRACTION TESTS PASSED PERFECTLY!\n');
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTestSuite();
