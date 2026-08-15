/**
 * Admin Company Management Controller
 * 
 * Strict RBAC protected operations for authorized Administrators:
 * - List all database companies with question/round counts and audit timestamps.
 * - View detailed company management profile.
 * - Create new company with website validation.
 * - Edit / Update company metadata, placement criteria, rounds, and questions.
 * - Safe cascading delete with confirmation and audit history.
 * - Test official website reachability and trigger official scraper.
 */

const prisma = require('../db');
const {
  scrapeOfficialCompanyInfo,
  resolveCanonicalDomain,
  verifyWebsiteReachability,
} = require('../services/officialScraper');
const https = require('https');
const http = require('http');
const { URL } = require('url');

// Helper to log admin actions for auditing
async function logAdminActivity(userId, action, metadata) {
  try {
    if (!userId) return;
    await prisma.activityHistory.create({
      data: {
        userId,
        action,
        metadata: typeof metadata === 'string' ? metadata : JSON.stringify(metadata),
      },
    });
  } catch (err) {
    console.warn('[Admin Audit Log Error]:', err.message);
  }
}

// GET /api/admin/companies
async function getAdminCompanies(req, res) {
  try {
    const { search, tier, status, sort = 'name' } = req.query;

    const companies = await prisma.company.findMany({
      include: {
        _count: {
          select: {
            questions: true,
            rounds: true,
            savedBy: true,
            interviewExperiences: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    let mapped = companies.map((c) => {
      const isVerifiedOfficial = Boolean(c.officialDomain && c.officialDescription && c.officialSourceType === 'official_website');
      const isManuallyVerified = Boolean(c.manuallyVerified || c.officialSourceType === 'verified_manual');

      let verificationStatus = 'Pending Verification';
      if (isManuallyVerified) {
        verificationStatus = 'Manually Verified';
      } else if (isVerifiedOfficial) {
        verificationStatus = 'Verified Official';
      }

      const resolvedLogo = c.customLogo || c.logo || c.logoUrl || `https://icon.horse/icon/${c.officialDomain || 'google.com'}`;

      return {
        id: c.id,
        slug: c.slug,
        name: c.name,
        logo: resolvedLogo,
        customLogo: c.customLogo || null,
        website: c.website || c.officialWebsite || null,
        officialWebsite: c.officialWebsite || null,
        officialDomain: c.officialDomain || null,
        industry: c.industry || c.sector || 'Technology',
        tier: c.tier || 'Tier 2',
        ctc: c.ctc || 'Competitive',
        sector: c.sector || 'IT',
        eligibilityCriteria: c.eligibilityCriteria || 'CGPA 7.5+, No Backlogs',
        questionsCount: c._count.questions,
        roundsCount: c._count.rounds,
        savedCount: c._count.savedBy,
        experiencesCount: c._count.interviewExperiences,
        verificationStatus,
        manuallyVerified: c.manuallyVerified,
        officialSourceType: c.officialSourceType || 'official_website',
        officialDataLastUpdated: c.officialDataLastUpdated,
        updatedBy: c.updatedBy || 'System',
        updatedAt: c.updatedAt || c.createdAt,
        createdAt: c.createdAt,
      };
    });

    // Search filter
    if (search && search.trim() !== '') {
      const q = search.toLowerCase().trim();
      mapped = mapped.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.slug && c.slug.toLowerCase().includes(q)) ||
          (c.officialDomain && c.officialDomain.toLowerCase().includes(q)) ||
          (c.industry && c.industry.toLowerCase().includes(q)) ||
          (c.tier && c.tier.toLowerCase().includes(q))
      );
    }

    // Tier filter
    if (tier && tier !== 'All') {
      const t = tier.toLowerCase();
      mapped = mapped.filter((c) => (c.tier || '').toLowerCase().includes(t));
    }

    // Status filter
    if (status && status !== 'All') {
      mapped = mapped.filter((c) => c.verificationStatus === status);
    }

    // Sorting
    if (sort === 'questions') {
      mapped.sort((a, b) => b.questionsCount - a.questionsCount);
    } else if (sort === 'updated') {
      mapped.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    } else if (sort === 'ctc') {
      mapped.sort((a, b) => (b.ctc || '').localeCompare(a.ctc || ''));
    } else {
      mapped.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }

    res.json({
      companies: mapped,
      total: mapped.length,
      metrics: {
        totalCompanies: companies.length,
        totalQuestions: companies.reduce((sum, c) => sum + c._count.questions, 0),
        totalRounds: companies.reduce((sum, c) => sum + c._count.rounds, 0),
        officialVerifiedCount: mapped.filter((c) => c.verificationStatus === 'Verified Official' || c.verificationStatus === 'Manually Verified').length,
      },
    });
  } catch (err) {
    console.error('[Admin getAdminCompanies Error]:', err);
    res.status(500).json({ message: 'Failed to retrieve companies for admin management.' });
  }
}

// GET /api/admin/companies/:id
async function getAdminCompanyById(req, res) {
  try {
    const { id } = req.params;

    const company = await prisma.company.findFirst({
      where: {
        OR: [{ id: id }, { slug: id }],
      },
      include: {
        rounds: { orderBy: { roundNumber: 'asc' } },
        questions: {
          include: { round: true },
          orderBy: { createdAt: 'desc' },
        },
        interviewExperiences: true,
      },
    });

    if (!company) {
      return res.status(404).json({ message: `Company with ID/slug "${id}" not found.` });
    }

    const resolvedLogo = company.customLogo || company.logo || company.logoUrl || null;

    res.json({
      company: {
        id: company.id,
        slug: company.slug,
        name: company.name,
        logo: resolvedLogo,
        customLogo: company.customLogo || null,
        website: company.website || company.officialWebsite || '',
        officialWebsite: company.officialWebsite || '',
        officialDomain: company.officialDomain || '',
        officialDescription: company.officialDescription || company.description || '',
        industry: company.industry || company.sector || 'Technology & Engineering',
        headquarters: company.headquarters || 'Chennai / Global Operations',
        foundedYear: company.foundedYear || '',
        officialServices: company.officialServices || '',
        officialTechnologies: company.officialTechnologies || '',
        officialSourceUrl: company.officialSourceUrl || company.officialWebsite || '',
        officialSourceType: company.officialSourceType || 'official_website',
        officialDataLastUpdated: company.officialDataLastUpdated,
        manuallyVerified: company.manuallyVerified,
        updatedBy: company.updatedBy || 'System',
        updatedAt: company.updatedAt,
        createdAt: company.createdAt,

        // Placement Specific Info
        tier: company.tier || 'Tier 2',
        ctc: company.ctc || 'Competitive',
        avgCtc: company.avgCtc || 0,
        sector: company.sector || 'IT',
        tags: company.tags || 'IT Services',
        description: company.description || '',
        eligibilityCriteria: company.eligibilityCriteria || 'B.Tech / M.Tech (CSE, IT, ECE, EEE) with CGPA 7.5+ and no active backlogs.',
        selectionProcess: company.selectionProcess || 'Online Assessment (OA) -> Technical DSA Round -> System Design (LLD/HLD) -> HR Interview',
        placementNotes: company.placementNotes || '',

        // Associated Records
        rounds: company.rounds,
        questions: company.questions,
        interviewExperiences: company.interviewExperiences,
      },
    });
  } catch (err) {
    console.error('[Admin getAdminCompanyById Error]:', err);
    res.status(500).json({ message: 'Failed to retrieve company details.' });
  }
}

// GET /api/admin/companies/check-exists
async function checkCompanyExists(req, res) {
  try {
    const { name, domain } = req.query;
    if (!name && !domain) {
      return res.json({ exists: false });
    }

    const cleanName = (name || '').trim().toLowerCase();
    const baseSlug = cleanName.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    const existing = await prisma.company.findFirst({
      where: {
        OR: [
          cleanName ? { name: { equals: (name || '').trim(), mode: 'insensitive' } } : null,
          baseSlug ? { slug: baseSlug } : null,
          domain ? { officialDomain: (domain || '').toLowerCase().trim() } : null,
        ].filter(Boolean),
      },
    });

    if (existing) {
      return res.json({
        exists: true,
        company: {
          id: existing.id,
          slug: existing.slug,
          name: existing.name,
          officialDomain: existing.officialDomain,
          ctc: existing.ctc,
          tier: existing.tier,
        },
      });
    }

    return res.json({ exists: false });
  } catch (err) {
    res.status(500).json({ message: 'Error checking company existence.' });
  }
}

// POST /api/admin/companies
async function createAdminCompany(req, res) {
  try {
    const adminUser = req.user;
    const {
      name,
      website,
      tier = 'Tier 2',
      ctc = 'Competitive',
      sector = 'IT',
      tags = 'IT Services',
      description = '',
      eligibilityCriteria = 'B.Tech / M.Tech with CGPA 7.5+',
      selectionProcess = 'OA -> Technical Interview -> HR',
      placementNotes = '',
      autoScrape = false,
      initialQuestions = [],
    } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ message: 'Company name is required.' });
    }

    // Enforce mandatory Official Website
    if (!website || website.trim() === '') {
      return res.status(400).json({ message: 'Official Website URL is required for every company in Placemints.' });
    }

    const { domain, fullUrl } = resolveCanonicalDomain(name, website);
    const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    // Check for existing company (Duplicate Prevention)
    const existing = await prisma.company.findFirst({
      where: {
        OR: [
          { name: { equals: name.trim(), mode: 'insensitive' } },
          { slug: baseSlug },
          domain ? { officialDomain: domain } : null,
        ].filter(Boolean),
      },
    });

    if (existing) {
      return res.status(409).json({
        message: `"${existing.name}" already exists in Placemints.`,
        alreadyExists: true,
        existingCompany: {
          id: existing.id,
          slug: existing.slug,
          name: existing.name,
          officialDomain: existing.officialDomain,
          ctc: existing.ctc,
          tier: existing.tier,
        },
      });
    }

    // Generate slug
    let slug = baseSlug;
    let count = 1;
    while (await prisma.company.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${count++}`;
    }

    let officialData = null;
    if (autoScrape && (fullUrl || website)) {
      officialData = await scrapeOfficialCompanyInfo(name, fullUrl || website);
    }

    const newCompany = await prisma.company.create({
      data: {
        slug,
        name: name.trim(),
        website: fullUrl || website,
        officialWebsite: officialData?.officialWebsite || fullUrl || website,
        officialDomain: officialData?.officialDomain || domain || null,
        officialDescription: officialData?.officialDescription || description || `${name} recruitment profile at SASTRA University.`,
        industry: officialData?.industry || sector || 'Technology & Engineering',
        headquarters: officialData?.headquarters || 'India / Global',
        officialServices: officialData?.officialServices || '',
        officialTechnologies: officialData?.officialTechnologies || '',
        officialSourceUrl: officialData?.officialSourceUrl || fullUrl || website,
        officialSourceType: officialData ? 'official_website' : 'verified_manual',
        officialDataLastUpdated: officialData ? new Date() : null,
        manuallyVerified: !officialData,
        tier,
        ctc,
        sector,
        tags: typeof tags === 'string' ? tags : (Array.isArray(tags) ? tags.join(', ') : 'IT Services'),
        description: description || `${name} recruitment drive at SASTRA University.`,
        eligibilityCriteria,
        selectionProcess,
        placementNotes,
        updatedBy: adminUser.email,
        logo: domain ? `https://icon.horse/icon/${domain}` : null,
      },
    });

    // Create initial questions if provided
    if (Array.isArray(initialQuestions) && initialQuestions.length > 0) {
      for (const q of initialQuestions) {
        if (q.questionText && q.questionText.trim()) {
          await prisma.question.create({
            data: {
              companyId: newCompany.id,
              questionText: q.questionText.trim(),
              topicTags: q.topicTags || 'DSA',
              difficulty: q.difficulty || 'Medium',
              year: q.year || new Date().getFullYear(),
              contributedBy: adminUser.id,
            },
          });
        }
      }
    }

    await logAdminActivity(adminUser.id, 'ADMIN_CREATE_COMPANY', {
      companyId: newCompany.id,
      companyName: newCompany.name,
      slug: newCompany.slug,
    });

    res.status(201).json({
      message: `Company "${newCompany.name}" created successfully.`,
      company: newCompany,
    });
  } catch (err) {
    console.error('[Admin createAdminCompany Error]:', err);
    res.status(500).json({ message: 'Failed to create new company record.' });
  }
}

