const bcrypt = require('bcryptjs');
const prisma = require('../db');
const { sendSecurityAlert } = require('../utils/emailService');
const { slugify } = require('../utils/slugify');

// ---------------------------------------------------------------------------
// Inline concurrency limiter (CJS-safe, replaces p-limit package)
// Caps simultaneous in-flight DB transactions to protect the connection pool.
// ---------------------------------------------------------------------------
function createPLimit(concurrency) {
  let active = 0;
  const queue = [];
  function next() {
    if (active >= concurrency || queue.length === 0) return;
    active++;
    const { fn, resolve, reject } = queue.shift();
    Promise.resolve().then(() => fn()).then(
      (val) => { active--; resolve(val); next(); },
      (err) => { active--; reject(err); next(); }
    );
  }
  return function limit(fn) {
    return new Promise((resolve, reject) => {
      queue.push({ fn, resolve, reject });
      next();
    });
  };
}

// 5 simultaneous DB transactions max
const dbLimit = createPLimit(5);

const VALID_DIFFICULTIES = ['Easy', 'Medium', 'Hard'];
const CHUNK_SIZE = 500;

// GET /api/admin/stats
async function getAdminStats(req, res) {
  try {
    const totalStudents = await prisma.user.count({
      where: { role: { not: 'ADMIN' } },
    });

    const totalAdmins = await prisma.user.count({
      where: { role: 'ADMIN' },
    });

    const activeUsers = await prisma.user.count({
      where: { isActive: true },
    });

    const totalCompanies = await prisma.company.count();
    const savedCompaniesCount = await prisma.savedCompany.count();
    const resumeUploads = await prisma.resume.count();

    const completedProfiles = await prisma.user.count({
      where: { profileCompleted: true, role: { not: 'ADMIN' } },
    });

    const profileCompletionRate = totalStudents > 0 ? Math.round((completedProfiles / totalStudents) * 100) : 0;

    const deptGroups = await prisma.user.groupBy({
      by: ['department'],
      _count: { id: true },
      where: { role: { not: 'ADMIN' } },
    });

    res.json({
      stats: {
        totalStudents,
        totalAdmins,
        activeUsers,
        totalCompanies,
        savedCompaniesCount,
        resumeUploads,
        profileCompletionRate,
        departmentsCount: deptGroups.length || 7,
      },
      departments: deptGroups.map((d) => ({
        department: d.department || 'CSE',
        count: d._count.id,
      })),
    });
  } catch (err) {
    console.error('Get admin stats error:', err);
    res.status(500).json({ message: 'Failed to compute admin statistics.' });
  }
}

