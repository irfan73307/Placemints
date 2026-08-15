const prisma = require('../src/db');
const { resolveCanonicalDomain } = require('../src/services/officialScraper');

async function backfillOfficialWebsites() {
  console.log('🔄 Starting backfill of officialWebsite and officialDomain for all companies in PostgreSQL...');

  try {
    const companies = await prisma.company.findMany();
    console.log(`Found ${companies.length} companies to check.`);

    let updatedCount = 0;
    for (const c of companies) {
      if (!c.officialWebsite || !c.officialDomain) {
        const { domain, fullUrl } = resolveCanonicalDomain(c.name, c.website || c.officialWebsite);
        if (domain && fullUrl) {
          await prisma.company.update({
            where: { id: c.id },
            data: {
              officialWebsite: c.officialWebsite || fullUrl,
              officialDomain: c.officialDomain || domain,
              website: c.website || fullUrl,
            },
          });
          updatedCount++;
        }
      }
    }

    console.log(`✅ Backfilled officialWebsite and officialDomain for ${updatedCount} companies!`);
  } catch (err) {
    console.error('Backfill error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

backfillOfficialWebsites();
