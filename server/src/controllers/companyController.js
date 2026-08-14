const prisma = require('../db');
const { getOrRefreshCompanyWikiData } = require('../apihandling/wikipediaService');

const TOP_RECRUITERS_PRIORITY = [
  'google',
  'microsoft',
  'amazon',
  'adobe',
  'atlassian',
  'oracle',
  'goldman-sachs',
  'morgan-stanley',
  'jpmorgan',
  'j-p-morgan',
  'visa',
  'paypal',
  'intel',
  'qualcomm',
  'nvidia',
];

// Helper star rating generator
function getStarRating(likeCount) {
  if (likeCount >= 90) return { stars: '★★★★★', label: 'Very Frequently Asked' };
  if (likeCount >= 75) return { stars: '★★★★', label: 'Frequently Asked' };
  if (likeCount >= 50) return { stars: '★★★', label: 'Moderately Asked' };
  if (likeCount >= 25) return { stars: '★★', label: 'Occasionally Asked' };
  return { stars: '★', label: 'Rarely Asked' };
}

// GET /api/companies?search=&tag=
async function getCompanies(req, res) {
  try {
    const { search, tag } = req.query;
    const userId = req.user ? req.user.id : null;

    let companies = await prisma.company.findMany({
      include: {
        savedBy: userId ? { where: { userId } } : false,
      },
    });

    if (search) {
      const q = search.toLowerCase();
      companies = companies.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.tags.toLowerCase().includes(q)
      );
    }

    if (tag) {
      companies = companies.filter((c) =>
        c.tags.split(',').some((t) => t.trim() === tag)
      );
    }

    // Sort: Top Recruiters first, followed by alphabetical order
    companies.sort((a, b) => {
      const aSlug = a.slug.toLowerCase();
      const bSlug = b.slug.toLowerCase();
      const aIndex = TOP_RECRUITERS_PRIORITY.findIndex((p) => aSlug.includes(p));
      const bIndex = TOP_RECRUITERS_PRIORITY.findIndex((p) => bSlug.includes(p));

      if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;

      return a.name.localeCompare(b.name);
    });

    const formattedCompanies = companies.map((c) => ({
      id: c.id,
      slug: c.slug,
      name: c.name,
      logo: c.customLogo || c.logo || c.logoUrl,
      logoUrl: c.customLogo || c.logo || c.logoUrl,
      customLogo: c.customLogo,
      ctc: c.ctc,
      tier: c.tier,
      description: c.description,
      tags: c.tags.split(',').map((t) => t.trim()),
      isSaved: c.savedBy ? c.savedBy.length > 0 : false,
    }));

    res.json({ data: formattedCompanies, total: formattedCompanies.length });
  } catch (err) {
    console.error('Get companies error:', err);
    res.status(500).json({ message: 'Error retrieving companies list.' });
  }
}