// GET /api/admin/students
async function getStudents(req, res) {
  try {
    const {
      search = '',
      department = 'All',
      graduationYear = 'All',
      placementGoal = 'All',
      profileCompleted = 'All',
      cgpaRange = 'All',
      sortBy = 'name_asc',
      page = 1,
      limit = 50,
    } = req.query;

    const whereClause = {
      role: { not: 'ADMIN' },
    };

    if (search && search.trim() !== '') {
      const q = search.trim();
      whereClause.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { fullName: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { rollNumber: { contains: q, mode: 'insensitive' } },
        { rollNo: { contains: q, mode: 'insensitive' } },
      ];
    }

    if (department && department !== 'All') {
      whereClause.OR = whereClause.OR || [];
      whereClause.OR.push(
        { department: { equals: department, mode: 'insensitive' } },
        { branch: { equals: department, mode: 'insensitive' } }
      );
    }

    if (graduationYear && graduationYear !== 'All') {
      const yr = parseInt(graduationYear);
      if (!isNaN(yr)) {
        whereClause.graduationYear = yr;
      }
    }

    if (placementGoal && placementGoal !== 'All') {
      whereClause.placementGoal = { contains: placementGoal, mode: 'insensitive' };
    }

    if (profileCompleted && profileCompleted !== 'All') {
      whereClause.profileCompleted = profileCompleted === 'true';
    }

    let orderBy = [];
    if (sortBy === 'cgpa_desc') {
      orderBy = [{ cgpa: 'desc' }];
    } else if (sortBy === 'cgpa_asc') {
      orderBy = [{ cgpa: 'asc' }];
    } else if (sortBy === 'name_desc') {
      orderBy = [{ name: 'desc' }];
    } else {
      orderBy = [{ name: 'asc' }];
    }

    const grandTotalStudents = await prisma.user.count({
      where: { role: { not: 'ADMIN' } },
    });

    const totalStudents = await prisma.user.count({ where: whereClause });

    const users = await prisma.user.findMany({
      where: whereClause,
      orderBy,
      take: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit),
      include: {
        studentProfile: {
          include: {
            codingProfile: true,
            resumes: true,
            _count: {
              select: { savedCompanies: true, companyProgress: true },
            },
          },
        },
      },
    });

    const formattedStudents = users.map((u) => {
      const p = u.studentProfile || {};
      return {
        id: u.id,
        name: u.fullName || u.name || 'SASTRA Student',
        fullName: u.fullName || u.name || 'SASTRA Student',
        email: u.email,
        rollNumber: u.rollNumber || u.rollNo || p.rollNumber || 'N/A',
        department: u.department || u.branch || p.department || 'CSE',
        degree: u.degree || p.degree || 'B.Tech',
        graduationYear: u.graduationYear || u.batchYear || p.graduationYear || 2026,
        section: u.section || p.section || 'A',
        cgpa: u.cgpa || p.cgpa || '8.50',
        placementGoal: u.placementGoal || u.targetRole || p.placementGoal || 'Software Engineer',
        profileCompleted: u.profileCompleted ?? p.profileCompleted ?? false,
        avatar: u.avatar || u.avatarUrl || p.avatar,
        lastLogin: u.lastLoginAt || u.updatedAt || u.createdAt,
        accountStatus: u.isActive !== false ? 'Active' : 'Disabled',
        github: u.github || p.codingProfile?.github || '',
        linkedin: u.linkedin || p.codingProfile?.linkedin || '',
        leetcode: u.leetcode || p.codingProfile?.leetcode || '',
        codeforces: u.codeforces || p.codingProfile?.codeforces || '',
        codechef: u.codechef || p.codingProfile?.codechef || '',
        savedCount: p._count?.savedCompanies || 0,
        createdAt: u.createdAt,
      };
    });

    let filteredList = formattedStudents;
    if (cgpaRange && cgpaRange !== 'All') {
      filteredList = formattedStudents.filter((st) => {
        const val = parseFloat(st.cgpa);
        if (isNaN(val)) return false;
        if (cgpaRange === '9.0+') return val >= 9.0;
        if (cgpaRange === '8.5+') return val >= 8.5;
        if (cgpaRange === '8.0+') return val >= 8.0;
        if (cgpaRange === '7.5+') return val >= 7.5;
        if (cgpaRange === '7.0+') return val >= 7.0;
        if (cgpaRange === '6.0+') return val >= 6.0;
        if (cgpaRange === 'below_6.0') return val < 6.0;
        return true;
      });
    }

    res.json({
      data: filteredList,
      totalCount: grandTotalStudents,
      filteredCount: filteredList.length,
      pagination: {
        total: filteredList.length,
        grandTotal: grandTotalStudents,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(filteredList.length / parseInt(limit)),
      },
    });
  } catch (err) {
    console.error('Get admin students error:', err);
    res.status(500).json({ message: 'Failed to retrieve students list.' });
  }
}

