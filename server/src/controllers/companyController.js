const prisma = require('../db');
const { getOrRefreshCompanyWikiData } = require('../apihandling/wikipediaService');
const { scrapeOfficialCompanyInfo } = require('../services/officialScraper');

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
  'tcs',
  'infosys',
  'zoho',
  'cognizant',
  'accenture',
  'prodapt',
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

    if (search && search.trim() !== '') {
      const q = search.toLowerCase().trim();
      const qTokens = q.split(/\s+/).filter(Boolean);

      companies = companies.filter((c) => {
        const name = (c.name || '').toLowerCase();
        const desc = (c.description || '').toLowerCase();
        const tags = (c.tags || '').toLowerCase();
        const sector = (c.sector || '').toLowerCase();
        const tier = (c.tier || '').toLowerCase();
        const slug = (c.slug || '').toLowerCase();
        const domain = (c.officialDomain || '').toLowerCase();
        const website = (c.website || '').toLowerCase();
        const services = (c.officialServices || '').toLowerCase();
        const technologies = (c.officialTechnologies || '').toLowerCase();

        // Acronym calculation (e.g. "Tata Consultancy Services" -> "tcs", "Cognizant Technology Solutions" -> "cts")
        const words = (c.name || '').split(/[\s&/.-]+/).filter(Boolean);
        const acronym = words.map((w) => w[0]).join('').toLowerCase();

        // Check if query is exact acronym or starts with domain
        if (q === acronym || domain.startsWith(q) || slug.startsWith(q)) return true;

        const searchable = `${name} ${slug} ${domain} ${website} ${desc} ${tags} ${sector} ${tier} ${services} ${technologies} ${acronym}`;
        return qTokens.every((tok) => searchable.includes(tok));
      });
    }

    if (tag && tag.trim() !== '' && tag !== 'All') {
      const targetTag = tag.toLowerCase().trim();
      companies = companies.filter((c) => {
        const rawTags = (c.tags || '').split(',').map((t) => t.trim().toLowerCase());
        const tier = (c.tier || '').toLowerCase();
        const sector = (c.sector || '').toLowerCase();
        const desc = (c.description || '').toLowerCase();

        if (targetTag === 'super dream') {
          return tier.includes('super dream') || rawTags.includes('super dream') || (c.ctc && (c.ctc.includes('15') || c.ctc.includes('20') || c.ctc.includes('25') || c.ctc.includes('30') || c.ctc.includes('40') || c.ctc.includes('50')));
        }
        if (targetTag === 'dream company' || targetTag === 'dream') {
          return tier.includes('dream') || rawTags.includes('dream') || rawTags.includes('dream company');
        }
        if (targetTag === 'product-based' || targetTag === 'product') {
          return rawTags.includes('product') || rawTags.includes('product-based') || tier.includes('product') || desc.includes('product');
        }
        if (targetTag === 'service-based' || targetTag === 'service') {
          return rawTags.includes('service') || rawTags.includes('service-based') || rawTags.includes('it services') || tier.includes('service');
        }
        if (targetTag === 'mass recruiter') {
          return rawTags.includes('mass recruiter') || rawTags.includes('mass') || tier.includes('mass');
        }

        return rawTags.includes(targetTag) || tier.includes(targetTag) || sector.includes(targetTag);
      });
    }

    // Sort: Top Recruiters first, followed by alphabetical order
    companies.sort((a, b) => {
      const aSlug = (a.slug || '').toLowerCase();
      const bSlug = (b.slug || '').toLowerCase();
      const aIndex = TOP_RECRUITERS_PRIORITY.findIndex((p) => aSlug.includes(p));
      const bIndex = TOP_RECRUITERS_PRIORITY.findIndex((p) => bSlug.includes(p));

      if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;

      return (a.name || '').localeCompare(b.name || '');
    });

    const formattedCompanies = companies.map((c) => {
      const resolvedLogo = c.customLogo || c.logo || c.logoUrl || null;
      return {
        id: c.id,
        slug: c.slug,
        name: c.name,
        logo: resolvedLogo,
        logoUrl: resolvedLogo,
        customLogo: c.customLogo || null,
        website: c.website || c.officialWebsite || null,
        officialWebsite: c.officialWebsite || null,
        officialDomain: c.officialDomain || null,
        ctc: c.ctc || 'Competitive',
        tier: c.tier || 'Tier 2',
        sector: c.sector || 'IT',
        industry: c.industry || c.sector || 'Technology',
        description: c.description || `${c.name} campus recruitment drive at SASTRA University.`,
        tags: (c.tags || '')
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        isSaved: c.savedBy ? c.savedBy.length > 0 : false,
      };
    });

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

    const companyFirstName = (company.name || '').split(' ')[0] || '';
    const resources = companyFirstName
      ? await prisma.resource.findMany({
          where: {
            tags: { contains: companyFirstName },
          },
        })
      : [];

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
      const frequencyVal = q.likeCount || Math.max(60, 95 - idx * 3);
      const starRating = getStarRating(frequencyVal);
      const rawTags = (q.topicTags || 'DSA')
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      return {
        id: q.id,
        problemNumber: `#${101 + idx}`,
        question: q.questionText,
        difficulty: q.difficulty || 'Medium',
        topic: rawTags[0] || 'DSA',
        topicTags: rawTags.length > 0 ? rawTags : ['DSA'],
        year: String(q.year || new Date().getFullYear()),
        likeCount: q.likeCount || 0,
        frequency: `${frequencyVal}%`,
        starRating: starRating.stars,
        importanceLabel: starRating.label,
        expectedRound: q.round?.title || 'Round 2: Technical Interview (DSA & Core CS)',
        isSastraPyq: true,
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
      let cleanTitle = (r.title || '').replace(/^(Round\s*\d+\s*:\s*)+/i, '').trim();
      const key = cleanTitle.toLowerCase();
      if (!seenRoundKeys.has(key)) {
        seenRoundKeys.add(key);
        uniqueRoundsList.push({
          id: r.id,
          roundNumber: uniqueRoundsList.length + 1,
          title: `Round ${uniqueRoundsList.length + 1}: ${cleanTitle}`,
          description: r.description || 'Evaluation round assessment.',
        });
      }
    });

    // -------------------------------------------------------------------------
    // 1. OFFICIAL GENERAL COMPANY INFORMATION (From Verified Official Website)
    // -------------------------------------------------------------------------
    let officialInfo = {
      officialWebsite: company.officialWebsite || company.website || null,
      officialDomain: company.officialDomain || null,
      officialDescription: company.officialDescription || null,
      industry: company.industry || company.sector || null,
      headquarters: company.headquarters || null,
      foundedYear: company.foundedYear || null,
      officialServices: company.officialServices ? company.officialServices.split(',').map((s) => s.trim()).filter(Boolean) : [],
      officialTechnologies: company.officialTechnologies ? company.officialTechnologies.split(',').map((t) => t.trim()).filter(Boolean) : [],
      officialSourceUrl: company.officialSourceUrl || company.officialWebsite || company.website || null,
      officialSourceType: company.officialSourceType || 'official_website',
      officialDataLastUpdated: company.officialDataLastUpdated || null,
      isOfficialVerified: Boolean(company.officialDomain && company.officialDescription),
    };

    // If official company metadata is not yet populated, trigger the official website scraper
    if (!officialInfo.isOfficialVerified && (company.website || company.name)) {
      try {
        const scraped = await scrapeOfficialCompanyInfo(company.name, company.website);
        if (scraped) {
          officialInfo = {
            officialWebsite: scraped.officialWebsite,
            officialDomain: scraped.officialDomain,
            officialDescription: scraped.officialDescription,
            industry: scraped.industry,
            headquarters: scraped.headquarters,
            foundedYear: scraped.foundedYear || null,
            officialServices: scraped.officialServices ? scraped.officialServices.split(',').map((s) => s.trim()).filter(Boolean) : [],
            officialTechnologies: scraped.officialTechnologies ? scraped.officialTechnologies.split(',').map((t) => t.trim()).filter(Boolean) : [],
            officialSourceUrl: scraped.officialSourceUrl,
            officialSourceType: scraped.officialSourceType,
            officialDataLastUpdated: scraped.officialDataLastUpdated,
            isOfficialVerified: true,
          };

          // Save to PostgreSQL asynchronously without blocking the request
          prisma.company
            .update({
              where: { id: company.id },
              data: {
                officialWebsite: scraped.officialWebsite,
                officialDomain: scraped.officialDomain,
                officialDescription: scraped.officialDescription,
                industry: scraped.industry,
                headquarters: scraped.headquarters,
                officialServices: scraped.officialServices,
                officialTechnologies: scraped.officialTechnologies,
                officialSourceUrl: scraped.officialSourceUrl,
                officialSourceType: scraped.officialSourceType,
                officialDataLastUpdated: scraped.officialDataLastUpdated,
              },
            })
            .catch((e) => console.warn(`[Official Scraper Write Error] ${company.name}:`, e.message));
        }
      } catch (e) {
        // Scraper failed, retain isOfficialVerified: false without substituting any third-party data
      }
    }

    // -------------------------------------------------------------------------
    // 2. SECONDARY FACTS (Verified Wikipedia if applicable, completely isolated)
    // -------------------------------------------------------------------------
    let wikiData = company.wikiData;
    if (!wikiData) {
      wikiData = await getOrRefreshCompanyWikiData(company);
    }

    const resolvedLogo = company.customLogo || company.logo || company.logoUrl || null;

    // -------------------------------------------------------------------------
    // 3. COMPLETE RESPONSE WITH CLEAR DATA SOURCE SEPARATION
    // -------------------------------------------------------------------------
    const formattedCompany = {
      // Identity
      id: company.id,
      slug: company.slug,
      name: company.name,
      logo: resolvedLogo,
      logoUrl: resolvedLogo,
      customLogo: company.customLogo || null,
      website: company.website || officialInfo.officialWebsite || null,

      // Source A: Official General Information (From Official Website)
      officialInfo,

      // Source B: SASTRA Placement Information (Protected Placemints Data)
      placementData: {
        tier: company.tier || 'Tier 2',
        ctc: company.ctc || 'Competitive',
        avgCtc: company.avgCtc || 0,
        sector: company.sector || 'Technology & Engineering',
        tags: (company.tags || '')
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        description: company.description || `${company.name} campus recruitment drive at SASTRA University.`,
        overview: `${company.name} is a premier campus recruiter at SASTRA University. ${company.description || ''}`,
        hiringProcess: `The selection process typically spans ${uniqueRoundsList.length > 0 ? uniqueRoundsList.length : '3-4'} rounds, starting with an Online Coding & Aptitude Assessment (OA), followed by Technical DSA interviews, System Design (LLD/HLD), and HR assessment.`,
        eligibilityCriteria: `B.Tech / M.Tech students in CSE, IT, ECE, EEE with CGPA 7.5+ and no active backlogs.`,
        preparationTips: [
          'Focus on Core Data Structures: Arrays, HashMaps, Trees, Graphs, and Dynamic Programming.',
          'Review Object-Oriented Design (OOPs) concepts and Low-Level System Design patterns.',
          'Practice SQL queries using CTEs, JOINs, and window functions.',
        ],
        frequentlyAskedTopics: [
          'Dynamic Programming',
          'Trees & Binary Search Trees',
          'Graph Topological Sort',
          'System Design (LLD)',
          'SQL Queries',
        ],
        roundsCount: uniqueRoundsList.length,
        questionsCount: allPyqs.length,
      },

      // Flat compatibility fields for existing UI components
      tier: company.tier || 'Tier 2',
      ctc: company.ctc || 'Competitive',
      sector: company.sector || 'Technology & Engineering',
      description: company.description || `${company.name} recruitment profile and selection archives at SASTRA University.`,
      tags: (company.tags || '')
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      isSaved: company.savedBy ? company.savedBy.length > 0 : false,
      overview: `${company.name} is a premier campus recruiter at SASTRA University. ${company.description || ''}`,
      hiringProcess: `The selection process typically spans ${uniqueRoundsList.length > 0 ? uniqueRoundsList.length : '3-4'} rounds, starting with an Online Coding & Aptitude Assessment (OA), followed by Technical DSA interviews, System Design (LLD/HLD), and HR assessment.`,
      eligibilityCriteria: `B.Tech / M.Tech students in CSE, IT, ECE, EEE with CGPA 7.5+ and no active backlogs.`,
      preparationTips: [
        'Focus on Core Data Structures: Arrays, HashMaps, Trees, Graphs, and Dynamic Programming.',
        'Review Object-Oriented Design (OOPs) concepts and Low-Level System Design patterns.',
        'Practice SQL queries using CTEs, JOINs, and window functions.',
      ],
      frequentlyAskedTopics: [
        'Dynamic Programming',
        'Trees & Binary Search Trees',
        'Graph Topological Sort',
        'System Design (LLD)',
        'SQL Queries',
      ],
      rounds: uniqueRoundsList,
      sastraQuestions,
      generalQuestions,
      pyqs: allPyqs,
      wikiData: wikiData || null,
      resources: resources.length > 0
        ? resources.map((res) => ({
            title: res.title,
            url: res.url,
            type: res.type || 'PDF Guide',
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


