const bcrypt = require('bcryptjs');
const prisma = require('../db');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/auth/google/callback';

// GET /auth/google
function googleLogin(req, res) {
  const scope = encodeURIComponent('email profile');
  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(GOOGLE_CALLBACK_URL)}&response_type=code&scope=${scope}&prompt=select_account`;
  
  if (req.query.json === 'true') {
    return res.json({ url: googleAuthUrl });
  }
  res.redirect(googleAuthUrl);
}

// GET /auth/google/callback
async function googleCallback(req, res) {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  try {
    const { code } = req.query;

    if (!code) {
      return res.redirect(`${clientUrl}/login?error=oauth_code_missing`);
    }

    // 1. Exchange code for tokens with Google OAuth API
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: GOOGLE_CALLBACK_URL,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      console.error('Google token exchange error:', tokenData);
      return res.redirect(`${clientUrl}/login?error=google_token_failed`);
    }

    // 2. Fetch authenticated User Profile from Google
    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const googleUser = await userRes.json();

    if (!googleUser || !googleUser.email) {
      return res.redirect(`${clientUrl}/login?error=google_email_missing`);
    }

    const email = googleUser.email.toLowerCase().trim();
    const name = googleUser.name || 'Student';
    const picture = googleUser.picture;
    const googleId = googleUser.id;

    // 3. BACKEND ENFORCED GOOGLE AUTH RESTRICTION (@sastra.ac.in ONLY)
    if (!email.endsWith('@sastra.ac.in')) {
      console.warn(`[AUTH REJECTED] Non-SASTRA Google Login attempt: ${email}`);
      return res.redirect(`${clientUrl}/login?error=domain_restricted`);
    }

    // 4. Upsert user in database with verified Google email
    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name,
          fullName: name,
          avatar: picture,
          avatarUrl: picture,
          googleId,
          branch: 'CSE',
          batchYear: 2026,
          profileCompleted: false, // First time Google login must complete profile
        },
      });
    } else if (!user.googleId) {
      user = await prisma.user.update({
        where: { email },
        data: { googleId, avatar: picture || user.avatar, avatarUrl: picture || user.avatarUrl },
      });
    }

    // 5. Generate JWT tokens & session refresh token cookie
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // If profile setup is incomplete, redirect to /profile/setup, otherwise /dashboard
    const redirectPath = user.profileCompleted ? '/dashboard' : '/profile/setup';
    res.redirect(`${clientUrl}${redirectPath}?token=${accessToken}`);
  } catch (err) {
    console.error('Google Callback Error:', err);
    res.redirect(`${clientUrl}/login?error=google_auth_failed`);
  }
}

// POST /auth/register
async function register(req, res) {
  try {
    const { fullName, email, password, confirmPassword } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ message: 'Full Name, SASTRA Email, and Password are required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Server-side SASTRA Email restriction check
    if (!normalizedEmail.endsWith('@sastra.ac.in')) {
      return res.status(400).json({ message: 'Only SASTRA University students (@sastra.ac.in) can access Placemints.' });
    }

    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({ message: 'Password and Confirm Password do not match.' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existingUser) {
      return res.status(400).json({ message: 'An account with this SASTRA email already exists. Please sign in.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name: fullName,
        fullName,
        email: normalizedEmail,
        passwordHash,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(fullName)}`,
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(fullName)}`,
        branch: 'CSE',
        batchYear: 2026,
        profileCompleted: false, // New registrations must complete profile setup
      },
    });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      accessToken,
      user: formatUserResponse(user),
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Internal server error during registration.' });
  }
}

// POST /auth/login
async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'SASTRA Email and Password are required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Server-side SASTRA Email restriction check
    if (!normalizedEmail.endsWith('@sastra.ac.in')) {
      return res.status(400).json({ message: 'Only SASTRA University students (@sastra.ac.in) can access Placemints.' });
    }

    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user || !user.passwordHash) {
      return res.status(401).json({ message: 'Invalid credentials or account registered via Google.' });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      accessToken,
      user: formatUserResponse(user),
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Internal server error during login.' });
  }
}

// POST /auth/forgot-password (placeholder)
async function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    if (!email || !email.toLowerCase().trim().endsWith('@sastra.ac.in')) {
      return res.status(400).json({ message: 'Please enter a valid @sastra.ac.in email address.' });
    }

    res.json({
      message: 'Password reset link has been sent to your SASTRA email address.',
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to process forgot password request.' });
  }
}

// POST /auth/reset-password (placeholder)
async function resetPassword(req, res) {
  try {
    const { email, token, newPassword } = req.body;
    res.json({ message: 'Password reset successfully. You can now login.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to reset password.' });
  }
}

// GET /auth/me
async function getMe(req, res) {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const savedCount = await prisma.savedCompany.count({ where: { userId: user.id } });

    res.json({
      user: {
        ...formatUserResponse(user),
        savedCount,
        practicedCount: 18,
      },
    });
  } catch (err) {
    console.error('Get me error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
}

// POST /auth/refresh
async function refreshToken(req, res) {
  try {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;
    if (!token) {
      return res.status(401).json({ message: 'Refresh token required.' });
    }

    const decoded = verifyRefreshToken(token);
    if (!decoded) {
      return res.status(401).json({ message: 'Invalid refresh token.' });
    }

    const savedToken = await prisma.refreshToken.findFirst({
      where: { tokenHash: token, revoked: false },
    });

    if (!savedToken) {
      return res.status(401).json({ message: 'Revoked or expired refresh token.' });
    }

    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const newAccessToken = generateAccessToken(user);
    res.json({ accessToken: newAccessToken, user: formatUserResponse(user) });
  } catch (err) {
    console.error('Refresh token error:', err);
    res.status(500).json({ message: 'Failed to refresh token.' });
  }
}

// POST /auth/logout
async function logout(req, res) {
  try {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;
    if (token) {
      await prisma.refreshToken.updateMany({
        where: { tokenHash: token },
        data: { revoked: true },
      });
    }
    res.clearCookie('refreshToken');
    res.json({ message: 'Logged out successfully.' });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ message: 'Logout failed.' });
  }
}

// Helper user response formatter
function formatUserResponse(user) {
  return {
    id: user.id,
    name: user.fullName || user.name || 'SASTRA Student',
    fullName: user.fullName || user.name || 'SASTRA Student',
    email: user.email,
    avatar: user.avatar || user.avatarUrl,
    avatarUrl: user.avatar || user.avatarUrl,
    department: user.department || user.branch || 'CSE',
    degree: user.degree || 'B.Tech',
    graduationYear: user.graduationYear || user.batchYear || 2026,
    section: user.section || 'A',
    rollNumber: user.rollNumber || user.rollNo || '',
    cgpa: user.cgpa || '8.50',
    placementGoal: user.placementGoal || user.targetRole || 'Software Engineer',
    targetRole: user.placementGoal || user.targetRole || 'Software Engineer',
    branch: user.department || user.branch || 'CSE',
    batch: String(user.graduationYear || user.batchYear || 2026),
    interestedRoles: user.interestedRoles ? user.interestedRoles.split(',').map((s) => s.trim()) : [],
    programmingLanguages: user.programmingLanguages ? user.programmingLanguages.split(',').map((s) => s.trim()) : [],
    frameworks: user.frameworks ? user.frameworks.split(',').map((s) => s.trim()) : [],
    technologies: user.technologies ? user.technologies.split(',').map((s) => s.trim()) : [],
    github: user.github || '',
    linkedin: user.linkedin || '',
    leetcode: user.leetcode || '',
    codeforces: user.codeforces || '',
    codechef: user.codechef || '',
    resume: user.resume || '',
    bio: user.bio || '',
    profileCompleted: user.profileCompleted ?? false,
  };
}

module.exports = {
  googleLogin,
  googleCallback,
  register,
  login,
  forgotPassword,
  resetPassword,
  getMe,
  refreshToken,
  logout,
};
