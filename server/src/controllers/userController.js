const prisma = require('../db');
const { parseRollNumber, detectBranchFromEmail } = require('../utils/programCodeMap');

// GET /api/users/me/saved
async function getSavedCompanies(req, res) {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Authentication required.' });
    }
    const userId = req.user.id;

    const saved = await prisma.savedCompany.findMany({
      where: { userId },
      include: { company: true },
    });

    const companies = saved.map((s) => ({
      id: s.company.id,
      slug: s.company.slug,
      name: s.company.name,
      logo: s.company.customLogo || s.company.logo || s.company.logoUrl,
      logoUrl: s.company.customLogo || s.company.logo || s.company.logoUrl,
      ctc: s.company.ctc,
      tier: s.company.tier,
      description: s.company.description,
      tags: s.company.tags ? s.company.tags.split(',').map((t) => t.trim()) : [],
      isSaved: true,
    }));

    res.json({ data: companies });
  } catch (err) {
    console.error('Get saved companies error:', err);
    res.status(500).json({ message: 'Failed to retrieve saved companies.' });
  }
}

// POST /api/users/me/saved/:companyId
async function toggleSaveCompany(req, res) {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Authentication required.' });
    }
    const { companyId } = req.params;
    const userId = req.user.id;

    // 1. Find company by ID or Slug
    const targetCompany = await prisma.company.findFirst({
      where: {
        OR: [{ id: companyId }, { slug: companyId }],
      },
    });

    if (!targetCompany) {
      return res.status(404).json({ message: 'Company not found.' });
    }

    const realCompanyId = targetCompany.id;

    // 2. Check if already saved in SavedCompany table
    const existing = await prisma.savedCompany.findUnique({
      where: {
        userId_companyId: { userId, companyId: realCompanyId },
      },
    });

    let isSaved = false;
    if (existing) {
      await prisma.savedCompany.delete({
        where: {
          userId_companyId: { userId, companyId: realCompanyId },
        },
      });
      isSaved = false;
    } else {
      await prisma.savedCompany.create({
        data: { userId, companyId: realCompanyId },
      });
      isSaved = true;
    }

    // 3. Fetch latest list of saved companies from database
    const saved = await prisma.savedCompany.findMany({
      where: { userId },
      include: { company: true },
    });

    const companies = saved.map((s) => ({
      id: s.company.id,
      slug: s.company.slug,
      name: s.company.name,
      logo: s.company.customLogo || s.company.logo || s.company.logoUrl,
      logoUrl: s.company.customLogo || s.company.logo || s.company.logoUrl,
      ctc: s.company.ctc,
      tier: s.company.tier,
      description: s.company.description,
      tags: s.company.tags ? s.company.tags.split(',').map((t) => t.trim()) : [],
      isSaved: true,
    }));

    res.json({ isSaved, data: companies, savedCount: companies.length });
  } catch (err) {
    console.error('Toggle save company error:', err);
    res.status(500).json({ message: 'Failed to update saved company status.' });
  }
}

