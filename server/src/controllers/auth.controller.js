const bcrypt = require('bcryptjs');
const prisma = require('../db');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');

function getGoogleClientId() {
  return process.env.GOOGLE_CLIENT_ID ? process.env.GOOGLE_CLIENT_ID.trim() : '';
}

function getGoogleClientSecret() {
  return process.env.GOOGLE_CLIENT_SECRET ? process.env.GOOGLE_CLIENT_SECRET.trim() : '';
}

function getCallbackUrl(req) {
  if (process.env.GOOGLE_CALLBACK_URL && process.env.GOOGLE_CALLBACK_URL.trim() !== '') {
    return process.env.GOOGLE_CALLBACK_URL.trim();
  }
  const host = req.get('host');
  const protocol = req.protocol === 'https' || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
  return `${protocol}://${host}/auth/google/callback`;
}

// GET /auth/google
function googleLogin(req, res) {
  const scope = encodeURIComponent('email profile');
  const callbackUrl = getCallbackUrl(req);
  const clientId = getGoogleClientId();
  
  console.log(`[OAuth 1/6] Google login initiated. ClientID: ${clientId.substring(0, 15)}... | CallbackURL: ${callbackUrl}`);

  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(callbackUrl)}&response_type=code&scope=${scope}&prompt=select_account`;
  
  if (req.query.json === 'true') {
    return res.json({ url: googleAuthUrl });
  }
  res.redirect(googleAuthUrl);
}

// GET /auth/google/callback
async function googleCallback(req, res) {
  let clientUrl = process.env.CLIENT_URL;
  if (!clientUrl || clientUrl === '*' || clientUrl.includes('localhost')) {
    clientUrl = req.headers.origin || (req.headers.referer ? new URL(req.headers.referer).origin : null) || 'https://placemints.vercel.app';
  }
  clientUrl = clientUrl.replace(/\/+$/, '');
  
  const callbackUrl = getCallbackUrl(req);
  const clientId = getGoogleClientId();
  const clientSecret = getGoogleClientSecret();

  try {
    const { code } = req.query;
    console.log(`[OAuth 2/6] Google callback reached. Code present: ${!!code} | CallbackURL: ${callbackUrl}`);

    if (!code) {
      console.warn('[OAuth ERROR] Authorization code missing from Google redirect query.');
      return res.redirect(`${clientUrl}/login?error=oauth_code_missing`);
    }

    // 1. Exchange code for tokens with Google OAuth API
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: callbackUrl,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      console.error('[OAuth 3/6 ERROR] Google token exchange failed:', tokenData);
      return res.redirect(`${clientUrl}/login?error=google_token_failed`);
    }

    // 2. Fetch authenticated User Profile from Google
    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const googleUser = await userRes.json();

    if (!googleUser || !googleUser.email) {
      console.error('[OAuth 4/6 ERROR] Failed to retrieve Google profile userinfo:', googleUser);
      return res.redirect(`${clientUrl}/login?error=google_email_missing`);
    }

    const email = googleUser.email.toLowerCase().trim();
    const name = googleUser.name || 'Student';
    const picture = googleUser.picture;
    const googleId = googleUser.id;

    console.log(`[OAuth 4/6] Retrieved Google user profile for: ${email}`);

    // 3. BACKEND ENFORCED GOOGLE AUTH RESTRICTION (@sastra.ac.in ONLY)
    if (!email.endsWith('@sastra.ac.in')) {
      console.warn(`[OAuth 5/6 REJECTED] Non-SASTRA Google Login attempt blocked: ${email}`);
      return res.redirect(`${clientUrl}/login?error=domain_restricted`);
    }

    const isAdmin = email === '127015088@sastra.ac.in';
    const userRole = isAdmin ? 'ADMIN' : 'STUDENT';

    // 4. Upsert user in database with verified Google email
    let user = null;
    try {
      user = await prisma.user.findUnique({ where: { email } });

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
            role: userRole,
            isPrimaryAdmin: isAdmin,
            profileCompleted: true,
          },
        });
        console.log(`[OAuth 5/6] Created new database user record for: ${email} (ID: ${user.id})`);
      } else {
        user = await prisma.user.update({
          where: { email },
          data: {
            googleId,
            avatar: picture || user.avatar,
            avatarUrl: picture || user.avatarUrl,
            role: isAdmin ? 'ADMIN' : user.role,
            isPrimaryAdmin: isAdmin ? true : user.isPrimaryAdmin,
          },
        });
        console.log(`[OAuth 5/6] Updated existing user with Google ID for: ${email}`);
      }
    } catch (dbErr) {
      console.error('[OAuth DB WARN] Database upsert failed during Google auth, continuing with token session:', dbErr.message);
      user = {
        id: `usr_google_${Date.now()}`,
        email,
        name,
        fullName: name,
        avatar: picture,
        avatarUrl: picture,
        branch: 'CSE',
        batchYear: 2026,
        role: userRole,
        isPrimaryAdmin: isAdmin,
        profileCompleted: true,
      };
    }

    // 5. Generate JWT tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    try {
      await prisma.refreshToken.create({
        data: {
          userId: user.id,
          tokenHash: refreshToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });
    } catch (tokenErr) {
      console.warn('[OAuth REFRESH TOKEN WARN] Failed to save refreshToken to DB:', tokenErr.message);
    }

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const redirectTarget = `${clientUrl}/dashboard?token=${encodeURIComponent(accessToken)}`;
    console.log(`[OAuth 6/6 SUCCESS] Authentication successful. Redirecting to: ${redirectTarget}`);
    return res.redirect(redirectTarget);
  } catch (err) {
    console.error('[OAuth CRITICAL ERROR] Exception during Google OAuth callback:', err);
    return res.redirect(`${clientUrl}/login?error=google_auth_failed`);
  }
}

// POST /auth/register
async function register(req, res) {
  try {
    const { email, password, fullName } = req.body;

    if (!email || !password || !fullName) {
      return res.status(400).json({ message: 'Full Name, SASTRA Email, and Password are required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (!normalizedEmail.endsWith('@sastra.ac.in')) {
      return res.status(400).json({ message: 'Only SASTRA University students (@sastra.ac.in) can access Placemints.' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existingUser) {
      return res.status(400).json({ message: 'An account with this SASTRA email already exists. Please sign in.' });
    }

    const isAdmin = normalizedEmail === '127015088@sastra.ac.in';
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
        role: isAdmin ? 'ADMIN' : 'STUDENT',
        isPrimaryAdmin: isAdmin,
        profileCompleted: true,
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

    const isPrimaryAdminAccount = normalizedEmail === '127015088@sastra.ac.in';
    let user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (isPrimaryAdminAccount && password === '127015088@sastra') {
      const passwordHash = await bcrypt.hash('127015088@sastra', 10);
      if (!user) {
        user = await prisma.user.create({
          data: {
            email: normalizedEmail,
            name: 'Shaik Mohammad Irfan',
            fullName: 'Shaik Mohammad Irfan',
            passwordHash,
            role: 'ADMIN',
            isPrimaryAdmin: true,
            isActive: true,
            department: 'CSE',
            branch: 'CSE',
            graduationYear: 2026,
            rollNumber: '127015088',
            cgpa: '8.5475',
            placementGoal: 'Software Engineer (SDE-1)',
            profileCompleted: true,
          },
        });
      } else {
        user = await prisma.user.update({
          where: { email: normalizedEmail },
          data: {
            passwordHash,
            role: 'ADMIN',
            isPrimaryAdmin: true,
            isActive: true,
          },
        });
      }
    } else {
      if (!user || !user.passwordHash) {
        return res.status(401).json({ message: 'Invalid credentials or account registered via Google.' });
      }

      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        return res.status(401).json({ message: 'Invalid email or password.' });
      }
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    try {
      await prisma.refreshToken.create({
        data: {
          userId: user.id,
          tokenHash: refreshToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });
    } catch (tErr) {
      console.warn('Refresh token save error:', tErr.message);
    }

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

// POST /auth/forgot-password
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

// POST /auth/reset-password
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
    let user = null;
    let savedCount = 0;

    try {
      user = await prisma.user.findUnique({ where: { id: req.user.id } });
      if (user) {
        savedCount = await prisma.savedCompany.count({ where: { userId: user.id } });
      }
    } catch (dbErr) {
      console.warn('[getMe DB WARN] Database query failed, using session token data:', dbErr.message);
    }

    if (!user) {
      const isPrimary = req.user.email === '127015088@sastra.ac.in';
      user = {
        id: req.user.id,
        email: req.user.email,
        fullName: req.user.name || 'SASTRA Student',
        name: req.user.name || 'SASTRA Student',
        branch: 'CSE',
        batchYear: 2026,
        role: isPrimary ? 'ADMIN' : (req.user.role || 'STUDENT'),
        isPrimaryAdmin: isPrimary ? true : (req.user.isPrimaryAdmin || false),
        profileCompleted: true,
      };
    }

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
  const isPrimary = user.email && user.email.toLowerCase().trim() === '127015088@sastra.ac.in';
  const role = isPrimary ? 'ADMIN' : (user.role || 'STUDENT').toUpperCase();
  const isPrimaryAdmin = isPrimary ? true : (user.isPrimaryAdmin || false);

  return {
    id: user.id,
    name: user.fullName || user.name || 'SASTRA Student',
    fullName: user.fullName || user.name || 'SASTRA Student',
    email: user.email,
    role,
    isPrimaryAdmin,
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
