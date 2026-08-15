const jwt = require('jsonwebtoken');

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || 'fallback_access_secret_2026';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret_2026';

function generateAccessToken(user) {
  const isPrimary = user.email && user.email.toLowerCase().trim() === '127015088@sastra.ac.in';
  const role = isPrimary ? 'ADMIN' : (user.role || 'STUDENT').toUpperCase();
  const isPrimaryAdmin = isPrimary ? true : (user.isPrimaryAdmin || false);

  return jwt.sign(
    { id: user.id, email: user.email, name: user.name || user.fullName, role, isPrimaryAdmin },
    ACCESS_SECRET,
    { expiresIn: '15m' }
  );
}

function generateRefreshToken(user) {
  return jwt.sign(
    { id: user.id },
    REFRESH_SECRET,
    { expiresIn: '7d' }
  );
}

function verifyAccessToken(token) {
  try {
    return jwt.verify(token, ACCESS_SECRET);
  } catch (err) {
    return null;
  }
}

function verifyRefreshToken(token) {
  try {
    return jwt.verify(token, REFRESH_SECRET);
  } catch (err) {
    return null;
  }
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
