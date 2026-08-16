/**
 * Client-Side Resume Parser & Extraction Engine
 * 
 * Extracts structured student profile information from PDF, DOCX, DOC, or TXT resume files:
 * - Personal details (Full Name, SASTRA Email, Phone)
 * - Academic details (Roll Number, Department, Degree, Graduation Year, CGPA)
 * - Career details (Placement Goal, Objective, Target Roles, Bio)
 * - Technical stack (Programming Languages, Frameworks, Tools/Technologies)
 * - Coding & Social profiles (GitHub, LinkedIn, LeetCode, Codeforces, CodeChef)
 */

import { SASTRA_DEPARTMENTS } from './profileCompletion';

/**
 * Normalizes and extracts plain text from a File object
 */
export async function extractTextFromFile(file) {
  if (!file) return '';

  const fileName = file.name.toLowerCase();

  // 1. Plain Text or Markdown file
  if (fileName.endsWith('.txt') || fileName.endsWith('.md')) {
    return await file.text();
  }

  // 2. PDF or Binary document extraction
  // Reads ArrayBuffer and extracts text chunks from ASCII / UTF-8 streams
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);

  // Extract readable ASCII and UTF-8 strings from binary stream
  let rawText = '';
  let currentWord = '';

  for (let i = 0; i < bytes.length; i++) {
    const byte = bytes[i];
    // Printable ASCII characters (32 to 126) + newlines and tabs
    if ((byte >= 32 && byte <= 126) || byte === 10 || byte === 13 || byte === 9) {
      currentWord += String.fromCharCode(byte);
    } else {
      if (currentWord.length >= 2) {
        rawText += currentWord + ' ';
      }
      currentWord = '';
    }
  }
  if (currentWord.length >= 2) {
    rawText += currentWord;
  }

  // Clean up PDF stream metadata artifacts (like /Filter, /Length, stream, endstream, etc.)
  let cleaned = rawText
    .replace(/<<[\s\S]*?>>/g, ' ')
    .replace(/\b(stream|endstream|endobj|obj|xref|trailer|startxref)\b/gi, ' ')
    .replace(/\\[0-9]{3}/g, ' ')
    .replace(/\\r|\\n|\\t/g, ' ')
    .replace(/\s+/g, ' ');

  return cleaned;
}

/**
 * Parse extracted text into structured student profile fields
 */