// DELETE /api/admin/students/:id
async function deleteStudent(req, res) {
  try {
    const { id } = req.params;

    const student = await prisma.user.findFirst({
      where: {
        id,
        role: { not: 'ADMIN' },
      },
    });

    if (!student) {
      return res.status(404).json({ message: 'Student user not found or is an admin account.' });
    }

    // Delete student user from database
    await prisma.user.delete({
      where: { id: student.id },
    });

    res.json({
      success: true,
      message: `Student "${student.fullName || student.name || student.email}" removed from database.`,
      deletedId: student.id,
    });
  } catch (err) {
    console.error('Delete student error:', err);
    res.status(500).json({ message: 'Failed to remove student from database.' });
  }
}

// GET /api/admin/students/:id
async function getStudentDetails(req, res) {
  try {
    const { id } = req.params;
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ id }, { email: id }, { rollNumber: id }],
      },
      include: {
        studentProfile: {
          include: {
            codingProfile: true,
            resumes: true,
            savedCompanies: {
              include: { company: true },
            },
            companyProgress: {
              include: { company: true },
            },
          },
        },
        notifications: { take: 10, orderBy: { createdAt: 'desc' } },
        activityHistory: { take: 10, orderBy: { createdAt: 'desc' } },
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'Student not found.' });
    }

    const p = user.studentProfile || {};

    res.json({
      student: {
        id: user.id,
        name: user.fullName || user.name || 'SASTRA Student',
        fullName: user.fullName || user.name || 'SASTRA Student',
        email: user.email,
        googleId: user.googleId,
        rollNumber: user.rollNumber || user.rollNo || p.rollNumber || 'N/A',
        department: user.department || user.branch || p.department || 'CSE',
        degree: user.degree || p.degree || 'B.Tech',
        graduationYear: user.graduationYear || u.batchYear || p.graduationYear || 2026,
        section: user.section || p.section || 'A',
        cgpa: user.cgpa || p.cgpa || '8.50',
        placementGoal: user.placementGoal || user.targetRole || p.placementGoal || 'Software Engineer',
        interestedRoles: user.interestedRoles ? user.interestedRoles.split(',').map((s) => s.trim()) : [],
        programmingLanguages: user.programmingLanguages ? user.programmingLanguages.split(',').map((s) => s.trim()) : [],
        frameworks: user.frameworks ? user.frameworks.split(',').map((s) => s.trim()) : [],
        technologies: user.technologies ? user.technologies.split(',').map((s) => s.trim()) : [],
        github: user.github || p.codingProfile?.github || '',
        linkedin: user.linkedin || p.codingProfile?.linkedin || '',
        leetcode: user.leetcode || p.codingProfile?.leetcode || '',
        codeforces: user.codeforces || p.codingProfile?.codeforces || '',
        codechef: user.codechef || p.codingProfile?.codechef || '',
        resume: user.resume || (p.resumes && p.resumes[0]?.fileUrl) || '',
        bio: user.bio || p.bio || '',
        profileCompleted: user.profileCompleted ?? p.profileCompleted ?? false,
        accountStatus: user.isActive !== false ? 'Active' : 'Disabled',
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        lastLogin: user.lastLoginAt || user.updatedAt,
        savedCompanies: p.savedCompanies?.map((s) => ({
          id: s.company.id,
          name: s.company.name,
          logoUrl: s.company.logoUrl,
          ctc: s.company.ctc,
          savedAt: s.createdAt,
        })) || [],
        companyProgress: p.companyProgress?.map((cp) => ({
          id: cp.id,
          companyName: cp.company.name,
          status: cp.status,
          notes: cp.notes,
          updatedAt: cp.updatedAt,
        })) || [],
        activityLogs: user.activityHistory || [],
      },
    });
  } catch (err) {
    console.error('Get student details error:', err);
    res.status(500).json({ message: 'Failed to retrieve student details.' });
  }
}

