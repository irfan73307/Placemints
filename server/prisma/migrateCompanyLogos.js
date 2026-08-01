const prisma = require('../src/db');
const { fetchOfficialLogo } = require('../src/utils/logoFetcher');

/**
 * Migration Script: Populate Official Logos for Database Companies
 * 
 * Flow:
 * 1. Reads all companies in database.
 * 2. If company.logo is NULL or empty, fetches official logo via multi-provider resolver.
 * 3. Saves logo URL to Supabase PostgreSQL database.
 */
async function migrateCompanyLogos() {
  console.log('🚀 Starting one-time Database Company Logo Migration...');

  try {
    const companies = await prisma.company.findMany();
    console.log(`Found ${companies.length} companies in database.`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const company of companies) {
      if (company.customLogo || (company.logo && company.logo.trim() !== '')) {
        skippedCount++;
        continue;
      }

      const officialLogo = await fetchOfficialLogo(company.name, company.website);

      await prisma.company.update({
        where: { id: company.id },
        data: {
          logo: officialLogo || company.logoUrl || null,
          logoUrl: officialLogo || company.logoUrl || null,
        },
      });

      updatedCount++;
      console.log(`[UPDATED] ${company.name} -> ${officialLogo || 'NULL (Fallback Avatar)'}`);
    }

    console.log(`\n✅ Migration Complete!`);
    console.log(`Updated: ${updatedCount} companies.`);
    console.log(`Skipped (Already had logo): ${skippedCount} companies.`);
  } catch (err) {
    console.error('❌ Error during logo migration:', err);
  } finally {
    await prisma.$disconnect();
  }
}

migrateCompanyLogos();