// PUT /api/admin/companies/:id
async function updateAdminCompany(req, res) {
  try {
    const { id } = req.params;
    const adminUser = req.user;
    const {
      name,
      website,
      officialWebsite,
      officialDomain,
      officialDescription,
      industry,
      headquarters,
      foundedYear,
      officialServices,
      officialTechnologies,
      customLogo,
      logo,
      tier,
      ctc,
      avgCtc,
      sector,
      tags,
      description,
      eligibilityCriteria,
      selectionProcess,
      placementNotes,
      questions,
      rounds,
    } = req.body;

    const existing = await prisma.company.findFirst({
      where: { OR: [{ id }, { slug: id }] },
    });

    if (!existing) {
      return res.status(404).json({ message: `Company with ID/slug "${id}" not found.` });
    }

    // Process canonical domain
    let resolvedDomain = officialDomain;
    if (!resolvedDomain && (officialWebsite || website)) {
      const resolved = resolveCanonicalDomain(name || existing.name, officialWebsite || website);
      resolvedDomain = resolved.domain;
    }

    const updated = await prisma.company.update({
      where: { id: existing.id },
      data: {
        name: name ? name.trim() : existing.name,
        website: website !== undefined ? website : existing.website,
        officialWebsite: officialWebsite !== undefined ? officialWebsite : existing.officialWebsite,
        officialDomain: resolvedDomain !== undefined ? resolvedDomain : existing.officialDomain,
        officialDescription: officialDescription !== undefined ? officialDescription : existing.officialDescription,
        industry: industry !== undefined ? industry : existing.industry,
        headquarters: headquarters !== undefined ? headquarters : existing.headquarters,
        foundedYear: foundedYear !== undefined ? foundedYear : existing.foundedYear,
        officialServices: officialServices !== undefined ? (Array.isArray(officialServices) ? officialServices.join(', ') : officialServices) : existing.officialServices,
        officialTechnologies: officialTechnologies !== undefined ? (Array.isArray(officialTechnologies) ? officialTechnologies.join(', ') : officialTechnologies) : existing.officialTechnologies,
        customLogo: customLogo !== undefined ? customLogo : existing.customLogo,
        logo: logo !== undefined ? logo : existing.logo,
        tier: tier !== undefined ? tier : existing.tier,
        ctc: ctc !== undefined ? ctc : existing.ctc,
        avgCtc: avgCtc !== undefined ? parseFloat(avgCtc) || 0 : existing.avgCtc,
        sector: sector !== undefined ? sector : existing.sector,
        tags: tags !== undefined ? (Array.isArray(tags) ? tags.join(', ') : tags) : existing.tags,
        description: description !== undefined ? description : existing.description,
        eligibilityCriteria: eligibilityCriteria !== undefined ? eligibilityCriteria : existing.eligibilityCriteria,
        selectionProcess: selectionProcess !== undefined ? selectionProcess : existing.selectionProcess,
        placementNotes: placementNotes !== undefined ? placementNotes : existing.placementNotes,
        manuallyVerified: true,
        officialSourceType: 'verified_manual',
        updatedBy: adminUser.email,
        updatedAt: new Date(),
      },
    });

    // Handle questions updates/creations if questions array passed
    if (Array.isArray(questions)) {
      for (const q of questions) {
        if (q.id && !q.isNew) {
          // Update existing question
          await prisma.question.update({
            where: { id: q.id },
            data: {
              questionText: q.questionText || q.question,
              topicTags: Array.isArray(q.topicTags) ? q.topicTags.join(', ') : (q.topicTags || q.topic || 'DSA'),
              difficulty: q.difficulty || 'Medium',
              year: parseInt(q.year) || new Date().getFullYear(),
              likeCount: q.likeCount !== undefined ? parseInt(q.likeCount) : 0,
            },
          }).catch(e => console.warn('[Question Update Error]:', e.message));
        } else if (q.isNew && (q.questionText || q.question)) {
          // Create newly added question
          await prisma.question.create({
            data: {
              companyId: existing.id,
              questionText: (q.questionText || q.question).trim(),
              topicTags: Array.isArray(q.topicTags) ? q.topicTags.join(', ') : (q.topicTags || q.topic || 'DSA'),
              difficulty: q.difficulty || 'Medium',
              year: parseInt(q.year) || new Date().getFullYear(),
              contributedBy: adminUser.id,
            },
          }).catch(e => console.warn('[Question Create Error]:', e.message));
        }
      }
    }

    // Handle rounds updates/creations if rounds array passed
    if (Array.isArray(rounds)) {
      for (const r of rounds) {
        if (r.id && !r.isNew) {
          await prisma.interviewRound.update({
            where: { id: r.id },
            data: {
              roundNumber: parseInt(r.roundNumber) || 1,
              title: r.title,
              description: r.description || '',
            },
          }).catch(e => console.warn('[Round Update Error]:', e.message));
        } else if (r.isNew && r.title) {
          await prisma.interviewRound.create({
            data: {
              companyId: existing.id,
              roundNumber: parseInt(r.roundNumber) || 1,
              title: r.title.trim(),
              description: r.description || '',
            },
          }).catch(e => console.warn('[Round Create Error]:', e.message));
        }
      }
    }

    await logAdminActivity(adminUser.id, 'ADMIN_UPDATE_COMPANY', {
      companyId: existing.id,
      companyName: existing.name,
      updatedFields: Object.keys(req.body),
    });

    res.json({
      message: `Company "${updated.name}" updated successfully.`,
      company: updated,
    });
  } catch (err) {
    console.error('[Admin updateAdminCompany Error]:', err);
    res.status(500).json({ message: 'Failed to update company record.' });
  }
}