// PATCH /api/users/me & /api/users/profile-setup
async function updateProfile(req, res) {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Authentication required.' });
    }
    const userId = req.user.id;
    const userEmail = req.user.email || '';
    const {
      fullName,
      name,
      avatar,
      avatarUrl,
      department,
      branch,
      degree,
      graduationYear,
      batchYear,
      section,
      rollNumber,
      rollNo,
      cgpa,
      placementGoal,
      targetRole,
      interestedRoles,
      programmingLanguages,
      frameworks,
      technologies,
      github,
      linkedin,
      leetcode,
      codeforces,
      codechef,
      resume,
      bio,
      isSetup,
    } = req.body;

    // ── Input Validation ──────────────────────────────────────────────────────
    // 1. CGPA Validation (0.00 to 10.00)
    let validatedCgpa = undefined;
    const rawCgpa = cgpa !== undefined ? cgpa : req.body.CGPA;
    if (rawCgpa !== undefined && rawCgpa !== null && String(rawCgpa).trim() !== '') {
      const parsedCgpa = parseFloat(String(rawCgpa).trim());
      if (isNaN(parsedCgpa) || parsedCgpa < 0.0 || parsedCgpa > 10.0) {
        return res.status(400).json({ message: 'CGPA must be a valid number between 0.00 and 10.00.' });
      }
      validatedCgpa = parsedCgpa.toFixed(2);
    }

    // 2. Roll Number Validation (9 Digits)
    let validatedRoll = undefined;
    const rawRoll = rollNumber || rollNo;
    if (rawRoll !== undefined && rawRoll !== null && String(rawRoll).trim() !== '') {
      const cleanRoll = String(rawRoll).trim().replace(/\D/g, '');
      if (cleanRoll.length !== 9) {
        return res.status(400).json({ message: 'SASTRA Roll Number must be exactly 9 digits (e.g. 127015088).' });
      }
      validatedRoll = cleanRoll;
    }

    // 3. Graduation Year Validation
    let validatedGradYear = undefined;
    const rawGradYear = graduationYear || batchYear;
    if (rawGradYear !== undefined && rawGradYear !== null && String(rawGradYear).trim() !== '') {
      const parsedYear = parseInt(String(rawGradYear).trim(), 10);
      if (!isNaN(parsedYear) && parsedYear >= 2000 && parsedYear <= 2040) {
        validatedGradYear = parsedYear;
      }
    }

    // Branch / Department & Graduation Year Resolution
    const parsedRoll = parseRollNumber(validatedRoll || userEmail);
    const resolvedBranch = department || branch || parsedRoll?.branch || undefined;
    const finalGradYear = validatedGradYear || parsedRoll?.graduationYear || undefined;
    const finalName = fullName || name || undefined;
    const finalAvatar = avatar || avatarUrl || undefined;
    const finalGoal = placementGoal || targetRole || undefined;

    const updateData = {
      fullName: finalName,
      name: finalName,
      avatar: finalAvatar,
      avatarUrl: finalAvatar,
      department: resolvedBranch,
      branch: resolvedBranch,
      degree: degree || undefined,
      graduationYear: finalGradYear,
      batchYear: finalGradYear,
      section: section !== undefined ? section : undefined,
      rollNumber: validatedRoll,
      rollNo: validatedRoll,
      cgpa: validatedCgpa,
      placementGoal: finalGoal,
      targetRole: finalGoal,
      interestedRoles: Array.isArray(interestedRoles) ? interestedRoles.join(',') : interestedRoles,
      programmingLanguages: Array.isArray(programmingLanguages) ? programmingLanguages.join(',') : programmingLanguages,
      frameworks: Array.isArray(frameworks) ? frameworks.join(',') : frameworks,
      technologies: Array.isArray(technologies) ? technologies.join(',') : technologies,
      github: github !== undefined ? String(github).trim() : undefined,
      linkedin: linkedin !== undefined ? String(linkedin).trim() : undefined,
      leetcode: leetcode !== undefined ? String(leetcode).trim() : undefined,
      codeforces: codeforces !== undefined ? String(codeforces).trim() : undefined,
      codechef: codechef !== undefined ? String(codechef).trim() : undefined,
      resume: resume !== undefined ? String(resume).trim() : undefined,
      bio: bio !== undefined ? String(bio).trim() : undefined,
      profileCompleted: true,
    };

    // Remove undefined keys so Prisma won't overwrite existing fields with null unless specified
    Object.keys(updateData).forEach((key) => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    let user;
    try {
      user = await prisma.user.upsert({
        where: { id: userId },
        update: updateData,
        create: {
          id: userId,
          email: userEmail || `${userId}@sastra.ac.in`,
          ...updateData,
        },
      });
    } catch (e) {
      console.warn('DB upsert profile fallback:', e.message);
      user = { id: userId, email: userEmail, ...updateData };
    }

    const isPrimary = user.email && user.email.toLowerCase().trim() === '127015088@sastra.ac.in';
    const parsedUserRoll = parseRollNumber(user.email || user.rollNumber || user.rollNo);
    const rawBranchOut = user.department || user.branch || parsedUserRoll?.branch || 'CSE';
    const gradYearOut = user.graduationYear || user.batchYear || parsedUserRoll?.graduationYear || 2026;
    const rollOut = user.rollNumber || user.rollNo || (user.email ? user.email.split('@')[0] : '');

    res.json({
      user: {
        id: user.id,
        name: user.fullName || user.name || 'SASTRA Student',
        fullName: user.fullName || user.name || 'SASTRA Student',
        email: user.email,
        role: isPrimary ? 'ADMIN' : (user.role || 'STUDENT').toUpperCase(),
        isPrimaryAdmin: isPrimary ? true : (user.isPrimaryAdmin || false),
        avatar: user.avatar || user.avatarUrl,
        avatarUrl: user.avatar || user.avatarUrl,
        department: rawBranchOut,
        branch: rawBranchOut,
        degree: user.degree || 'B.Tech',
        graduationYear: gradYearOut,
        batchYear: gradYearOut,
        section: user.section || 'A',
        rollNumber: rollOut,
        rollNo: rollOut,
        cgpa: user.cgpa || '8.50',
        placementGoal: user.placementGoal || user.targetRole || 'Software Engineer',
        targetRole: user.placementGoal || user.targetRole || 'Software Engineer',
        batch: String(gradYearOut),
        interestedRoles: user.interestedRoles ? (Array.isArray(user.interestedRoles) ? user.interestedRoles : user.interestedRoles.split(',').map((s) => s.trim())) : [],
        programmingLanguages: user.programmingLanguages ? (Array.isArray(user.programmingLanguages) ? user.programmingLanguages : user.programmingLanguages.split(',').map((s) => s.trim())) : [],
        frameworks: user.frameworks ? (Array.isArray(user.frameworks) ? user.frameworks : user.frameworks.split(',').map((s) => s.trim())) : [],
        technologies: user.technologies ? (Array.isArray(user.technologies) ? user.technologies : user.technologies.split(',').map((s) => s.trim())) : [],
        github: user.github || '',
        linkedin: user.linkedin || '',
        leetcode: user.leetcode || '',
        codeforces: user.codeforces || '',
        codechef: user.codechef || '',
        resume: user.resume || '',
        bio: user.bio || '',
        profileCompleted: user.profileCompleted ?? true,
      },
    });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ message: 'Failed to update profile.' });
  }
}

// POST /api/users/change-password
async function changePassword(req, res) {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Authentication required.' });
    }
    const userId = req.user.id;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters.' });
    }

    if (confirmPassword && newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'New Password and Confirm Password do not match.' });
    }

    const bcrypt = require('bcryptjs');
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (user.passwordHash && currentPassword) {
      const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isValid) {
        return res.status(400).json({ message: 'Incorrect current password.' });
      }
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });

    res.json({ message: 'Password updated successfully!' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ message: 'Failed to update password.' });
  }
}

module.exports = { getSavedCompanies, toggleSaveCompany, updateProfile, changePassword };