// GET /api/companies/:id
async function getCompanyById(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user ? req.user.id : null;

    const company = await prisma.company.findFirst({
      where: {
        OR: [{ id: id }, { slug: id }],
      },
      include: {
        rounds: { orderBy: { roundNumber: 'asc' } },
        questions: {
          include: { round: true },
          orderBy: { likeCount: 'desc' },
        },
        savedBy: userId ? { where: { userId } } : false,
      },
    });

    if (!company) {
      return res.status(404).json({ message: `Company with ID/slug "${id}" not found` });
    }

    const resources = await prisma.resource.findMany({
      where: {
        tags: { contains: company.name.split(' ')[0] },
      },
    });

    // Deduplicate questions by text
    const uniqueQuestionsMap = new Map();
    (company.questions || []).forEach((q) => {
      const qKey = (q.questionText || '').trim().toLowerCase();
      if (!uniqueQuestionsMap.has(qKey)) {
        uniqueQuestionsMap.set(qKey, q);
      }
    });
    const uniqueQuestions = Array.from(uniqueQuestionsMap.values());

    const allPyqs = uniqueQuestions.map((q, idx) => {
      // frequency field not yet in DB (pending migration) — fall back to likeCount or position estimate
      const frequencyVal = q.likeCount || (95 - (idx * 3));
      const starRating = getStarRating(frequencyVal);

      return {
        id: q.id,
        problemNumber: `#${101 + idx}`,
        question: q.questionText,
        difficulty: q.difficulty,
        topic: (q.topicTags || 'General').split(',')[0] || 'DSA',
        topicTags: (q.topicTags || 'General').split(',').map((t) => t.trim()),
        year: String(q.year),
        likeCount: q.likeCount,
        frequency: `${frequencyVal}%`,
        starRating: starRating.stars,
        importanceLabel: starRating.label,
        expectedRound: q.round?.title || 'Interview Round',
        isSastraPyq: true,
        // leetcodeUrl field not yet in DB — always null until migration runs
        leetcodeUrl: null,
        hasVerifiedLink: false,
      };
    });

    // Partition into SASTRA Previous Questions (first 6) and General LeetCode Problems
    const sastraQuestions = allPyqs.slice(0, 6);
    const generalQuestions = allPyqs.slice(6);

    // Deduplicate rounds cleanly
    const uniqueRoundsList = [];
    const seenRoundKeys = new Set();
    (company.rounds || []).forEach((r) => {
      let cleanTitle = r.title.replace(/^(Round\s*\d+\s*:\s*)+/i, '').trim();
      const key = cleanTitle.toLowerCase();
      if (!seenRoundKeys.has(key)) {
        seenRoundKeys.add(key);
        uniqueRoundsList.push({
          id: r.id,
          title: `Round ${uniqueRoundsList.length + 1}: ${cleanTitle}`,
          description: r.description,
        });
      }
    });

    // Retrieve placement facts from Wikipedia cache (30-day window / background refresh)
    const wikiData = await getOrRefreshCompanyWikiData(company);

    const formattedCompany = {
      id: company.id,
      slug: company.slug,
      name: company.name,
      logo: company.logoUrl,
      logoUrl: company.logoUrl,
      ctc: company.ctc,
      tier: company.tier,
      description: company.description,
      sector: company.sector || 'Technology & Engineering',
      tags: company.tags.split(',').map((t) => t.trim()),
      isSaved: company.savedBy ? company.savedBy.length > 0 : false,
      overview: `${company.name} is a premier campus recruiter at SASTRA University. ${company.description}`,
      hiringProcess: `The selection process typically spans 3-4 rounds, starting with an Online Coding & Aptitude Assessment (OA), followed by Technical DSA interviews, System Design (LLD/HLD), and HR assessment.`,
      eligibilityCriteria: `B.Tech / M.Tech students in CSE, IT, ECE, EEE with CGPA 7.5+ and no active backlogs.`,
      preparationTips: [
        'Focus on Core Data Structures: Arrays, HashMaps, Trees, Graphs, and Dynamic Programming.',
        'Review Object-Oriented Design (OOPs) concepts and Low-Level System Design patterns.',
        'Practice SQL queries using CTEs, JOINs, and window functions.',
      ],
      frequentlyAskedTopics: ['Dynamic Programming', 'Trees & Binary Search Trees', 'Graph Topological Sort', 'System Design (LLD)', 'SQL Queries'],
      rounds: uniqueRoundsList,
      sastraQuestions,
      generalQuestions,
      pyqs: allPyqs,
      wikiData: wikiData || company.wikiData || null,
      resources: resources.length > 0
        ? resources.map((res) => ({
            title: res.title,
            url: res.url,
            type: res.type,
          }))
        : [
            { title: `${company.name} Interview Preparation Guide`, url: 'https://geeksforgeeks.org', type: 'PDF Guide' },
            { title: `Top ${company.name} Coding Questions`, url: 'https://leetcode.com', type: 'Problem Set' },
          ],
    };

    res.json({ company: formattedCompany });
  } catch (err) {
    console.error('Get company detail error:', err);
    res.status(500).json({ message: 'Error retrieving company details.' });
  }
}

module.exports = { getCompanies, getCompanyById };
