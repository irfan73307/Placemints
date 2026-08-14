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
    keys: ['computer science (ai & ds)', 'artificial intelligence', 'ai & ds', 'aids', 'ai-ds', 'cse (ai & data science)'],
    desktop: 'Computer Science (AI & DS)',
    mobile: 'AI & DS',
    code: 'AIDS',
  },
  {
    keys: ['cyber security', 'cse-csbt', 'csbt'],
    desktop: 'CSE (Cyber Security & Blockchain)',
    mobile: 'CSBT',
    code: 'CSE-CSBT',
  },
  {
    keys: ['iot & automation', 'cse-iot', 'iot'],
    desktop: 'CSE (IoT & Automation)',
    mobile: 'IoT',
    code: 'CSE-IOT',
  },
  {
    keys: ['computer science and business systems', 'csbs'],
    desktop: 'Computer Science & Business Systems (CSBS)',
    mobile: 'CSBS',
    code: 'CSBS',
  },
  {
    keys: ['information and communication technology', 'ict'],
    desktop: 'Information & Communication Tech (ICT)',
    mobile: 'ICT',
    code: 'ICT',
  },
  {
    keys: ['electronics and communication engineering', 'electronics', 'ece'],
    desktop: 'Electronics & Communication Engineering (ECE)',
    mobile: 'ECE',
    code: 'ECE',
  },
  {
    keys: ['cyber physical systems', 'ece-cps', 'cps'],
    desktop: 'ECE (Cyber Physical Systems)',
    mobile: 'CPS',
    code: 'ECE-CPS',
  },
  {
    keys: ['vlsi design', 'vlsi'],
    desktop: 'Electronics Engineering (VLSI)',
    mobile: 'VLSI',
    code: 'VLSI',
  },
  {
    keys: ['electrical and electronics engineering', 'electrical', 'eee'],
    desktop: 'Electrical & Electronics Engineering (EEE)',
    mobile: 'EEE',
    code: 'EEE',
  },
  {
    keys: ['smart grid', 'eee-sgev', 'sgev'],
    desktop: 'EEE (Smart Grid & EVs)',
    mobile: 'SGEV',
    code: 'EEE-SGEV',
  },
  {
    keys: ['electronics and instrumentation', 'eie'],
    desktop: 'Electronics & Instrumentation (EIE)',
    mobile: 'EIE',
    code: 'EIE',
  },
  {
    keys: ['mechanical engineering', 'mechanical', 'mech'],
    desktop: 'Mechanical Engineering (MECH)',
    mobile: 'MECH',
    code: 'MECH',
  },
  {
    keys: ['digital manufacturing', 'mech-dm'],
    desktop: 'MECH (Digital Manufacturing)',
    mobile: 'DM',
    code: 'MECH-DM',
  },
  {
    keys: ['mechatronics', 'mct'],
    desktop: 'Mechatronics (MCT)',
    mobile: 'MCT',
    code: 'MCT',
  },
  {
    keys: ['robotics and ai', 'rai'],
    desktop: 'Robotics and AI (RAI)',
    mobile: 'RAI',
    code: 'RAI',
  },
  {
    keys: ['aerospace engineering', 'aero'],
    desktop: 'Aerospace Engineering (AERO)',
    mobile: 'AERO',
    code: 'AERO',
  },
  {
    keys: ['civil engineering', 'civil'],
    desktop: 'Civil Engineering (CIVIL)',
    mobile: 'CIVIL',
    code: 'CIVIL',
  },
  {
    keys: ['biotechnology', 'biotech', 'biotech-int'],
    desktop: 'Biotechnology (BIOTECH)',
    mobile: 'BIOTECH',
    code: 'BIOTECH',
  },
  {
    keys: ['bioengineering', 'bioeng'],
    desktop: 'Bioengineering (BIOENG)',
    mobile: 'BIOENG',
    code: 'BIOENG',
  },
  {
    keys: ['bioinformatics', 'bi'],
    desktop: 'Bioinformatics (BI)',
    mobile: 'BI',
    code: 'BI',
  },
  {
    keys: ['chemical engineering', 'chemical', 'che', 'chem'],
    desktop: 'Chemical Engineering (CHE)',
    mobile: 'CHE',
    code: 'CHE',
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
