const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'placemints_super_secret_jwt_key_2026';

function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// POST /api/auth/register
async function register(req, res) {
  try {
    const { name, email, password, branch, batchYear } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        branch: branch || 'CSE',
        batchYear: batchYear ? parseInt(batchYear) : 2026,
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
      },
    });

    const token = generateToken(user);
    res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        branch: user.branch,
        batch: String(user.batchYear),
        avatar: user.avatarUrl,
        targetRole: user.targetRole,
        cgpa: user.cgpa,
      },
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Internal server error during registration.' });
  }
}

// POST /api/auth/login
async function login(req, res) {
  try {
    const { email, password } = req.body;

    // Default demo fallback if email/password omitted or matching demo
    let targetEmail = email || 'shaik.haroon@sastra.ac.in';
    const user = await prisma.user.findUnique({ where: { email: targetEmail } });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    if (password && user.passwordHash) {
      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        return res.status(401).json({ message: 'Invalid credentials.' });
      }
    }

    const token = generateToken(user);
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        branch: user.branch,
        batch: String(user.batchYear),
        avatar: user.avatarUrl,
        targetRole: user.targetRole,
        cgpa: user.cgpa,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Internal server error during login.' });
  }
}

// POST /api/auth/google
async function loginWithGoogle(req, res) {
  try {
    // In production, exchange auth code/idToken with Google API.
    // For now, retrieve or create the default Google OAuth user.
    const googleUserEmail = req.body.email || 'shaik.haroon@sastra.ac.in';
    let user = await prisma.user.findUnique({ where: { email: googleUserEmail } });

    if (!user) {
      user = await prisma.user.create({
        data: {
          name: req.body.name || 'Shaik Haroon',
          email: googleUserEmail,
          googleId: req.body.googleId || 'google_sub_id_2026',
          avatarUrl: req.body.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          branch: 'CSE',
          batchYear: 2026,
        },
      });
    }

    const token = generateToken(user);
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        branch: user.branch,
        batch: String(user.batchYear),
        avatar: user.avatarUrl,
        targetRole: user.targetRole,
        cgpa: user.cgpa,
      },
    });
  } catch (err) {
    console.error('Google Auth error:', err);
    res.status(500).json({ message: 'Internal server error during Google login.' });
  }
}

// GET /api/auth/me
async function getCurrentUser(req, res) {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const savedCount = await prisma.savedCompany.count({ where: { userId: user.id } });

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        branch: user.branch,
        batch: String(user.batchYear),
        avatar: user.avatarUrl,
        targetRole: user.targetRole,
        cgpa: user.cgpa,
        savedCount,
        practicedCount: 18,
      },
    });
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
}

module.exports = { register, login, loginWithGoogle, getCurrentUser };
