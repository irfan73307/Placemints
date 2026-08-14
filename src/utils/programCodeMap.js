// First 6 digits of SASTRA roll number -> department abbreviation
export const PROGRAM_CODE_MAP = {
  '127001': 'CIVIL',
  '127002': 'CHE',
  '127003': 'CSE',
  '127004': 'ECE',
  '127005': 'EEE',
  '127006': 'EIE',
  '127009': 'MECH',
  '127010': 'BIOTECH',
  '127011': 'BIOENG',
  '127012': 'MCT',
  '127013': 'BI',
  '127014': 'ICT',
  '127015': 'IT',
  '127017': 'AERO',
  '127018': 'CSBS',
  '128123': 'BIOTECH-INT',
  '127156': 'AIDS',        // CSE (AI & Data Science)
  '127157': 'CSE-CSBT',    // CSE (Cyber Security & Blockchain)
  '127158': 'CSE-IOT',     // CSE (IoT & Automation)
  '127159': 'EEE-SGEV',    // EEE (Smart Grid & EVs)
  '127160': 'ECE-CPS',     // ECE (Cyber Physical Systems)
  '127161': 'MECH-DM',     // MECH (Digital Manufacturing)
  '127179': 'RAI',         // Robotics and AI
  '127180': 'VLSI',        // Electronics Engineering (VLSI Design)
};

export function detectBranchFromEmail(email) {
  if (!email || typeof email !== 'string') return null;
  const match = /^(\d{6})/.exec(email.trim().toLowerCase());
  if (!match) return null;
  return PROGRAM_CODE_MAP[match[1]] || null;
}