// DELETE /api/admin/companies/:id
async function deleteAdminCompany(req, res) {
  try {
    const { id } = req.params;
    const adminUser = req.user;

    const company = await prisma.company.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      include: {
        _count: {
          select: {
            questions: true,
            rounds: true,
            savedBy: true,
          },
        },
      },
    });

    if (!company) {
      return res.status(404).json({ message: `Company with ID/slug "${id}" not found.` });
    }

    const companyName = company.name;
    const companyId = company.id;

    // Prisma cascading delete cleanly removes Question, InterviewRound, SavedCompany, Review, PlacementStat, Experience
    await prisma.company.delete({
      where: { id: companyId },
    });

    await logAdminActivity(adminUser.id, 'ADMIN_DELETE_COMPANY', {
      companyId,
      companyName,
      questionsDeleted: company._count.questions,
      roundsDeleted: company._count.rounds,
    });

    res.json({
      message: `Company "${companyName}" and all associated placement records have been permanently deleted.`,
      deletedId: companyId,
    });
  } catch (err) {
    console.error('[Admin deleteAdminCompany Error]:', err);
    res.status(500).json({ message: 'Failed to delete company from database.' });
  }
}

// POST /api/admin/companies/:id/verify-website
async function verifyCompanyWebsite(req, res) {
  try {
    const { id } = req.params;
    const company = await prisma.company.findFirst({
      where: { OR: [{ id }, { slug: id }] },
    });

    if (!company) {
      return res.status(404).json({ message: 'Company not found.' });
    }

    const rawWebsite = req.body.website || company.officialWebsite || company.website;
    if (!rawWebsite) {
      return res.status(400).json({ message: 'No website URL configured for this company.' });
    }

    const { domain, fullUrl } = resolveCanonicalDomain(company.name, rawWebsite);
    if (!domain || !fullUrl) {
      return res.status(400).json({ message: 'Invalid URL format.' });
    }

    // Ping URL
    const pingResult = await new Promise((resolve) => {
      try {
        const parsed = new URL(fullUrl);
        const client = parsed.protocol === 'http:' ? http : https;
        const pingReq = client.get(
          parsed,
          { headers: { 'User-Agent': 'Placemints-Validator/1.0' }, timeout: 6000 },
          (pingRes) => {
            resolve({
              reachable: pingRes.statusCode >= 200 && pingRes.statusCode < 400,
              statusCode: pingRes.statusCode,
              domain,
              fullUrl,
            });
          }
        );
        pingReq.on('error', (e) => resolve({ reachable: false, error: e.message, domain, fullUrl }));
        pingReq.on('timeout', () => {
          pingReq.destroy();
          resolve({ reachable: false, error: 'Timed out', domain, fullUrl });
        });
      } catch (e) {
        resolve({ reachable: false, error: e.message, domain, fullUrl });
      }
    });

    if (pingResult.reachable) {
      // Auto-update officialDomain if empty
      if (!company.officialDomain) {
        await prisma.company.update({
          where: { id: company.id },
          data: { officialDomain: domain, officialWebsite: fullUrl },
        });
      }

      return res.json({
        verified: true,
        message: `Official website is online and responded with HTTP ${pingResult.statusCode}.`,
        domain,
        url: fullUrl,
      });
    } else {
      return res.status(422).json({
        verified: false,
        message: `Website unreachable: ${pingResult.error || `HTTP ${pingResult.statusCode}`}`,
        domain,
        url: fullUrl,
      });
    }
  } catch (err) {
    console.error('[Admin verifyCompanyWebsite Error]:', err);
    res.status(500).json({ message: 'Failed to verify company website.' });
  }
}

