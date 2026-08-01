const bcrypt = require('bcryptjs');
const prisma = require('../db');

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

    // Get department distribution
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
      sortBy = 'name_asc',
      page = 1,
      limit = 50,
    } = req.query;

    const whereClause = {
      role: { not: 'ADMIN' },
    };

    // 1. Search by Name, Email, or Roll Number
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

    // 2. Filter by Department
    if (department && department !== 'All') {
      whereClause.OR = whereClause.OR || [];
      whereClause.OR.push(
        { department: { equals: department, mode: 'insensitive' } },
        { branch: { equals: department, mode: 'insensitive' } }
      );
    }

    // 3. Filter by Graduation Year
    if (graduationYear && graduationYear !== 'All') {
      const yr = parseInt(graduationYear);
      if (!isNaN(yr)) {
        whereClause.graduationYear = yr;
      }
    }

    // 4. Filter by Placement Goal
    if (placementGoal && placementGoal !== 'All') {
      whereClause.placementGoal = { contains: placementGoal, mode: 'insensitive' };
    }

    // 5. Filter by Profile Completion
    if (profileCompleted && profileCompleted !== 'All') {
      whereClause.profileCompleted = profileCompleted === 'true';
    }

    // 6. Sorting Order
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

    res.json({
      data: formattedStudents,
      pagination: {
        total: totalStudents,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalStudents / parseInt(limit)),
      },
    });
  } catch (err) {
    console.error('Get admin students error:', err);
    res.status(500).json({ message: 'Failed to retrieve students list.' });
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
        graduationYear: user.graduationYear || user.batchYear || p.graduationYear || 2026,
        section: user.section || p.section || 'A',
        cgpa: user.cgpa || p.cgpa || '8.50',
        placementGoal: user.placementGoal || u.targetRole || p.placementGoal || 'Software Engineer',
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
        isPrimaryAdmin: a.isPrimaryAdmin || false,
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

// POST /api/admin/manage/add
async function addAdmin(req, res) {
  try {
    const { email, fullName, password } = req.body;

    if (!email || !email.endsWith('@sastra.ac.in')) {
      return res.status(400).json({ message: 'Valid @sastra.ac.in email is required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    let user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    const passwordHash = password ? await bcrypt.hash(password, 10) : undefined;

    if (user) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          role: 'ADMIN',
          isActive: true,
          fullName: fullName || user.fullName || user.name,
          passwordHash: passwordHash || user.passwordHash,
        },
      });
    } else {
      user = await prisma.user.create({
        data: {
          email: normalizedEmail,
          fullName: fullName || 'Placement Admin',
          name: fullName || 'Placement Admin',
          role: 'ADMIN',
          passwordHash: passwordHash || (await bcrypt.hash('admin123', 10)),
          isPrimaryAdmin: false,
          isActive: true,
        },
      });
    }

    res.status(201).json({
      message: `Admin rights granted to ${normalizedEmail} successfully.`,
      admin: {
        id: user.id,
        fullName: user.fullName || user.name,
        email: user.email,
        role: 'ADMIN',
        isPrimaryAdmin: user.isPrimaryAdmin,
        isActive: user.isActive,
      },
    });
  } catch (err) {
    console.error('Add admin error:', err);
    res.status(500).json({ message: 'Failed to add admin.' });
  }
}

// PATCH /api/admin/manage/:id/toggle
async function toggleAdminStatus(req, res) {
  try {
    const { id } = req.params;
    const admin = await prisma.user.findUnique({ where: { id } });

    if (!admin || admin.role !== 'ADMIN') {
      return res.status(404).json({ message: 'Admin account not found.' });
    }

    if (admin.isPrimaryAdmin) {
      return res.status(400).json({ message: 'Primary Admin status cannot be toggled/disabled.' });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { isActive: !admin.isActive },
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

// POST /api/admin/manage/transfer
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

    // 1. Demote current primary admin to normal admin
    await prisma.user.updateMany({
      where: { isPrimaryAdmin: true },
      data: { isPrimaryAdmin: false },
    });

    // 2. Promote target user to primary admin
    const updatedTarget = await prisma.user.update({
      where: { id: targetAdminId },
      data: { isPrimaryAdmin: true, role: 'ADMIN', isActive: true },
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

// DELETE /api/admin/manage/:id
async function deleteAdmin(req, res) {
  try {
    const { id } = req.params;
    const admin = await prisma.user.findUnique({ where: { id } });

    if (!admin || admin.role !== 'ADMIN') {
      return res.status(404).json({ message: 'Admin account not found.' });
    }

    if (admin.isPrimaryAdmin) {
      return res.status(400).json({ message: 'Primary Admin privileges cannot be revoked directly.' });
    }

    await prisma.user.update({
      where: { id },
      data: { role: 'STUDENT', isPrimaryAdmin: false },
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

module.exports = {
  getAdminStats,
  getStudents,
  getStudentDetails,
  getAdminsList,
  addAdmin,
  toggleAdminStatus,
  transferPrimaryAdmin,
  deleteAdmin,
  exportStudentsData,
};
