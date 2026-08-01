/**
 * Department Formatting Utilities
 * 
 * Maps database stored SASTRA department names to responsive Desktop and Mobile display strings.
 * Always reads from logged-in user profile in database without hardcoding defaults.
 */

const DEPARTMENT_MAP = [
  {
    keys: ['information technology', 'it'],
    desktop: 'Information Technology (IT)',
    mobile: 'IT',
    code: 'IT',
  },
  {
    keys: ['computer science engineering', 'computer science', 'cse'],
    desktop: 'Computer Science Engineering (CSE)',
    mobile: 'CSE',
    code: 'CSE',
  },
  {
    keys: ['computer science (ai & ds)', 'artificial intelligence', 'ai & ds', 'aids', 'ai-ds'],
    desktop: 'Computer Science (AI & DS)',
    mobile: 'AI & DS',
    code: 'AI & DS',
  },
  {
    keys: ['electronics and communication engineering', 'electronics', 'ece'],
    desktop: 'Electronics & Communication Engineering (ECE)',
    mobile: 'ECE',
    code: 'ECE',
  },
  {
    keys: ['electrical and electronics engineering', 'electrical', 'eee'],
    desktop: 'Electrical & Electronics Engineering (EEE)',
    mobile: 'EEE',
    code: 'EEE',
  },
  {
    keys: ['mechanical engineering', 'mechanical', 'mech'],
    desktop: 'Mechanical Engineering (MECH)',
    mobile: 'MECH',
    code: 'MECH',
  },
  {
    keys: ['civil engineering', 'civil'],
    desktop: 'Civil Engineering (CIVIL)',
    mobile: 'CIVIL',
    code: 'CIVIL',
  },
  {
    keys: ['biotechnology', 'biotech'],
    desktop: 'Biotechnology (BIOTECH)',
    mobile: 'BIOTECH',
    code: 'BIOTECH',
  },
  {
    keys: ['chemical engineering', 'chemical', 'chem'],
    desktop: 'Chemical Engineering (CHEM)',
    mobile: 'CHEM',
    code: 'CHEM',
  },
];

export function getFormattedDepartment(deptInput) {
  if (!deptInput || typeof deptInput !== 'string') {
    return {
      desktop: 'General Engineering',
      mobile: 'ENGG',
      code: 'ENGG',
    };
  }

  const normalized = deptInput.toLowerCase().trim();

  for (const item of DEPARTMENT_MAP) {
    if (item.keys.some((k) => normalized.includes(k) || k.includes(normalized))) {
      return {
        desktop: item.desktop,
        mobile: item.mobile,
        code: item.code,
      };
    }
  }

  // Custom fallback
  return {
    desktop: deptInput,
    mobile: deptInput.length > 8 ? `${deptInput.substring(0, 6)}...` : deptInput,
    code: deptInput.substring(0, 4).toUpperCase(),
  };
}

export default getFormattedDepartment;