// POST /api/admin/companies/:id/scrape-official
async function scrapeCompanyOfficial(req, res) {
  try {
    const { id } = req.params;
    const adminUser = req.user;

    const company = await prisma.company.findFirst({
      where: { OR: [{ id }, { slug: id }] },
    });

    if (!company) {
      return res.status(404).json({ message: 'Company not found.' });
    }

    const websiteToScrape = req.body.website || company.officialWebsite || company.website;
    if (!websiteToScrape) {
      return res.status(400).json({ message: 'Official website is not available. Web scraping cannot be performed.' });
    }

    const scraped = await scrapeOfficialCompanyInfo(company.name, websiteToScrape);

    if (!scraped) {
      return res.status(422).json({
        message: 'Official website could not be verified or reached. Existing company information has been preserved.',
        company,
      });
    }

    const updated = await prisma.company.update({
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
        officialSourceType: 'OFFICIAL_WEBSITE',
        officialDataLastUpdated: new Date(),
        updatedBy: adminUser.email,
      },
    });

    await logAdminActivity(adminUser.id, 'ADMIN_SCRAPE_COMPANY', {
      companyId: company.id,
      companyName: company.name,
      domain: scraped.officialDomain,
    });

    res.json({
      message: `Official company information successfully scraped and verified from ${scraped.officialDomain}.`,
      officialInfo: scraped,
      company: updated,
    });
  } catch (err) {
    console.error('[Admin scrapeCompanyOfficial Error]:', err);
    res.status(500).json({ message: 'Scraping failed. Existing database data preserved.' });
  }
}

