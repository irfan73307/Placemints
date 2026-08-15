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
  if (!decoded) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }

  req.user = decoded;
  next();
}

async function requireAdmin(req, res, next) {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ message: 'Authentication required.' });
  }

  const decoded = verifyAccessToken(token);
  if (!decoded) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }

  // Database-driven role verification
  const dbUser = await prisma.user.findUnique({ where: { id: decoded.id } });
  if (!dbUser || (dbUser.role || '').toUpperCase() !== 'ADMIN' || dbUser.isActive === false) {
    return res.status(403).json({ message: 'Access Denied: Admin privileges required.' });
  }

  req.user = {
    ...decoded,
    role: dbUser.role,
    isPrimaryAdmin: dbUser.isPrimaryAdmin,
  };
  next();
}

async function requirePrimaryAdmin(req, res, next) {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ message: 'Authentication required.' });
  }

  const decoded = verifyAccessToken(token);
  if (!decoded) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }

  const dbUser = await prisma.user.findUnique({ where: { id: decoded.id } });
  if (!dbUser || (dbUser.role || '').toUpperCase() !== 'ADMIN' || !dbUser.isPrimaryAdmin || dbUser.isActive === false) {
    return res.status(403).json({ message: 'Access Denied: Primary Admin privileges required.' });
  }

  req.user = {
    ...decoded,
    role: dbUser.role,
    isPrimaryAdmin: dbUser.isPrimaryAdmin,
  };
  next();
}

function optionalAuth(req, res, next) {
  const token = extractToken(req);
  if (token) {
    const decoded = verifyAccessToken(token);
    if (decoded) {
      req.user = decoded;
    }
  }
  next();
}

module.exports = { requireAuth, requireAdmin, requirePrimaryAdmin, optionalAuth, extractToken };
