/**
 * Profile Completion Utility
 * 
 * Calculates weighted student profile completion percentage (0% to 100%)
 * and returns missing required/recommended items and smart student suggestions.
 * 
 * Weights Breakdown:
 * - Basic Information (Full Name, Email, Profile Photo, 9-Digit Roll Number): 20%
 * - Academic Information (Department, Degree, Section, Graduation Year, CGPA): 20%
 * - Career Information (Placement Goal, Interested Roles, Bio): 15%
 * - Technical Information (Programming Languages, Frameworks, Technologies): 15%
 * - Coding Profiles (GitHub, LinkedIn, LeetCode, Codeforces, CodeChef): 20%
 * - Resume Upload: 10%
 */

export function calculateProfileCompletion(user) {
  if (!user) {
    return {
      percentage: 0,
      missingItems: [],
      suggestions: ['Complete your profile to improve your placement preparation.'],
    };
  }

  let basicScore = 0;
  let academicScore = 0;
  let careerScore = 0;
  let techScore = 0;
  let codingScore = 0;
  let resumeScore = 0;

  const missingItems = [];
  const suggestions = [];

  // 1. Basic Information (20%)
  if (user.fullName || user.name) basicScore += 5;
  else missingItems.push('Full Name');

  if (user.email) basicScore += 5;
  else missingItems.push('SASTRA Email');

  if (user.avatar || user.avatarUrl) basicScore += 5;
  else missingItems.push('Profile Photo');

  if (user.rollNumber || user.rollNo) basicScore += 5;
  else {
    missingItems.push('Roll Number');
    suggestions.push('Add your 9-digit SASTRA roll number.');
  }

  // 2. Academic Information (20%)
  if (user.department || user.branch) academicScore += 4;
  else missingItems.push('Department');

  if (user.degree) academicScore += 4;
  else missingItems.push('Degree');

  if (user.section) academicScore += 4;
  else missingItems.push('Section');

  if (user.graduationYear || user.batchYear) academicScore += 4;
  else missingItems.push('Graduation Year');

  if (user.cgpa) academicScore += 4;
  else {
    missingItems.push('CGPA');
    suggestions.push('Add your current CGPA.');
  }

  // 3. Career Information (15%)
  if (user.placementGoal || user.targetRole) careerScore += 5;
  else {
    missingItems.push('Placement Goal');
    suggestions.push('Add your placement goal.');
  }

  if (user.interestedRoles && (Array.isArray(user.interestedRoles) ? user.interestedRoles.length > 0 : user.interestedRoles.trim().length > 0)) {
    careerScore += 5;
  } else {
    missingItems.push('Interested Roles');
    suggestions.push('Select your interested target roles.');
  }

  if (user.bio && user.bio.trim().length > 0) careerScore += 5;
  else missingItems.push('Bio / About');

  // 4. Technical Information (15%)
  if (user.programmingLanguages && (Array.isArray(user.programmingLanguages) ? user.programmingLanguages.length > 0 : user.programmingLanguages.trim().length > 0)) {
    techScore += 5;
  } else missingItems.push('Programming Languages');

  if (user.frameworks && (Array.isArray(user.frameworks) ? user.frameworks.length > 0 : user.frameworks.trim().length > 0)) {
    techScore += 5;
  } else missingItems.push('Frameworks');

  if (user.technologies && (Array.isArray(user.technologies) ? user.technologies.length > 0 : user.technologies.trim().length > 0)) {
    techScore += 5;
  } else missingItems.push('Technologies');

  // 5. Coding Profiles (20%)
  if (user.github && user.github.trim().length > 0) codingScore += 4;
  else {
    missingItems.push('GitHub Profile');
    suggestions.push('Add your GitHub profile.');
  }

  if (user.linkedin && user.linkedin.trim().length > 0) codingScore += 4;
  else missingItems.push('LinkedIn Profile');

  if (user.leetcode && user.leetcode.trim().length > 0) codingScore += 4;
  else {
    missingItems.push('LeetCode Profile');
    suggestions.push('Add your LeetCode profile.');
  }

  if (user.codeforces && user.codeforces.trim().length > 0) codingScore += 4;
  else missingItems.push('Codeforces Profile');

  if (user.codechef && user.codechef.trim().length > 0) codingScore += 4;
  else missingItems.push('CodeChef Profile');

  // 6. Resume Upload (10%)
  if (user.resume && user.resume.trim().length > 0) resumeScore += 10;
  else {
    missingItems.push('Resume');
    suggestions.push('Upload your resume.');
  }

  const totalPercentage = Math.min(100, basicScore + academicScore + careerScore + techScore + codingScore + resumeScore);

  if (totalPercentage < 100 && suggestions.length === 0) {
    suggestions.push('Complete your profile to improve your placement preparation.');
  }

  return {
    percentage: totalPercentage,
    missingItems,
    suggestions,
  };
}

export const SASTRA_DEPARTMENTS = [
  'Information Technology (IT)',
  'Computer Science Engineering (CSE)',
  'Computer Science (AI & DS)',
  'CSE (Cyber Security & Blockchain)',
  'CSE (IoT & Automation)',
  'Computer Science & Business Systems (CSBS)',
  'Information & Communication Tech (ICT)',
  'Electronics & Communication Engineering (ECE)',
  'ECE (Cyber Physical Systems)',
  'Electronics Engineering (VLSI)',
  'Electrical & Electronics Engineering (EEE)',
  'EEE (Smart Grid & EVs)',
  'Electronics & Instrumentation (EIE)',
  'Mechanical Engineering (MECH)',
  'MECH (Digital Manufacturing)',
  'Mechatronics (MCT)',
  'Robotics and AI (RAI)',
  'Aerospace Engineering (AERO)',
  'Civil Engineering (CIVIL)',
  'Biotechnology (BIOTECH)',
  'Bioengineering (BIOENG)',
  'Bioinformatics (BI)',
  'Chemical Engineering (CHE)',
];
