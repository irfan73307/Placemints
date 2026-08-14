// Program code (digits 4-6 of roll number) -> department abbreviation
// Valid across ALL batch years, not tied to a specific graduation year.
export const PROGRAM_CODE_MAP = {
  '001': 'CIVIL',
  '002': 'CHE',
  '003': 'CSE',
  '004': 'ECE',
  '005': 'EEE',
  '006': 'EIE',
  '009': 'MECH',
  '010': 'BIOTECH',
  '011': 'BIOENG',
  '012': 'MCT',
  '013': 'BI',
  '014': 'ICT',
  '015': 'IT',
  '017': 'AERO',
  '018': 'CSBS',
  '156': 'AIDS',        // CSE (AI & Data Science)
  '157': 'CSE-CSBT',    // CSE (Cyber Security & Blockchain)
  '158': 'CSE-IOT',     // CSE (IoT & Automation)
  '159': 'EEE-SGEV',    // EEE (Smart Grid & EVs)
  '160': 'ECE-CPS',     // ECE (Cyber Physical Systems)
  '161': 'MECH-DM',     // MECH (Digital Manufacturing)
  '179': 'RAI',         // Robotics and AI
  '180': 'VLSI',        // Electronics Engineering (VLSI Design)
};

export const CAMPUS_MAP = {
  '1': 'SASTRA Main Campus (Thanjavur)',
};

export function parseRollNumber(emailOrRoll) {
  if (!emailOrRoll || typeof emailOrRoll !== 'string') return null;

  // Extract numeric roll part (handles both full email or just roll number)
  const trimmed = emailOrRoll.trim().toLowerCase();
  const match = /^(\d{9,})/.exec(trimmed.includes('@') ? trimmed.split('@')[0] : trimmed);
  if (!match) return null;

  const roll = match[1];
  if (roll.length < 6) return null;

  const campusCode = roll[0];
  const yearSuffix = roll.slice(1, 3);   // "27", "28", ...
  const programCode = roll.slice(3, 6);  // "015", "003", ...

  const branch = PROGRAM_CODE_MAP[programCode] || null;
  const graduationYear = /^\d{2}$/.test(yearSuffix) ? 2000 + parseInt(yearSuffix, 10) : null;
  const campus = CAMPUS_MAP[campusCode] || null;

  return { branch, graduationYear, campus, rollNumber: roll };
}

export function detectBranchFromEmail(email) {
  const parsed = parseRollNumber(email);
  return parsed ? parsed.branch : null;
}
