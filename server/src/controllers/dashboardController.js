const prisma = require('../db');

// GET /api/dashboard
async function getDashboardData(req, res) {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Authentication required.' });
    }
    const userId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        savedCompanies: {
          include: { company: true },
        },
      },
    });

    const totalCompanies = await prisma.company.count();
    const totalQuestions = await prisma.question.count();
    const totalResources = await prisma.resource.count();

    const recentQuestions = await prisma.question.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { company: true },
    });

    res.json({
      metrics: {
        totalCompanies,
        totalQuestions,
        totalResources,
        savedCompaniesCount: user ? user.savedCompanies.length : 0,
      },
      savedCompanies: user
        ? user.savedCompanies.map((s) => ({
            id: s.company.id,
            name: s.company.name,
            logo: s.company.logoUrl,
            ctc: s.company.ctc,
            tier: s.company.tier,
          }))
        : [],
      recentQuestions: recentQuestions.map((q) => ({
        id: q.id,
        companyName: q.company.name,
        companyLogo: q.company.logoUrl,
        question: q.questionText,
        difficulty: q.difficulty,
        likeCount: q.likeCount,
      })),
    });
  } catch (err) {
    console.error('Get dashboard error:', err);
    res.status(500).json({ message: 'Failed to retrieve dashboard data.' });
  }
}

module.exports = { getDashboardData };