export function parseResumeText(text, existingUser = null) {
  if (!text || typeof text !== 'string') {
    return {
      extracted: {},
      detectionStatus: {},
      hasExtractedData: false,
    };
  }

  const cleanText = text.replace(/\r\n/g, '\n');
  const lowerText = cleanText.toLowerCase();

  const extracted = {};
  const detectionStatus = {};

  // 1. Email extraction (prefer @sastra.ac.in)
  const sastraEmailMatch = cleanText.match(/\b([a-zA-Z0-9._%+-]+@sastra\.ac\.in)\b/i);
  const generalEmailMatch = cleanText.match(/\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/);
  if (sastraEmailMatch) {
    extracted.email = sastraEmailMatch[1].toLowerCase();
    detectionStatus.email = true;
  } else if (generalEmailMatch) {
    extracted.email = generalEmailMatch[1].toLowerCase();
    detectionStatus.email = true;
  } else if (existingUser?.email) {
    extracted.email = existingUser.email;
  }

  // 2. SASTRA Roll Number (9 digits, often starting with 127 or similar)
  const rollMatch = cleanText.match(/\b(12\d{7}|\d{9})\b/);
  if (rollMatch) {
    extracted.rollNumber = rollMatch[1];
    detectionStatus.rollNumber = true;
  } else if (existingUser?.rollNumber || existingUser?.rollNo) {
    extracted.rollNumber = existingUser.rollNumber || existingUser.rollNo;
  }

  // 3. Full Name (from header or before email)
  const lines = cleanText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith('http') && !l.includes('@'));
  
  if (lines.length > 0) {
    const candidate = lines[0].replace(/[^a-zA-Z\s.]/g, '').trim();
    if (candidate.length >= 3 && candidate.length <= 40 && candidate.split(' ').length <= 4) {
      extracted.fullName = candidate;
      detectionStatus.fullName = true;
    }
  }
  if (!extracted.fullName && existingUser?.fullName) {
    extracted.fullName = existingUser.fullName;
  }

  // 4. CGPA / GPA (e.g. "CGPA: 8.75", "GPA: 9.1", "8.54 / 10", "8.85 CGPA")
  const cgpaPatterns = [
    /(?:cgpa|gpa|score|grade)\s*(?:is|:|=|-)?\s*([0-9]\.[0-9]{1,2})/i,
    /([0-9]\.[0-9]{1,2})\s*(?:\/|\s*out of\s*)\s*10/i,
    /([0-9]\.[0-9]{1,2})\s*(?:cgpa|gpa)/i,
  ];
  for (const pattern of cgpaPatterns) {
    const match = cleanText.match(pattern);
    if (match) {
      const val = parseFloat(match[1]);
      if (!isNaN(val) && val >= 5.0 && val <= 10.0) {
        extracted.cgpa = val.toFixed(2);
        detectionStatus.cgpa = true;
        break;
      }
    }
  }

  // 5. Department / Branch mapping to SASTRA_DEPARTMENTS
  let detectedDept = null;
  if (lowerText.includes('computer science and business') || lowerText.includes('csbs')) {
    detectedDept = 'Computer Science & Business Systems (CSBS)';
  } else if (lowerText.includes('artificial intelligence') || lowerText.includes('ai & ds') || lowerText.includes('ai and data science')) {
    detectedDept = 'Computer Science (AI & DS)';
  } else if (lowerText.includes('cyber security') || lowerText.includes('blockchain')) {
    detectedDept = 'CSE (Cyber Security & Blockchain)';
  } else if (lowerText.includes('information technology') || lowerText.includes('dept of it') || lowerText.includes('b.tech it')) {
    detectedDept = 'Information Technology (IT)';
  } else if (lowerText.includes('computer science') || lowerText.includes('cse')) {
    detectedDept = 'Computer Science Engineering (CSE)';
  } else if (lowerText.includes('electronics and communication') || lowerText.includes('ece')) {
    detectedDept = 'Electronics & Communication Engineering (ECE)';
  } else if (lowerText.includes('electrical and electronics') || lowerText.includes('eee')) {
    detectedDept = 'Electrical & Electronics Engineering (EEE)';
  } else if (lowerText.includes('mechanical engineering') || lowerText.includes('mech')) {
    detectedDept = 'Mechanical Engineering (MECH)';
  } else if (lowerText.includes('mechatronics')) {
    detectedDept = 'Mechatronics (MCT)';
  } else if (lowerText.includes('civil engineering')) {
    detectedDept = 'Civil Engineering (CIVIL)';
  } else if (lowerText.includes('biotechnology')) {
    detectedDept = 'Biotechnology (BIOTECH)';
  } else if (lowerText.includes('chemical engineering')) {
    detectedDept = 'Chemical Engineering (CHE)';
  }

  if (detectedDept) {
    extracted.department = detectedDept;
    detectionStatus.department = true;
  }

  // 6. Degree (B.Tech, M.Tech, etc.)
  if (lowerText.includes('m.tech') || lowerText.includes('master of technology')) {
    extracted.degree = 'M.Tech';
    detectionStatus.degree = true;
  } else if (lowerText.includes('b.tech') || lowerText.includes('bachelor of technology') || lowerText.includes('b.e')) {
    extracted.degree = 'B.Tech';
    detectionStatus.degree = true;
  }

  // 7. Graduation Year / Batch (2024 to 2030)
  const gradYearMatch = cleanText.match(/\b(202[4-9]|2030)\b/);
  if (gradYearMatch) {
    extracted.graduationYear = parseInt(gradYearMatch[1], 10);
    detectionStatus.graduationYear = true;
  }

  // 8. Social & Coding Profiles (GitHub, LinkedIn, LeetCode, Codeforces, CodeChef)
  const githubMatch = cleanText.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9_-]+)/i);
  if (githubMatch) {
    extracted.github = `https://github.com/${githubMatch[1]}`;
    detectionStatus.github = true;
  }

  const linkedinMatch = cleanText.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/([a-zA-Z0-9_-]+)/i);
  if (linkedinMatch) {
    extracted.linkedin = `https://linkedin.com/in/${linkedinMatch[1]}`;
    detectionStatus.linkedin = true;
  }

  const leetcodeMatch = cleanText.match(/(?:https?:\/\/)?(?:www\.)?leetcode\.com\/(?:u\/)?([a-zA-Z0-9_-]+)/i);
  if (leetcodeMatch) {
    extracted.leetcode = `https://leetcode.com/u/${leetcodeMatch[1]}`;
    detectionStatus.leetcode = true;
  }

  const codeforcesMatch = cleanText.match(/(?:https?:\/\/)?(?:www\.)?codeforces\.com\/profile\/([a-zA-Z0-9_.-]+)/i);
  if (codeforcesMatch) {
    extracted.codeforces = `https://codeforces.com/profile/${codeforcesMatch[1]}`;
    detectionStatus.codeforces = true;
  }

  const codechefMatch = cleanText.match(/(?:https?:\/\/)?(?:www\.)?codechef\.com\/users\/([a-zA-Z0-9_]+)/i);
  if (codechefMatch) {
    extracted.codechef = `https://codechef.com/users/${codechefMatch[1]}`;
    detectionStatus.codechef = true;
  }

  // 9. Technical Skills Extraction
  const KNOWN_LANGUAGES = [
    'Java', 'Python', 'C++', 'C', 'JavaScript', 'TypeScript', 'Go', 'Rust', 'Kotlin', 'SQL', 'HTML', 'CSS', 'PHP', 'R', 'Swift', 'Dart'
  ];
  const detectedLanguages = KNOWN_LANGUAGES.filter((lang) => {
    const regex = new RegExp(`\\b${lang.replace('+', '\\+')}\\b`, 'i');
    return regex.test(cleanText);
  });
  if (detectedLanguages.length > 0) {
    extracted.programmingLanguages = detectedLanguages.join(', ');
    detectionStatus.programmingLanguages = true;
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
    detectionStatus.frameworks = true;
  }

  const KNOWN_TOOLS = [
    'Git', 'GitHub', 'Docker', 'Kubernetes', 'AWS', 'PostgreSQL', 'MongoDB', 'MySQL', 'Redis', 'Linux', 'GCP', 'Azure', 'Firebase', 'GraphQL', 'Postman', 'Jira'
  ];
  const detectedTools = KNOWN_TOOLS.filter((tool) => {
    const regex = new RegExp(`\\b${tool}\\b`, 'i');
    return regex.test(cleanText);
  });
  if (detectedTools.length > 0) {
    extracted.technologies = detectedTools.join(', ');
    detectionStatus.technologies = true;
  }

  // 10. Placement Goal & Career Objective
  if (lowerText.includes('full stack') || lowerText.includes('mern')) {
    extracted.placementGoal = 'Full Stack Developer';
    detectionStatus.placementGoal = true;
  } else if (lowerText.includes('data science') || lowerText.includes('data scientist') || lowerText.includes('machine learning')) {
    extracted.placementGoal = 'Data Scientist';
  } else if (lowerText.includes('backend') || lowerText.includes('api developer')) {
    extracted.placementGoal = 'Backend Developer';
  } else if (lowerText.includes('software engineer') || lowerText.includes('sde') || lowerText.includes('software developer')) {
    extracted.placementGoal = 'Software Engineer (SDE-1)';
    detectionStatus.placementGoal = true;
  }

  // 11. Interested Roles mapping
  const possibleRoles = [
    'Software Engineer', 'Full Stack Developer', 'Backend Developer', 'Frontend Developer', 'Data Scientist', 'AI Engineer', 'DevOps Engineer', 'Product Engineer'
  ];
  const matchedRoles = possibleRoles.filter((role) => lowerText.includes(role.toLowerCase()));
  if (matchedRoles.length > 0) {
    extracted.interestedRoles = matchedRoles;
    detectionStatus.interestedRoles = true;
  }

  // 12. Bio / Summary extraction
  const summaryMatch = cleanText.match(/(?:summary|objective|about me|profile)[:\s\n]+([^\n]{30,200})/i);
  if (summaryMatch) {
    extracted.bio = summaryMatch[1].trim();
    detectionStatus.bio = true;
  }

  const detectedCount = Object.keys(detectionStatus).length;

  return {
    extracted,
    detectionStatus,
    hasExtractedData: detectedCount > 0,
    detectedCount,
  };
}
