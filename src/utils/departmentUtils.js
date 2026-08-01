/**
 * Department Formatting Utilities
 * 
 * Maps saved SASTRA department names to responsive Desktop and Mobile display strings.
 * Never hardcodes "CSE" for non-CSE students.
 */

const DEPARTMENT_MAP = {
  'Computer Science': {
    desktop: 'Computer Science (CSE)',
    mobile: 'CSE',
    code: 'CSE',
  },
  'Information Technology': {
    desktop: 'Information Technology (IT)',
    mobile: 'IT',
    code: 'IT',
  },
  'Computer Science (AI & DS)': {
    desktop: 'Computer Science (AI & DS)',
    mobile: 'AI & DS',
    code: 'AI & DS',
  },
  'Electronics': {
    desktop: 'Electronics & Communication (ECE)',
    mobile: 'ECE',
    code: 'ECE',
  },
  'Electrical': {
    desktop: 'Electrical & Electronics (EEE)',
    mobile: 'EEE',
    code: 'EEE',
  },
  'Mechanical': {
    desktop: 'Mechanical Engineering (MECH)',
    mobile: 'MECH',
    code: 'MECH',
  },
  'Civil': {
    desktop: 'Civil Engineering (CIVIL)',
    mobile: 'CIVIL',
    code: 'CIVIL',
  },
  'Biotechnology': {
    desktop: 'Biotechnology (BIOTECH)',
    mobile: 'BIOTECH',
    code: 'BIOTECH',
  },
  'Chemical': {
    desktop: 'Chemical Engineering (CHEM)',
    mobile: 'CHEM',
    code: 'CHEM',
  },
  'Architecture': {
    desktop: 'Architecture (ARCH)',
    mobile: 'ARCH',
    code: 'ARCH',
  },
};

export function getFormattedDepartment(deptInput) {
  if (!deptInput) {
    return {
      desktop: 'Computer Science (CSE)',
      mobile: 'CSE',
      code: 'CSE',
    };
  }

  const trimmed = deptInput.trim();

  // Exact or partial match check
  for (const [key, val] of Object.entries(DEPARTMENT_MAP)) {
    if (trimmed.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(trimmed.toLowerCase())) {
      return val;
    }
  }

  // Fallback for custom department strings
  return {
    desktop: `${trimmed}`,
    mobile: trimmed.length > 8 ? `${trimmed.substring(0, 6)}...` : trimmed,
    code: trimmed.substring(0, 4).toUpperCase(),
  };
}