// POST /api/admin/companies/:id/preview-official-refresh
async function previewOfficialRefresh(req, res) {
  try {
    const { id } = req.params;
    const { website } = req.body;

    const company = await prisma.company.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      include: {
        _count: { select: { questions: true, rounds: true } },
      },
    });

    if (!company) {
      return res.status(404).json({ message: 'Company not found.' });
    }

    const targetWebsite = website || company.officialWebsite || company.website;
    if (!targetWebsite || targetWebsite.trim() === '') {
      return res.status(400).json({ message: 'Official website URL is required.' });
    }

    const { domain, fullUrl } = resolveCanonicalDomain(company.name, targetWebsite);
    if (!domain || !fullUrl) {
      return res.status(400).json({ message: 'Invalid official website URL.' });
    }

    // Ping check
    const ping = await verifyWebsiteReachability(fullUrl);
    if (!ping.reachable) {
      return res.status(422).json({
        message: 'Official website could not be verified or reached. Existing company information has been preserved.',
        reachable: false,
        error: ping.error,
      });
    }

    // Scrape only from the verified official domain
    const scraped = await scrapeOfficialCompanyInfo(company.name, fullUrl);
    if (!scraped) {
      return res.status(422).json({
        message: 'Official website could not be verified. Existing company information has been preserved.',
      });
    }

    // Build side-by-side comparison payload
    res.json({
      success: true,
      current: {
        name: company.name,
        website: company.website || company.officialWebsite || 'None',
        domain: company.officialDomain || 'None',
        description: company.officialDescription || company.description || 'None',
        industry: company.industry || company.sector || 'Technology & Engineering',
        headquarters: company.headquarters || 'Chennai / Global',
        services: company.officialServices || 'None',
        technologies: company.officialTechnologies || 'None',
      },
      official: {
        name: scraped.name || company.name,
        website: scraped.officialWebsite || fullUrl,
        domain: scraped.officialDomain || domain,
        description: scraped.officialDescription || company.description,
        industry: scraped.industry || company.sector || 'Technology & Engineering',
        headquarters: scraped.headquarters || company.headquarters || 'India / Global',
        services: scraped.officialServices || '',
        technologies: scraped.officialTechnologies || '',
        sourceUrl: scraped.officialSourceUrl || fullUrl,
        logo: domain ? `https://icon.horse/icon/${domain}` : null,
      },
      placementPreserved: {
        ctc: company.ctc || 'Competitive',
        tier: company.tier || 'Tier 2',
        eligibilityCriteria: company.eligibilityCriteria || 'Standard Criteria',
        selectionProcess: company.selectionProcess || 'Standard Process',
        placementNotes: company.placementNotes || 'None',
        questionsCount: company._count?.questions || 0,
        roundsCount: company._count?.rounds || 0,
      },
    });
  } catch (err) {
    console.error('[Admin previewOfficialRefresh Error]:', err);
    res.status(500).json({
      message: 'Official website could not be verified. Existing company information has been preserved.',
    });
  }
}

