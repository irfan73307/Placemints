const prisma = require('../db');

// POST /api/questions/:id/like
async function toggleLike(req, res) {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Authentication required.' });
    }
    const questionId = req.params.id;
    const userId = req.user.id;

    const existingLike = await prisma.questionLike.findUnique({
      where: {
        userId_questionId: {
          userId,
          questionId,
        },
      },
    });

    let liked = false;
    let newLikeCount = 0;

    if (existingLike) {
      // Unlike
      await prisma.questionLike.delete({
        where: {
          userId_questionId: { userId, questionId },
        },
      });
      const q = await prisma.question.update({
        where: { id: questionId },
        data: { likeCount: { decrement: 1 } },
      });
      liked = false;
      newLikeCount = Math.max(0, q.likeCount);
    } else {
      // Like
      await prisma.questionLike.create({
        data: { userId, questionId },
      });
      const q = await prisma.question.update({
        where: { id: questionId },
        data: { likeCount: { increment: 1 } },
      });
      liked = true;
      newLikeCount = q.likeCount;
    }

    res.json({ liked, likeCount: newLikeCount });
  } catch (err) {
    console.error('Toggle like error:', err);
    res.status(500).json({ message: 'Failed to update question like status.' });
  }
}

// POST /api/questions
async function createQuestion(req, res) {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Authentication required.' });
    }
    const { companyId, questionText, difficulty, topicTags, year } = req.body;
    const userId = req.user.id;

    if (!companyId || !questionText) {
      return res.status(400).json({ message: 'Company ID and question text are required.' });
    }

    const question = await prisma.question.create({
      data: {
        companyId,
        questionText,
        difficulty: difficulty || 'Medium',
        topicTags: Array.isArray(topicTags) ? topicTags.join(',') : topicTags || 'DSA',
        year: year ? parseInt(year) : 2024,
        contributedBy: userId,
      },
    });

    res.status(201).json({ question });
  } catch (err) {
    console.error('Create question error:', err);
    res.status(500).json({ message: 'Failed to submit PYQ.' });
  }
}

module.exports = { toggleLike, createQuestion };
