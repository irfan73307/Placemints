const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanDuplicates() {
  console.log('🧹 Cleaning duplicate InterviewRounds and Questions in database...');

  const companies = await prisma.company.findMany({
    include: {
      rounds: { orderBy: { roundNumber: 'asc' } },
      questions: true,
    },
  });

  let totalRoundsDeleted = 0;
  let totalQuestionsDeleted = 0;

  for (const company of companies) {
    // 1. Deduplicate Interview Rounds
    const seenRounds = new Map(); // key -> roundId to keep
    const duplicateRoundIds = [];

    for (const round of company.rounds) {
      // Clean title prefix if any
      const baseTitle = round.title.replace(/^(Round\s*\d+\s*:\s*)+/i, '').trim().toLowerCase();
      const baseDesc = round.description.trim().toLowerCase();
      const key = `${baseTitle}|${baseDesc}`;

      if (seenRounds.has(key)) {
        duplicateRoundIds.push(round.id);
      } else {
        seenRounds.set(key, round.id);
      }
    }

    if (duplicateRoundIds.length > 0) {
      await prisma.interviewRound.deleteMany({
        where: { id: { in: duplicateRoundIds } },
      });
      totalRoundsDeleted += duplicateRoundIds.length;
      console.log(`Deleted ${duplicateRoundIds.length} duplicate rounds for ${company.name}`);
    }

    // Re-index remaining rounds nicely
    const remainingRounds = await prisma.interviewRound.findMany({
      where: { companyId: company.id },
      orderBy: { roundNumber: 'asc' },
    });

    for (let i = 0; i < remainingRounds.length; i++) {
      const r = remainingRounds[i];
      let cleanTitle = r.title.replace(/^(Round\s*\d+\s*:\s*)+/i, '').trim();
      const newTitle = `Round ${i + 1}: ${cleanTitle}`;
      await prisma.interviewRound.update({
        where: { id: r.id },
        data: {
          roundNumber: i + 1,
          title: newTitle,
        },
      });
    }

    // 2. Deduplicate Questions (PYQs)
    const seenQuestions = new Map();
    const duplicateQuestionIds = [];

    for (const q of company.questions) {
      const qKey = q.questionText.trim().toLowerCase();
      if (seenQuestions.has(qKey)) {
        duplicateQuestionIds.push(q.id);
      } else {
        seenQuestions.set(qKey, q.id);
      }
    }

    if (duplicateQuestionIds.length > 0) {
      await prisma.question.deleteMany({
        where: { id: { in: duplicateQuestionIds } },
      });
      totalQuestionsDeleted += duplicateQuestionIds.length;
      console.log(`Deleted ${duplicateQuestionIds.length} duplicate questions for ${company.name}`);
    }
  }

  console.log(`\n✅ Cleaning complete! Deleted ${totalRoundsDeleted} duplicate rounds & ${totalQuestionsDeleted} duplicate questions.`);
}

cleanDuplicates()
  .catch((e) => console.error('❌ Error cleaning database:', e))
  .finally(async () => {
    await prisma.$disconnect();
  });