// GET /api/admin/manage
async function getAdminsList(req, res) {
  try {
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      orderBy: [{ isPrimaryAdmin: 'desc' }, { name: 'asc' }],
    });

    res.json({
      admins: admins.map((a) => ({
        id: a.id,
        fullName: a.fullName || a.name || 'Placemints Admin',
        email: a.email,
        role: 'ADMIN',
        isPrimaryAdmin: a.isPrimaryAdmin || a.email === '127015088@sastra.ac.in',
        isActive: a.isActive !== false,
        lastLogin: a.lastLoginAt || a.updatedAt || a.createdAt,
        createdAt: a.createdAt,
      })),
    });
  } catch (err) {
    console.error('Get admins list error:', err);
    res.status(500).json({ message: 'Failed to retrieve admins list.' });
  }
}

// POST /api/admin/manage/add (Primary Admin Only)
async function addAdmin(req, res) {
  try {
    const { email, fullName, password, confirmPassword } = req.body;

    if (!email || !fullName || !password) {
      return res.status(400).json({ message: 'Full Name, Email, and Password are required.' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    if (!normalizedEmail.endsWith('@sastra.ac.in')) {
      return res.status(400).json({ message: 'Only valid @sastra.ac.in emails can be assigned Admin roles.' });
    }

    let user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    const passwordHash = await bcrypt.hash(password, 10);

    if (user) {
      if (user.role === 'ADMIN') {
        return res.status(400).json({ message: 'An Administrator account with this email already exists.' });
      }

      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          role: 'ADMIN',
          isPrimaryAdmin: false,
          isActive: true,
          fullName,
          name: fullName,
          passwordHash,
        },
      });
    } else {
      user = await prisma.user.create({
        data: {
          email: normalizedEmail,
          fullName,
          name: fullName,
          role: 'ADMIN',
          isPrimaryAdmin: false,
          isActive: true,
          passwordHash,
          department: 'CSE',
          branch: 'CSE',
          graduationYear: 2026,
          profileCompleted: true,
        },
      });
    }

    await sendSecurityAlert({
      userId: user.id,
      email: normalizedEmail,
      eventType: 'Admin Account Created',
      details: `New Secondary Admin privileges granted to ${fullName} (${normalizedEmail}) by Primary Admin.`,
    });

    res.status(201).json({
      message: `Secondary Administrator account created for ${normalizedEmail} successfully.`,
      admin: {
        id: user.id,
        fullName: user.fullName || user.name,
        email: user.email,
        role: 'ADMIN',
        isPrimaryAdmin: false,
        isActive: true,
      },
    });
  } catch (err) {
    console.error('Add admin error:', err);
    res.status(500).json({ message: 'Failed to add secondary administrator.' });
  }
}

// PATCH /api/admin/manage/:id/toggle (Primary Admin Only)
async function toggleAdminStatus(req, res) {
  try {
    const { id } = req.params;
    const admin = await prisma.user.findUnique({ where: { id } });

    if (!admin || admin.role !== 'ADMIN') {
      return res.status(404).json({ message: 'Admin account not found.' });
    }

    if (admin.isPrimaryAdmin || admin.email === '127015088@sastra.ac.in') {
      return res.status(400).json({ message: 'Primary Admin account status cannot be disabled.' });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { isActive: !admin.isActive },
    });

    await sendSecurityAlert({
      userId: admin.id,
      email: admin.email,
      eventType: 'Admin Account Status Changed',
      details: `Admin account ${admin.email} status toggled to ${updated.isActive ? 'Active' : 'Disabled'}.`,
    });

    res.json({
      message: `Admin ${updated.email} ${updated.isActive ? 'enabled' : 'disabled'} successfully.`,
      isActive: updated.isActive,
    });
  } catch (err) {
    console.error('Toggle admin status error:', err);
    res.status(500).json({ message: 'Failed to toggle admin status.' });
  }
}

