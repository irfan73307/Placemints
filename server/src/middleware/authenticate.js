const { verifyAccessToken } = require('../utils/jwt');
const prisma = require('../db');

function extractToken(req) {
  if (req.cookies?.accessToken) {
    return req.cookies.accessToken;
  }
  if (req.cookies?.token) {
    return req.cookies.token;
  }
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.split(' ')[1];
  }
  return null;
}

async function authenticateToken(req, res, next) {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ message: 'Access token required.' });
  }

  const decoded = verifyAccessToken(token);
  if (!decoded || !decoded.id) {
    return res.status(401).json({ message: 'Invalid or expired access token.' });
  }

  try {
    const dbUser = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!dbUser || dbUser.isActive === false) {
      res.clearCookie('accessToken', { path: '/' });
      res.clearCookie('refreshToken', { path: '/' });
      return res.status(401).json({
        code: 'ACCOUNT_REVOKED',
        message: 'Your account is no longer available. Please contact the administrator if you believe this was a mistake.',
      });
    }

    req.user = {
      ...decoded,
      ...dbUser,
      role: (dbUser.role || 'STUDENT').toUpperCase(),
      isPrimaryAdmin: dbUser.isPrimaryAdmin || false,
    };
    next();
  } catch (err) {
    console.error('authenticateToken database error:', err);
    return res.status(500).json({ message: 'Authentication check failed.' });
  }
}

async function optionalToken(req, res, next) {
  const token = extractToken(req);
  if (token) {
    const decoded = verifyAccessToken(token);
    if (decoded && decoded.id) {
      try {
        const dbUser = await prisma.user.findUnique({ where: { id: decoded.id } });
        if (dbUser && dbUser.isActive !== false) {
          req.user = {
            ...decoded,
            ...dbUser,
            role: (dbUser.role || 'STUDENT').toUpperCase(),
            isPrimaryAdmin: dbUser.isPrimaryAdmin || false,
          };
        }
      } catch (err) {
        // Silently continue for optional
      }
    }
  }
  next();
}

module.exports = { authenticateToken, optionalToken };
