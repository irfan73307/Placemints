/**
 * Backfill Wikipedia Placement Facts Script
 * 
 * Runs batch resolution and infobox parsing across all companies in the database
 * with concurrency limiting and progress tracking.
 * 
 * Usage: node prisma/backfillWikiData.js
 */

const { PrismaClient } = require('@prisma/client');
const { fetchCompanyWikiData, wikiLimiter } = require('../src/apihandling/wikipediaService');

const prisma = new PrismaClient();

async function backfillWikiData() {
  console.log('🚀 Starting Wikipedia Placement Facts Backfill...\n');

  try {
    const companies = await prisma.company.findMany({
      select: { id: true, name: true, slug: true, wikiData: true, wikiFetchedAt: true },
      orderBy: { name: 'asc' },
    });

    console.log(`Found ${companies.length} companies in the database.`);
    let matchedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    const tasks = companies.map((company, index) => {
      return wikiLimiter.run(async () => {
        const prefix = `[${index + 1}/${companies.length}] ${company.name}`;
        try {
          const facts = await fetchCompanyWikiData(company.name);

          await prisma.company.update({
            where: { id: company.id },
            data: {
              wikiData: facts || null,
              wikiFetchedAt: new Date(),
            },
          });

          if (facts) {
            const count = Object.values(facts).filter((v) => v !== null && v !== undefined && v !== '').length;
            console.log(`✅ ${prefix}: Matched Wikipedia (${count} facts extracted)`);
            matchedCount++;
          } else {
            console.log(`⚠️  ${prefix}: No Wikipedia infobox match`);
            skippedCount++;
          }
        } catch (err) {
          console.error(`❌ ${prefix}: Error -`, err.message);
          errorCount++;
        }
      });
    });

    await Promise.all(tasks);

    console.log('\n=========================================');
    console.log('🎉 Backfill Completed Successfully!');
    console.log(`Total Companies: ${companies.length}`);
    console.log(`Matched & Cached: ${matchedCount}`);
    console.log(`Skipped (No Match): ${skippedCount}`);
    console.log(`Errors: ${errorCount}`);
    console.log('=========================================\n');
  } catch (err) {
    console.error('Fatal error during backfill:', err);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  backfillWikiData();
}

module.exports = { backfillWikiData };
