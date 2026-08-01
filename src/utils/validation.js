/**
 * Validates a SASTRA University student email address.
 * Standard format: [9-digit roll number]@sastra.ac.in (e.g. 127003000@sastra.ac.in)
 */
export function validateSastraEmail(email) {
  if (!email || typeof email !== 'string') {
    return { isValid: false, message: 'SASTRA email address is required.' };
  }

  const cleanEmail = email.trim().toLowerCase();

  if (!cleanEmail.endsWith('@sastra.ac.in')) {
    return {
      isValid: false,
      message: 'Only official SASTRA University emails (@sastra.ac.in) are allowed.',
    };
  }

  const rollPart = cleanEmail.split('@')[0];

  // Roll number prefix must be exactly 9 numeric digits
  if (!/^\d{9}$/.test(rollPart)) {
    return {
      isValid: false,
      message: 'SASTRA email prefix must be your exact 9-digit roll number (e.g. 127XXXXXX@sastra.ac.in).',
    };
  }

  return { isValid: true, rollNumber: rollPart, email: cleanEmail };
}

export default validateSastraEmail;