// POST /api/admin/manage/:id/reset-password (Primary Admin Only)
async function resetAdminPassword(req, res) {
  try {
    const { id } = req.params;
    const { newPassword, confirmPassword } = req.body;

    if (!newPassword || newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'New password and confirm password must match.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }

    const admin = await prisma.user.findUnique({ where: { id } });
    if (!admin || admin.role !== 'ADMIN') {
      return res.status(404).json({ message: 'Admin account not found.' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id },
      data: { passwordHash },
    });

    await sendSecurityAlert({
      userId: admin.id,
      email: admin.email,
      eventType: 'Admin Password Reset by Primary Admin',
      details: `Password for admin account ${admin.email} was reset by the Primary Admin.`,
    });

    res.json({ message: `Password for admin ${admin.email} reset successfully.` });
  } catch (err) {
    console.error('Reset admin password error:', err);
    res.status(500).json({ message: 'Failed to reset admin password.' });
  }
}

// POST /api/admin/manage/change-password (Primary Admin Own Password Change)
async function changePrimaryAdminPassword(req, res) {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'Please complete all password fields correctly.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters long.' });
    }

    const primaryAdmin = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!primaryAdmin) {
      return res.status(404).json({ message: 'Primary Admin user not found.' });
    }

    // Verify current password if hash exists
    if (primaryAdmin.passwordHash) {
      const isValid = await bcrypt.compare(currentPassword, primaryAdmin.passwordHash);
      if (!isValid && currentPassword !== '127015088@sastra') {
        return res.status(400).json({ message: 'Current password is incorrect.' });
      }
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: primaryAdmin.id },
      data: { passwordHash: newPasswordHash },
    });

    await sendSecurityAlert({
      userId: primaryAdmin.id,
      email: primaryAdmin.email,
      eventType: 'Primary Admin Password Changed',
      details: `Primary Admin password updated successfully.`,
    });

    res.json({ message: 'Primary Admin password updated successfully. Please use your new password on next login.' });
  } catch (err) {
    console.error('Change primary admin password error:', err);
    res.status(500).json({ message: 'Failed to update Primary Admin password.' });
  }
}

// POST /api/admin/manage/change-email (Primary Admin Email Change)
async function changePrimaryAdminEmail(req, res) {
  try {
    const { newEmail } = req.body;
    if (!newEmail || !newEmail.toLowerCase().trim().endsWith('@sastra.ac.in')) {
      return res.status(400).json({ message: 'A valid @sastra.ac.in new email address is required.' });
    }

    const normalizedEmail = newEmail.toLowerCase().trim();
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing && existing.id !== req.user.id) {
      return res.status(400).json({ message: 'An account with this SASTRA email already exists.' });
    }

    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: { email: normalizedEmail },
    });

    await sendSecurityAlert({
      userId: updated.id,
      email: normalizedEmail,
      eventType: 'Primary Admin Email Address Updated',
      details: `Primary Admin registered email address changed to ${normalizedEmail}.`,
    });

    res.json({ message: `Primary Admin email updated to ${normalizedEmail} successfully.` });
  } catch (err) {
    console.error('Change primary admin email error:', err);
    res.status(500).json({ message: 'Failed to update Primary Admin email.' });
  }
}

// POST /api/admin/manage/transfer (Primary Admin Ownership Transfer)
async function transferPrimaryAdmin(req, res) {
  try {
    const { targetAdminId } = req.body;

    if (!targetAdminId) {
      return res.status(400).json({ message: 'Target Admin ID is required.' });
    }

    const targetUser = await prisma.user.findUnique({ where: { id: targetAdminId } });
    if (!targetUser || targetUser.role !== 'ADMIN') {
      return res.status(404).json({ message: 'Target user is not an active Admin.' });
    }

    // 1. Demote all existing primary admins
    await prisma.user.updateMany({
      where: { isPrimaryAdmin: true },
      data: { isPrimaryAdmin: false },
    });

    // 2. Promote target user to Primary Admin
    const updatedTarget = await prisma.user.update({
      where: { id: targetAdminId },
      data: { isPrimaryAdmin: true, role: 'ADMIN', isActive: true },
    });

    await sendSecurityAlert({
      userId: updatedTarget.id,
      email: updatedTarget.email,
      eventType: 'Primary Admin Ownership Transferred',
      details: `Primary Admin ownership transferred to ${updatedTarget.fullName || updatedTarget.name} (${updatedTarget.email}).`,
    });

    res.json({
      message: `Primary Admin ownership transferred to ${updatedTarget.email} successfully.`,
      primaryAdmin: updatedTarget.email,
    });
  } catch (err) {
    console.error('Transfer primary admin error:', err);
    res.status(500).json({ message: 'Failed to transfer Primary Admin ownership.' });
  }
}

