const prisma = require('../db');

// GET /api/companies/:id/reviews
async function getCompanyReviews(req, res) {
  try {
    const { companyId } = req.params;

    const reviews = await prisma.review.findMany({
      where: { companyId },
      include: { user: { select: { id: true, name: true, avatarUrl: true, branch: true, batchYear: true } } },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ reviews });
  } catch (err) {
    console.error('Get reviews error:', err);
    res.status(500).json({ message: 'Failed to retrieve company reviews.' });
  }
}

// POST /api/companies/:id/reviews
async function postReview(req, res) {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Authentication required.' });
    }
    const { companyId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user.id;

    if (!rating || !comment) {
      return res.status(400).json({ message: 'Rating (1-5) and comment are required.' });
    }

    const review = await prisma.review.create({
      data: {
        companyId,
        userId,
        rating: parseInt(rating),
        comment,
      },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true, branch: true } },
      },
    });

    res.status(201).json({ review });
  } catch (err) {
    console.error('Post review error:', err);
    res.status(500).json({ message: 'Failed to post review.' });
  }
}

module.exports = { getCompanyReviews, postReview };