// POST /api/admin/companies/:id/apply-official-refresh
async function applyOfficialRefresh(req, res) {
  try {
    const { id } = req.params;
    const { website, selectedData } = req.body;
    const adminUser = req.user;

    const company = await prisma.company.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      include: {
        _count: { select: { questions: true, rounds: true } },
      },
    });

    if (!company) {
      return res.status(404).json({ message: 'Company not found.' });
    }

    const targetWebsite = website || company.officialWebsite || company.website;
    const { domain, fullUrl } = resolveCanonicalDomain(company.name, targetWebsite);

    // If pre-scraped data provided by Admin confirmation, use it; otherwise re-scrape verified domain
    let officialData = selectedData;
    if (!officialData) {
      officialData = await scrapeOfficialCompanyInfo(company.name, fullUrl);
    }

    if (!officialData) {
      return res.status(422).json({
        message: 'Official website could not be verified. Existing company information has been preserved.',
      });
    }

    // Apply strictly to GENERAL COMPANY INFORMATION, preserving all placement data intact!
    const updated = await prisma.company.update({
      where: { id: company.id },
      data: {
        officialWebsite: officialData.website || officialData.officialWebsite || fullUrl,
        officialDomain: officialData.domain || officialData.officialDomain || domain,
        website: officialData.website || officialData.officialWebsite || fullUrl,
        officialDescription: officialData.description || officialData.officialDescription || company.officialDescription,
        description: officialData.description || officialData.officialDescription || company.description,
        industry: officialData.industry || company.industry,
        headquarters: officialData.headquarters || company.headquarters,
        officialServices: officialData.services || officialData.officialServices || company.officialServices,
        officialTechnologies: officialData.technologies || officialData.officialTechnologies || company.officialTechnologies,
        officialSourceUrl: officialData.sourceUrl || officialData.officialSourceUrl || fullUrl,
        officialSourceType: 'OFFICIAL_WEBSITE',
        officialDataLastUpdated: new Date(),
        manuallyVerified: false,
        updatedBy: adminUser.email,
      },
    });

    await logAdminActivity(adminUser.id, 'ADMIN_REVERIFY_OFFICIAL_WEBSITE', {
      companyId: company.id,
      companyName: company.name,
      domain: officialData.domain || domain,
      preservedQuestions: company._count?.questions || 0,
    });

    res.json({
      message: `Official company information from ${domain} successfully verified and updated. All ${company._count?.questions || 0} placement questions and placement criteria were preserved intact.`,
      company: updated,
    });
  } catch (err) {
    console.error('[Admin applyOfficialRefresh Error]:', err);
    res.status(500).json({
      message: 'Official website could not be verified. Existing company information has been preserved.',
    });
  }
}

