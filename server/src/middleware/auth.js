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

async function requireAuth(req, res, next) {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ message: 'Authentication required. Missing or malformed token.' });
  }

  const decoded = verifyAccessToken(token);
  if (!decoded || !decoded.id) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
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
    console.error('requireAuth database error:', err);
    return res.status(500).json({ message: 'Authentication check failed.' });
  }
}

async function requireAdmin(req, res, next) {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ message: 'Authentication required.' });
  }

  const decoded = verifyAccessToken(token);
  if (!decoded || !decoded.id) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
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

    if ((dbUser.role || '').toUpperCase() !== 'ADMIN') {
      return res.status(403).json({ message: 'Access Denied: Admin privileges required.' });
    }

    req.user = {
      ...decoded,
      ...dbUser,
      role: dbUser.role,
      isPrimaryAdmin: dbUser.isPrimaryAdmin,
    };
    next();
  } catch (err) {
    console.error('requireAdmin database error:', err);
    return res.status(500).json({ message: 'Admin authentication check failed.' });
  }
}

async function requirePrimaryAdmin(req, res, next) {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ message: 'Authentication required.' });
  }

  const decoded = verifyAccessToken(token);
  if (!decoded || !decoded.id) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
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

    if ((dbUser.role || '').toUpperCase() !== 'ADMIN' || !dbUser.isPrimaryAdmin) {
      return res.status(403).json({ message: 'Access Denied: Primary Admin privileges required.' });
    }

    req.user = {
      ...decoded,
      ...dbUser,
      role: dbUser.role,
      isPrimaryAdmin: dbUser.isPrimaryAdmin,
    };
    next();
  } catch (err) {
    console.error('requirePrimaryAdmin database error:', err);
    return res.status(500).json({ message: 'Primary Admin authentication check failed.' });
  }
}

async function optionalAuth(req, res, next) {
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
        // Silently continue for optional auth
      }
    }
  }
  next();
}

module.exports = { requireAuth, requireAdmin, requirePrimaryAdmin, optionalAuth, extractToken };
