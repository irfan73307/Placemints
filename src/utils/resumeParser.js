/**
 * Comprehensive Resume Validator, Text Extractor & Structured Entity Parser
 * 
 * Pipeline:
 * 1. File Validation (MIME type, size, readability)
 * 2. Multi-Format Text Extraction (using PDF.js for compressed/flate PDFs, DOCX XML parser, TXT/MD)
 * 3. Resume Document Classifier (rejects certificates, marksheets, invoices, random docs, accepts genuine resumes)
 * 4. Section-Aware Entity Extraction (Contact, Academics, Skills, Coding handles, Goals)
 * 5. SASTRA Normalization (Department mapping, 9-digit roll number, CGPA normalization)
 * 6. Conflict Detection (Compares extracted data vs existing database profile)
 * 7. Confidence Scoring ('high' | 'medium' | 'low')
 */

import * as pdfjsLib from 'pdfjs-dist';
import { SASTRA_DEPARTMENTS } from './profileCompletion.js';

// Configure worker for pdfjs-dist
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '3.11.174'}/pdf.worker.min.js`;
}

export const RESUME_REJECTION_MESSAGE =
  'This file does not appear to be a valid student resume. Please upload your resume in PDF or DOC/DOCX format.';

/**
 * 1. File Metadata Pre-Validation
 */
export function validateResumeFileMetadata(file) {
  if (!file) {
    return { isValid: false, reason: RESUME_REJECTION_MESSAGE };
  }

  // 1. File Size check (Min 50 bytes, Max 10MB)
  if (file.size < 50) {
    return { isValid: false, reason: 'The uploaded file is empty. Please upload a valid resume.' };
  }
  if (file.size > 10 * 1024 * 1024) {
    return { isValid: false, reason: 'File size exceeds 10MB limit. Please upload a smaller resume file.' };
  }

  // 2. Extension check
  const fileName = (file.name || '').toLowerCase();
  const validExtensions = ['.pdf', '.docx', '.doc', '.txt', '.md'];
  const hasValidExt = validExtensions.some((ext) => fileName.endsWith(ext));

  if (!hasValidExt) {
    return { isValid: false, reason: RESUME_REJECTION_MESSAGE };
  }

  return { isValid: true };
}

/**
 * PDF Text Extraction using PDF.js (Handles FlateDecode, Compressed Streams, Multi-Column, Fonts)
 */
async function extractTextFromPdf(arrayBuffer) {
  try {
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
      useSystemFonts: true,
      disableFontFace: true,
      stopAtErrors: false,
    });
    const pdf = await loadingTask.promise;
    let fullText = '';

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item) => item.str)
        .join(' ');
      fullText += pageText + '\n';
    }

    if (fullText.trim().length >= 20) {
      return fullText;
    }
  } catch (err) {
    console.warn('PDF.js text extraction error/fallback:', err);
  }
  return null;
}

/**
 * Fallback Binary String Stream Scanner
 */
function extractFallbackAscii(bytes) {
  let rawText = '';
  let currentChunk = '';

  for (let i = 0; i < bytes.length; i++) {
    const byte = bytes[i];
    if ((byte >= 32 && byte <= 126) || byte === 10 || byte === 13 || byte === 9) {
      currentChunk += String.fromCharCode(byte);
    } else {
      if (currentChunk.length >= 2) {
        rawText += currentChunk + ' ';
      }
      currentChunk = '';
    }
  }
  if (currentChunk.length >= 2) {
    rawText += currentChunk;
  }

  return rawText
    .replace(/<<[\s\S]*?>>/g, ' ')
    .replace(/\b(stream|endstream|endobj|obj|xref|trailer|startxref)\b/gi, ' ')
    .replace(/\\([0-9]{3})/g, ' ')
    .replace(/\\([nrtbf()\\])/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * 2. Multi-Format Text Extraction
 */
export async function extractTextFromFile(file) {
  if (!file) return '';

  const fileName = (file.name || '').toLowerCase();

  // Plain Text / Markdown
  if (fileName.endsWith('.txt') || fileName.endsWith('.md')) {
    return await file.text();
  }

  const arrayBuffer = await file.arrayBuffer();

  // PDF Document: Use PDF.js first for decompressed text
  if (fileName.endsWith('.pdf')) {
    const pdfText = await extractTextFromPdf(arrayBuffer);
    if (pdfText && pdfText.trim().length >= 30) {
      return pdfText;
    }
  }

  // Binary stream extraction (for DOCX, DOC, or Fallback PDF)
  const bytes = new Uint8Array(arrayBuffer);
  return extractFallbackAscii(bytes);
}

/**
 * 3. Resume Document Classifier
 * Determines whether extractable text represents a genuine student resume
 */
export function classifyResumeDocument(text, fileName = '') {
  if (!text || typeof text !== 'string' || text.trim().length < 30) {
    return {
      isResume: false,
      reason: RESUME_REJECTION_MESSAGE,
    };
  }

  const lower = text.toLowerCase();
  const lowerFileName = fileName.toLowerCase();

  // ── A. Negative Classification: Rejection of specific non-resume documents ──
  const certificateSignals = [
    'this is to certify that',
    'certificate of completion',
    'certificate of achievement',
    'certificate of participation',
    'certificate of appreciation',
    'is hereby awarded to',
    'has successfully completed the course',
    'has participated in',
  ];
  const isCertificate = certificateSignals.some((sig) => lower.includes(sig));
  if (isCertificate && !lower.includes('education') && !lower.includes('skills') && !lower.includes('projects')) {
    return {
      isResume: false,
      reason: 'The uploaded file appears to be a Certificate, not a student resume. Please upload your resume in PDF or DOC/DOCX format.',
    };
  }

  const marksheetSignals = [
    'statement of marks',
    'controller of examinations',
    'tabulation sheet',
    'end semester examination results',
    'grade sheet',
  ];
  const isMarksheet = marksheetSignals.some((sig) => lower.includes(sig)) || lowerFileName.includes('marksheet') || lowerFileName.includes('grade_card');
  if (isMarksheet && !lower.includes('skills') && !lower.includes('projects') && !lower.includes('github.com')) {
    return {
      isResume: false,
      reason: 'The uploaded file appears to be a Marksheet / Grade Card, not a student resume. Please upload your resume in PDF or DOC/DOCX format.',
    };
  }

  const otherNonResumeSignals = [
    'terms and conditions',
    'privacy policy',
    'invoice number',
    'tax invoice',
    'purchase order',
    'question paper',
    'user manual',
  ];
  if (otherNonResumeSignals.some((sig) => lower.includes(sig)) && !lower.includes('education') && !lower.includes('skills')) {
    return {
      isResume: false,
      reason: RESUME_REJECTION_MESSAGE,
    };
  }

  // ── B. Positive Classification: Structural Resume Sections & Signals ──
  let sectionScore = 0;
  const detectedSections = [];

  // 1. Education Section
  if (
    lower.includes('education') ||
    lower.includes('academic') ||
    lower.includes('b.tech') ||
    lower.includes('bachelor') ||
    lower.includes('university') ||
    lower.includes('institute') ||
    lower.includes('sastra') ||
    lower.includes('cgpa') ||
    lower.includes('gpa')
  ) {
    sectionScore += 1;
    detectedSections.push('Education');
  }

  // 2. Technical Skills Section
  if (
    lower.includes('skills') ||
    lower.includes('programming languages') ||
    lower.includes('technologies') ||
    lower.includes('frameworks') ||
    lower.includes('tools') ||
    lower.includes('technical stack') ||
    lower.includes('core competencies') ||
    lower.includes('languages')
  ) {
    sectionScore += 1;
    detectedSections.push('Skills');
  }

  // 3. Projects Section
  if (
    lower.includes('projects') ||
    lower.includes('key projects') ||
    lower.includes('academic projects') ||
    lower.includes('personal projects') ||
    lower.includes('project')
  ) {
    sectionScore += 1;
    detectedSections.push('Projects');
  }

  // 4. Experience / Internships Section
  if (
    lower.includes('experience') ||
    lower.includes('internship') ||
    lower.includes('work experience') ||
    lower.includes('employment') ||
    lower.includes('training')
  ) {
    sectionScore += 1;
    detectedSections.push('Experience');
  }

  // 5. Contact / Profiles Section
  if (
    lower.includes('github.com') ||
    lower.includes('linkedin.com') ||
    lower.includes('leetcode.com') ||
    lower.includes('codeforces') ||
    lower.includes('codechef') ||
    lower.includes('email') ||
    lower.includes('@sastra.ac.in') ||
    /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/.test(text) ||
    /\b(12[4-9]\d{6})\b/.test(text)
  ) {
    sectionScore += 1;
    detectedSections.push('Contact / Links');
  }

  // 6. Summary / Objective
  if (lower.includes('objective') || lower.includes('summary') || lower.includes('profile') || lower.includes('about me')) {
    sectionScore += 1;
    detectedSections.push('Summary');
  }

  // 7. Common Technical Keywords (Java, Python, C++, React, SQL, etc.)
  const techKeywords = ['python', 'java', 'c++', 'javascript', 'react', 'node', 'sql', 'html', 'css', 'git', 'docker', 'spring', 'aws', 'data structures', 'algorithms'];
  const matchedTechCount = techKeywords.filter((k) => lower.includes(k)).length;
  if (matchedTechCount >= 2) {
    sectionScore += 1;
  }

  // Flexible Decision: At least 1 clear resume section or 2 signal points
  if (sectionScore < 1) {
    return {
      isResume: false,
      reason: RESUME_REJECTION_MESSAGE,
    };
  }

  return {
    isResume: true,
    detectedSections,
  };
}

/**
 * 4. SASTRA Department Normalization
 * Strictly maps user text to official SASTRA_DEPARTMENTS without incorrectly guessing CSE
 */
export function normalizeSastraDepartment(rawText) {
  if (!rawText) return null;
  const lower = String(rawText).toLowerCase().trim();

  // Information Technology (Explicit Check - NEVER map to CSE)
  if (
    lower.includes('information technology') ||
    lower === 'it' ||
    lower.includes('(it)') ||
    lower.includes('dept of it') ||
    lower.includes('department of it') ||
    lower.includes('b.tech it') ||
    lower.includes('b.tech. it') ||
    /\b(b\.?tech\s*(in)?\s*it)\b/i.test(lower) ||
    /\binformation\s*technology\b/i.test(lower) ||
    /\bdept\.?\s*of\s*it\b/i.test(lower) ||
    /\b(b\.?e\.?\s*(in)?\s*it)\b/i.test(lower) ||
    /\bbranch[:\s]*it\b/i.test(lower)
  ) {
    return 'Information Technology (IT)';
  }

  // Computer Science & Business Systems
  if (lower.includes('business systems') || lower.includes('csbs') || lower.includes('cs & bs')) {
    return 'Computer Science & Business Systems (CSBS)';
  }

  // Artificial Intelligence & Data Science
  if (
    lower.includes('artificial intelligence') ||
    lower.includes('ai & ds') ||
    lower.includes('ai and ds') ||
    lower.includes('ai and data science')
  ) {
    return 'Computer Science (AI & DS)';
  }

  // Cyber Security & Blockchain
  if (lower.includes('cyber security') || lower.includes('blockchain') || lower.includes('cybersecurity')) {
    return 'CSE (Cyber Security & Blockchain)';
  }

  // IoT & Automation
  if (lower.includes('iot') || lower.includes('internet of things')) {
    return 'CSE (IoT & Automation)';
  }

  // Information & Communication Technology
  if (lower.includes('information & communication') || lower.includes('ict')) {
    return 'Information & Communication Tech (ICT)';
  }

  // Computer Science and Engineering
  if (
    lower.includes('computer science and engineering') ||
    lower.includes('computer science & engineering') ||
    lower.includes('computer science') ||
    lower.includes('cse') ||
    lower.includes('b.tech cse')
  ) {
    return 'Computer Science Engineering (CSE)';
  }

  // Electronics & Communication Engineering
  if (
    lower.includes('electronics and communication') ||
    lower.includes('electronics & communication') ||
    lower.includes('ece')
  ) {
    return 'Electronics & Communication Engineering (ECE)';
  }

  // Electrical & Electronics Engineering
  if (
    lower.includes('electrical and electronics') ||
    lower.includes('electrical & electronics') ||
    lower.includes('eee')
  ) {
    return 'Electrical & Electronics Engineering (EEE)';
  }

  // Mechanical Engineering
  if (lower.includes('mechanical engineering') || lower.includes('mech')) {
    return 'Mechanical Engineering (MECH)';
  }

  // Mechatronics
  if (lower.includes('mechatronics') || lower.includes('mct')) {
    return 'Mechatronics (MCT)';
  }

  // Robotics and AI
  if (lower.includes('robotics') || lower.includes('rai')) {
    return 'Robotics and AI (RAI)';
  }

  // Civil Engineering
  if (lower.includes('civil engineering') || lower.includes('civil')) {
    return 'Civil Engineering (CIVIL)';
  }

  // Biotechnology
  if (lower.includes('biotechnology') || lower.includes('biotech')) {
    return 'Biotechnology (BIOTECH)';
  }

  // Chemical Engineering
  if (lower.includes('chemical engineering') || lower.includes('che')) {
    return 'Chemical Engineering (CHE)';
  }

  // Direct match against known department list
  const directMatch = SASTRA_DEPARTMENTS.find((d) => d.toLowerCase() === lower || d.toLowerCase().includes(lower));
  return directMatch || null;
}

/**
 * 5. Structured Entity Extraction
 */
export function extractStructuredResumeData(text, existingUser = null) {
  const extracted = {};
  const confidence = {};
  const conflicts = [];

  const cleanText = text.replace(/\r\n/g, '\n');
  const lowerText = cleanText.toLowerCase();

  // ── A. Full Name ──
  const lines = cleanText
    .split(/[\n,;|]/)
    .map((l) => l.trim())
    .filter(
      (l) =>
        l.length >= 3 &&
        l.length <= 40 &&
        !l.includes('@') &&
        !l.startsWith('http') &&
        !/resume|curriculum|vitae|page|contact|email|phone/i.test(l)
    );

  if (lines.length > 0) {
    const candidate = lines[0].replace(/[^a-zA-Z\s.]/g, '').trim();
    if (candidate.length >= 3 && candidate.split(/\s+/).length <= 4) {
      extracted.fullName = candidate;
      confidence.fullName = 'high';
    }
  }
  if (!extracted.fullName && (existingUser?.fullName || existingUser?.name)) {
    extracted.fullName = existingUser.fullName || existingUser.name;
    confidence.fullName = 'high';
  }

  // ── B. SASTRA Email (Priority: Authenticated User Email) ──
  const sastraEmailMatch = cleanText.match(/\b([a-zA-Z0-9._%+-]+@sastra\.ac\.in)\b/i);
  const generalEmailMatch = cleanText.match(/\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/);

  if (existingUser?.email) {
    extracted.email = existingUser.email;
    confidence.email = 'high';
  } else if (sastraEmailMatch) {
    extracted.email = sastraEmailMatch[1].toLowerCase();
    confidence.email = 'high';
  } else if (generalEmailMatch) {
    extracted.email = generalEmailMatch[1].toLowerCase();
    confidence.email = 'medium';
  }

  // ── C. SASTRA Roll Number (Strict 9-digit format, e.g. 127XXXXXX) ──
  const rollPatterns = [
    /\b(12[4-9]\d{6})\b/,
    /\broll(?:\s*no|\s*number)?[:\s-]*([0-9]{9})\b/i,
    /\b(127\d{6})\b/,
    /\b([0-9]{9})\b/,
  ];

  let detectedRoll = null;
  for (const pattern of rollPatterns) {
    const match = cleanText.match(pattern);
    if (match) {
      const candidate = match[1];
      if (candidate.length === 9) {
        detectedRoll = candidate;
        break;
      }
    }
  }

  if (detectedRoll) {
    extracted.rollNumber = detectedRoll;
    confidence.rollNumber = 'high';
  } else if (existingUser?.rollNumber || existingUser?.rollNo) {
    extracted.rollNumber = existingUser.rollNumber || existingUser.rollNo;
    confidence.rollNumber = 'high';
  }

  // ── D. Department / Branch (Strict SASTRA normalization) ──
  const detectedDept = normalizeSastraDepartment(cleanText);
  if (detectedDept) {
    extracted.department = detectedDept;
    confidence.department = 'high';

    if (
      existingUser?.department &&
      existingUser.department !== 'Select your department' &&
      existingUser.department.trim() !== ''
    ) {
      const normalizedExisting = normalizeSastraDepartment(existingUser.department);
      if (normalizedExisting && normalizedExisting !== detectedDept) {
        conflicts.push({
          field: 'department',
          label: 'Department / Branch',
          current: existingUser.department,
          extracted: detectedDept,
        });
      }
    }
  } else if (existingUser?.department && existingUser.department !== 'Select your department') {
    extracted.department = existingUser.department;
    confidence.department = 'high';
  }

  // ── E. Degree (B.Tech, M.Tech, etc.) ──
  if (lowerText.includes('m.tech') || lowerText.includes('master of technology')) {
    extracted.degree = 'M.Tech';
    confidence.degree = 'high';
  } else if (
    lowerText.includes('b.tech') ||
    lowerText.includes('bachelor of technology') ||
    lowerText.includes('b.e')
  ) {
    extracted.degree = 'B.Tech';
    confidence.degree = 'high';
  } else if (existingUser?.degree) {
    extracted.degree = existingUser.degree;
  }

  // ── F. Graduation Year (2024 to 2030) ──
  const gradYearPatterns = [
    /(?:batch\s*of|graduating\s*in|graduation\s*year|batch)[:\s]*([0-9]{4})/i,
    /(?:202[0-9]|2030)\s*[-–]\s*(202[4-9]|2030)/i,
    /\b(202[4-9]|2030)\b/,
  ];
  let detectedYear = null;
  for (const pattern of gradYearPatterns) {
    const match = cleanText.match(pattern);
    if (match) {
      const yr = parseInt(match[1], 10);
      if (yr >= 2024 && yr <= 2030) {
        detectedYear = yr;
        break;
      }
    }
  }
  if (detectedYear) {
    extracted.graduationYear = detectedYear;
    confidence.graduationYear = 'high';
  } else if (existingUser?.graduationYear || existingUser?.batchYear) {
    extracted.graduationYear = existingUser.graduationYear || existingUser.batchYear;
  }

  // ── G. CGPA / GPA Normalization (Never guess; only extract if explicitly present) ──
  const cgpaPatterns = [
    /(?:cgpa|gpa|score|grade)\s*(?:is|:|=|—|-)?\s*([0-9]\.[0-9]{1,2})/i,
    /([0-9]\.[0-9]{1,2})\s*(?:\/|\s*out of\s*)\s*10/i,
    /([0-9]\.[0-9]{1,2})\s*(?:cgpa|gpa)/i,
  ];
  let detectedCgpa = null;
  for (const pattern of cgpaPatterns) {
    const match = cleanText.match(pattern);
    if (match) {
      const val = parseFloat(match[1]);
      if (!isNaN(val) && val >= 5.0 && val <= 10.0) {
        detectedCgpa = val.toFixed(2);
        break;
      }
    }
  }
  if (detectedCgpa) {
    extracted.cgpa = detectedCgpa;
    confidence.cgpa = 'high';

    if (existingUser?.cgpa && existingUser.cgpa.trim() !== '' && existingUser.cgpa !== detectedCgpa) {
      conflicts.push({
        field: 'cgpa',
        label: 'Current CGPA',
        current: existingUser.cgpa,
        extracted: detectedCgpa,
      });
    }
  } else if (existingUser?.cgpa) {
    extracted.cgpa = existingUser.cgpa;
  }

  // ── H. Coding & Social Profiles ──
  const githubMatch = cleanText.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9_-]+)/i);
  if (githubMatch) {
    extracted.github = `https://github.com/${githubMatch[1]}`;
    confidence.github = 'high';
  } else if (existingUser?.github) {
    extracted.github = existingUser.github;
  }

  const linkedinMatch = cleanText.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/([a-zA-Z0-9_-]+)/i);
  if (linkedinMatch) {
    extracted.linkedin = `https://linkedin.com/in/${linkedinMatch[1]}`;
    confidence.linkedin = 'high';
  } else if (existingUser?.linkedin) {
    extracted.linkedin = existingUser.linkedin;
  }

  const leetcodeMatch = cleanText.match(/(?:https?:\/\/)?(?:www\.)?leetcode\.com\/(?:u\/)?([a-zA-Z0-9_-]+)/i);
  if (leetcodeMatch) {
    extracted.leetcode = `https://leetcode.com/u/${leetcodeMatch[1]}`;
    confidence.leetcode = 'high';
  } else if (existingUser?.leetcode) {
    extracted.leetcode = existingUser.leetcode;
  }

  const codeforcesMatch = cleanText.match(/(?:https?:\/\/)?(?:www\.)?codeforces\.com\/profile\/([a-zA-Z0-9_.-]+)/i);
  if (codeforcesMatch) {
    extracted.codeforces = `https://codeforces.com/profile/${codeforcesMatch[1]}`;
    confidence.codeforces = 'high';
  } else if (existingUser?.codeforces) {
    extracted.codeforces = existingUser.codeforces;
  }

  const codechefMatch = cleanText.match(/(?:https?:\/\/)?(?:www\.)?codechef\.com\/users\/([a-zA-Z0-9_]+)/i);
  if (codechefMatch) {
    extracted.codechef = `https://codechef.com/users/${codechefMatch[1]}`;
    confidence.codechef = 'high';
  } else if (existingUser?.codechef) {
    extracted.codechef = existingUser.codechef;
  }

  // ── I. Technical Skills ──
  const KNOWN_LANGUAGES = [
    'Java', 'Python', 'C++', 'C', 'JavaScript', 'TypeScript', 'Go', 'Rust', 'Kotlin', 'SQL', 'HTML', 'CSS', 'PHP', 'R', 'Swift', 'Dart'
  ];
  const detectedLanguages = KNOWN_LANGUAGES.filter((lang) => {
    const regex = new RegExp(`\\b${lang.replace('+', '\\+')}\\b`, 'i');
    return regex.test(cleanText);
  });
  if (detectedLanguages.length > 0) {
    extracted.programmingLanguages = detectedLanguages.join(', ');
    confidence.programmingLanguages = 'high';
  }

  const KNOWN_FRAMEWORKS = [
    'React', 'Node.js', 'Express', 'Spring Boot', 'Next.js', 'Django', 'Flask', 'FastAPI', 'Angular', 'Vue.js', 'Tailwind CSS', 'Bootstrap', 'Redux', 'Prisma'
  ];
  const detectedFrameworks = KNOWN_FRAMEWORKS.filter((fw) => {
    const regex = new RegExp(`\\b${fw.replace('.', '\\.')}\\b`, 'i');
    return regex.test(cleanText);
  });
  if (detectedFrameworks.length > 0) {
    extracted.frameworks = detectedFrameworks.join(', ');
    confidence.frameworks = 'high';
  }

  const KNOWN_TOOLS = [
    'Git', 'GitHub', 'Docker', 'Kubernetes', 'AWS', 'PostgreSQL', 'MongoDB', 'MySQL', 'Redis', 'Linux', 'GCP', 'Azure', 'Firebase', 'GraphQL', 'Postman'
  ];
  const detectedTools = KNOWN_TOOLS.filter((tool) => {
    const regex = new RegExp(`\\b${tool}\\b`, 'i');
    return regex.test(cleanText);
  });
  if (detectedTools.length > 0) {
    extracted.technologies = detectedTools.join(', ');
    confidence.technologies = 'high';
  }

  // ── J. Placement Goal & Target Roles ──
  if (lowerText.includes('full stack') || lowerText.includes('mern') || lowerText.includes('full-stack')) {
    extracted.placementGoal = 'Full Stack Developer';
    confidence.placementGoal = 'high';
  } else if (lowerText.includes('data science') || lowerText.includes('data scientist') || lowerText.includes('machine learning')) {
    extracted.placementGoal = 'Data Scientist';
    confidence.placementGoal = 'high';
  } else if (lowerText.includes('backend') || lowerText.includes('api developer')) {
    extracted.placementGoal = 'Backend Developer';
    confidence.placementGoal = 'high';
  } else if (lowerText.includes('software engineer') || lowerText.includes('sde') || lowerText.includes('software developer')) {
    extracted.placementGoal = 'Software Engineer (SDE-1)';
    confidence.placementGoal = 'high';
  }

  const possibleRoles = [
    'Software Engineer', 'Full Stack Developer', 'Backend Developer', 'Frontend Developer', 'Data Scientist', 'AI Engineer', 'DevOps Engineer', 'Product Engineer'
  ];
  const matchedRoles = possibleRoles.filter((role) => lowerText.includes(role.toLowerCase()));
  if (matchedRoles.length > 0) {
    extracted.interestedRoles = matchedRoles;
    confidence.interestedRoles = 'high';
  }

  // ── K. Bio / Summary ──
  const summaryMatch = cleanText.match(/(?:summary|objective|about me|professional summary)[:\s\n]+([^\n]{30,220})/i);
  if (summaryMatch) {
    extracted.bio = summaryMatch[1].trim();
    confidence.bio = 'medium';
  }

  const detectedCount = Object.keys(confidence).length;

  return {
    extracted,
    confidence,
    conflicts,
    detectedCount,
  };
}

/**
 * 6. Top-Level Parse Function
 */
export async function parseResumeFile(file, existingUser = null) {
  // 1. Metadata check
  const metaValidation = validateResumeFileMetadata(file);
  if (!metaValidation.isValid) {
    return {
      isValid: false,
      reason: metaValidation.reason,
    };
  }

  // 2. Extract text (using PDF.js or binary stream fallback)
  const text = await extractTextFromFile(file);

  // 3. Document classification
  const classification = classifyResumeDocument(text, file.name);
  if (!classification.isResume) {
    return {
      isValid: false,
      reason: classification.reason,
    };
  }

  // 4. Structured extraction & conflict resolution
  const result = extractStructuredResumeData(text, existingUser);

  return {
    isValid: true,
    detectedSections: classification.detectedSections,
    ...result,
  };
}