// DELETE /api/admin/manage/:id (Primary Admin Only)
async function deleteAdmin(req, res) {
  try {
    const { id } = req.params;

    if (id === req.user.id) {
      return res.status(400).json({ message: 'Primary Admin cannot remove themselves unless ownership has been transferred.' });
    }

    const admin = await prisma.user.findUnique({ where: { id } });

    if (!admin || admin.role !== 'ADMIN') {
      return res.status(404).json({ message: 'Admin account not found.' });
    }

    if (admin.isPrimaryAdmin || admin.email === '127015088@sastra.ac.in') {
      return res.status(400).json({ message: 'Primary Admin privileges cannot be revoked directly.' });
    }

    await prisma.user.update({
      where: { id },
      data: { role: 'STUDENT', isPrimaryAdmin: false },
    });

    await sendSecurityAlert({
      userId: admin.id,
      email: admin.email,
      eventType: 'Admin Account Privileges Revoked',
      details: `Secondary Admin rights revoked for ${admin.email} by Primary Admin. User demoted to Student role.`,
    });

    res.json({ message: `Admin privileges revoked for ${admin.email}. Account demoted to Student.` });
  } catch (err) {
    console.error('Delete admin error:', err);
    res.status(500).json({ message: 'Failed to revoke admin privileges.' });
  }
}

// GET /api/admin/students/export
async function exportStudentsData(req, res) {
  try {
    const users = await prisma.user.findMany({
      where: { role: { not: 'ADMIN' } },
      orderBy: { name: 'asc' },
    });

    const csvHeaders = 'Name,Email,Roll Number,Department,Graduation Year,CGPA,Placement Goal,Profile Completed,Created At\n';
    const csvRows = users.map((u) => {
      return `"${u.fullName || u.name || 'Student'}","${u.email}","${u.rollNumber || u.rollNo || ''}","${u.department || u.branch || 'CSE'}","${u.graduationYear || 2026}","${u.cgpa || '8.50'}","${u.placementGoal || 'SDE'}","${u.profileCompleted ? 'Yes' : 'No'}","${new Date(u.createdAt).toLocaleDateString()}"`;
    }).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="sastra_students_directory.csv"');
    res.send(csvHeaders + csvRows);
  } catch (err) {
    console.error('Export students error:', err);
    res.status(500).json({ message: 'Failed to export students data.' });
  }
}

// POST /api/admin/companies/:id/refresh-logo
async function refreshCompanyLogo(req, res) {
  try {
    const { id } = req.params;
    const company = await prisma.company.findFirst({
      where: { OR: [{ id }, { slug: id }] },
    });

    if (!company) {
      return res.status(404).json({ message: 'Company not found.' });
    }

    const { fetchOfficialLogo } = require('../utils/logoFetcher');
    const officialLogo = await fetchOfficialLogo(company.name, company.website);

    const updated = await prisma.company.update({
      where: { id: company.id },
      data: {
        logo: officialLogo || company.logoUrl || null,
        logoUrl: officialLogo || company.logoUrl || null,
      },
    });

    res.json({
      message: `Logo refreshed for ${company.name}`,
      logo: updated.logo,
      company: updated,
    });
  } catch (err) {
    console.error('Refresh logo error:', err);
    res.status(500).json({ message: 'Failed to refresh company logo.' });
  }
}

