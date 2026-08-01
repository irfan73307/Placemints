const prisma = require('../db');

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

    const whereClause = {};

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
        accountStatus: 'Active',
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
        accountStatus: 'Active',
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

// GET /api/admin/students/export
async function exportStudentsData(req, res) {
  try {
    const users = await prisma.user.findMany({
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
  getStudents,
  getStudentDetails,
  exportStudentsData,
};
