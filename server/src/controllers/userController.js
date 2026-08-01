const prisma = require('../db');

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
      logo: s.company.logoUrl,
      logoUrl: s.company.logoUrl,
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
      logo: s.company.logoUrl,
      logoUrl: s.company.logoUrl,
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
    const {
      fullName,
      name,
      avatar,
      avatarUrl,
      department,
      degree,
      graduationYear,
      section,
      rollNumber,
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

    const updateData = {
      fullName: fullName || name,
      name: fullName || name,
      avatar: avatar || avatarUrl,
      avatarUrl: avatar || avatarUrl,
      department,
      branch: department,
      degree,
      graduationYear: graduationYear ? parseInt(graduationYear) : undefined,
      section,
      rollNumber,
      rollNo: rollNumber,
      cgpa,
      placementGoal: placementGoal || targetRole,
      targetRole: placementGoal || targetRole,
      batchYear: graduationYear ? parseInt(graduationYear) : undefined,
      interestedRoles: Array.isArray(interestedRoles) ? interestedRoles.join(',') : interestedRoles,
      programmingLanguages: Array.isArray(programmingLanguages) ? programmingLanguages.join(',') : programmingLanguages,
      frameworks: Array.isArray(frameworks) ? frameworks.join(',') : frameworks,
      technologies: Array.isArray(technologies) ? technologies.join(',') : technologies,
      github,
      linkedin,
      leetcode,
      codeforces,
      codechef,
      resume,
      bio,
      profileCompleted: true,
    };

    let user;
    try {
      user = await prisma.user.upsert({
        where: { id: userId },
        update: updateData,
        create: {
          id: userId,
          email: req.user?.email || `${userId}@sastra.ac.in`,
          ...updateData,
        },
      });
    } catch (e) {
      console.warn('DB upsert profile fallback:', e.message);
      user = { id: userId, email: req.user?.email, ...updateData };
    }

    res.json({
      user: {
        id: user.id,
        name: user.fullName || user.name,
        fullName: user.fullName || user.name,
        email: user.email,
        avatar: user.avatar || user.avatarUrl,
        department: user.department || user.branch,
        branch: user.department || user.branch,
        degree: user.degree || 'B.Tech',
        graduationYear: user.graduationYear || user.batchYear,
        section: user.section || 'A',
        rollNumber: user.rollNumber || user.rollNo,
        cgpa: user.cgpa,
        placementGoal: user.placementGoal || user.targetRole,
        targetRole: user.placementGoal || user.targetRole,
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
        profileCompleted: user.profileCompleted,
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