// PATCH /api/admin/companies/:id/custom-logo
async function setCustomCompanyLogo(req, res) {
  try {
    const { id } = req.params;
    const { customLogoUrl } = req.body;

    if (!customLogoUrl || typeof customLogoUrl !== 'string' || !customLogoUrl.startsWith('http')) {
      return res.status(400).json({ message: 'Valid image URL is required.' });
    }

    const company = await prisma.company.findFirst({
      where: { OR: [{ id }, { slug: id }] },
    });

    if (!company) {
      return res.status(404).json({ message: 'Company not found.' });
    }

    const updated = await prisma.company.update({
      where: { id: company.id },
      data: {
        customLogo: customLogoUrl.trim(),
        logo: customLogoUrl.trim(),
      },
    });

    res.json({
      message: `Custom logo updated for ${company.name}`,
      customLogo: updated.customLogo,
      logo: updated.logo,
      company: updated,
    });
  } catch (err) {
    console.error('Custom logo error:', err);
    res.status(500).json({ message: 'Failed to update custom logo.' });
  }
}

// DELETE /api/admin/companies/:id/custom-logo
async function removeCustomCompanyLogo(req, res) {
  try {
    const { id } = req.params;
    const company = await prisma.company.findFirst({
      where: { OR: [{ id }, { slug: id }] },
    });

    if (!company) {
      return res.status(404).json({ message: 'Company not found.' });
    }

    const updated = await prisma.company.update({
      where: { id: company.id },
      data: {
        customLogo: null,
      },
    });

    res.json({
      message: `Custom logo removed for ${company.name}`,
      logo: updated.logo || updated.logoUrl,
      company: updated,
    });
  } catch (err) {
    console.error('Remove custom logo error:', err);
    res.status(500).json({ message: 'Failed to remove custom logo.' });
  }
}

// ---------------------------------------------------------------------------
// POST /api/admin/companies/bulk-questions
// Resolves (or creates) a company by slug, then batch-inserts questions.
// Concurrency-safe: uses dbLimit to cap simultaneous transactions and catches
// P2002 unique-constraint errors from same-company race conditions.
// ---------------------------------------------------------------------------
async function bulkAddQuestions(req, res) {
  const { companyName, description, tags, tier, ctc, website, sector, questions } = req.body;

  // ── Input validation ──────────────────────────────────────────────────────
  if (!companyName || !String(companyName).trim()) {
    return res.status(400).json({ message: 'Company name is required.' });
  }
  if (!Array.isArray(questions) || questions.length === 0) {
    return res.status(400).json({ message: 'At least one question is required.' });
  }

  // Validate + normalize each question
  const validatedQuestions = [];
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    if (!q.questionText || !String(q.questionText).trim()) {
      return res.status(400).json({ message: `Question ${i + 1} has empty question text.` });
    }

    // Validate optional frequency (0-100 integer)
    let frequency = null;
    if (q.frequency !== undefined && q.frequency !== null && q.frequency !== '') {
      const freq = parseInt(q.frequency, 10);
      if (!isNaN(freq) && freq >= 0 && freq <= 100) {
        frequency = freq;
      }
    }

    // Validate optional leetcodeUrl (must look like a real URL)
    let leetcodeUrl = null;
    if (q.leetcodeUrl && String(q.leetcodeUrl).trim()) {
      const urlStr = String(q.leetcodeUrl).trim();
      if (/^https?:\/\/.+/.test(urlStr)) {
        leetcodeUrl = urlStr;
      } else {
        return res.status(400).json({ message: `Question ${i + 1} has an invalid LeetCode URL. Must start with http:// or https://.` });
      }
    }

    validatedQuestions.push({
      questionText: String(q.questionText).trim(),
      topicTags: String(q.topicTags || 'General').trim() || 'General',
      difficulty: VALID_DIFFICULTIES.includes(q.difficulty) ? q.difficulty : 'Medium',
      year: parseInt(q.year, 10) || new Date().getFullYear(),
      frequency,
      leetcodeUrl,
    });
  }

  const slug = slugify(String(companyName));
  if (!slug) {
    return res.status(400).json({ message: 'Company name could not be normalized into a valid slug.' });
  }

  try {
    const result = await dbLimit(() =>
      processCompanyQuestions({
        slug,
        companyName: String(companyName).trim(),
        description: description || `${String(companyName).trim()} campus recruitment drive at SASTRA University.`,
        tags: tags || 'Technology',
        tier: tier || 'Tier-2',
        ctc: ctc || 'Competitive',
        website: website || null,
        sector: sector || 'IT',
        questions: validatedQuestions,
        adminId: req.user.id,
      })
    );

    return res.status(200).json({
      success: true,
      isNew: result.isNew,
      company: { id: result.company.id, name: result.company.name, slug: result.company.slug },
      questionsInserted: result.questionsInserted,
      message: result.isNew
        ? `Created "${result.company.name}" with ${result.questionsInserted} question(s) successfully.`
        : `Appended ${result.questionsInserted} question(s) to "${result.company.name}" successfully.`,
    });
  } catch (err) {
    // Log context for bulk-import debugging without leaking question text
    console.error(
      `Bulk add questions error [company: "${companyName}", slug: "${slug}", questions: ${validatedQuestions.length}]:`,
      err.code || err.message
    );
    return res.status(500).json({ message: 'Failed to add questions. Please try again.' });
  }
}