// POST /api/admin/companies/verify-url (Standalone URL checker for creation form)
async function verifyUrlStandalone(req, res) {
  try {
    const { url, name } = req.body;
    if (!url || url.trim() === '') {
      return res.status(400).json({ message: 'URL is required.' });
    }

    const { domain, fullUrl } = resolveCanonicalDomain(name || '', url);
    if (!domain || !fullUrl) {
      return res.status(400).json({ message: 'Invalid URL.' });
    }

    return res.json({
      valid: true,
      domain,
      fullUrl,
      message: `Canonical domain resolved: ${domain}`,
    });
  } catch (err) {
    res.status(500).json({ message: 'Verification error.' });
  }
}

// DELETE /api/admin/companies/questions/:questionId
async function deleteCompanyQuestion(req, res) {
  try {
    const { questionId } = req.params;
    const adminUser = req.user;

    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: { company: true },
    });

    if (!question) {
      return res.status(404).json({ message: 'Question not found.' });
    }

    await prisma.question.delete({ where: { id: questionId } });

    await logAdminActivity(adminUser.id, 'ADMIN_DELETE_QUESTION', {
      questionId,
      companyId: question.companyId,
      companyName: question.company.name,
      questionText: question.questionText,
    });

    res.json({ message: 'Question removed successfully.' });
  } catch (err) {
    console.error('[Admin deleteCompanyQuestion Error]:', err);
    res.status(500).json({ message: 'Failed to delete question.' });
  }
}

module.exports = {
  getAdminCompanies,
  getAdminCompanyById,
  createAdminCompany,
  updateAdminCompany,
  deleteAdminCompany,
  verifyCompanyWebsite,
  scrapeCompanyOfficial,
  verifyUrlStandalone,
  deleteCompanyQuestion,
  checkCompanyExists,
  previewOfficialRefresh,
  applyOfficialRefresh,
};