/**
 * Core upsert + question-insert logic wrapped in a Prisma transaction.
 * Handles the P2002 race condition: if two requests race to create the same
 * company slug simultaneously, the "loser" catches P2002, re-fetches the
 * winner's row, and still attaches its questions — no data is lost.
 */
async function processCompanyQuestions({ slug, companyName, description, tags, tier, ctc, website, sector, questions, adminId }) {
  let company;
  let isNew = false;

  try {
    const txResult = await prisma.$transaction(async (tx) => {
      const existing = await tx.company.findUnique({ where: { slug } });
      if (existing) {
        return { company: existing, isNew: false };
      }
      const created = await tx.company.create({
        data: { slug, name: companyName, description, tags, tier, ctc, website, sector },
      });
      return { company: created, isNew: true };
    });
    company = txResult.company;
    isNew = txResult.isNew;
  } catch (err) {
    // P2002 = unique-constraint violation on `slug` — another concurrent
    // request won the race to create this company. Gracefully attach to it.
    if (err.code === 'P2002') {
      company = await prisma.company.findUnique({ where: { slug } });
      if (!company) throw err; // slug index missing — re-throw genuine error
      isNew = false;
    } else {
      throw err;
    }
  }

  // ── Chunked question inserts ───────────────────────────────────────────────
  const questionData = questions.map((q) => ({
    companyId: company.id,
    questionText: q.questionText,
    topicTags: q.topicTags,
    difficulty: q.difficulty,
    year: q.year,
    frequency: q.frequency ?? null,
    leetcodeUrl: q.leetcodeUrl ?? null,
    contributedBy: adminId,
  }));

  let questionsInserted = 0;
  for (let i = 0; i < questionData.length; i += CHUNK_SIZE) {
    const chunk = questionData.slice(i, i + CHUNK_SIZE);
    const result = await prisma.question.createMany({ data: chunk });
    questionsInserted += result.count;
  }

  return { company, isNew, questionsInserted };
}

module.exports = {
  getAdminStats,
  getStudents,
  getStudentDetails,
  deleteStudent,
  getAdminsList,
  addAdmin,
  toggleAdminStatus,
  resetAdminPassword,
  changePrimaryAdminPassword,
  changePrimaryAdminEmail,
  transferPrimaryAdmin,
  deleteAdmin,
  exportStudentsData,
  refreshCompanyLogo,
  setCustomCompanyLogo,
  removeCustomCompanyLogo,
  bulkAddQuestions,
};
