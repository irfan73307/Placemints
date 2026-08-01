const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * CSV Import Script for Placemints Company Data
 * 
 * Usage:
 * Place your CSV file at server/prisma/companies.csv or pass the path via argument:
 * node prisma/importCsv.js [path-to-csv-file]
 */
async function importCompanyCsv(csvFilePath) {
  const filePath = csvFilePath || path.join(__dirname, 'companies.csv');

  if (!fs.existsSync(filePath)) {
    console.error(`❌ CSV File not found at ${filePath}`);
    console.log('Please place your companies.csv file in server/prisma/ or pass the path to the script.');
    process.exit(1);
  }

  console.log(`📊 Reading CSV file: ${filePath}`);
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const lines = fileContent.split(/\r?\n/).filter((l) => l.trim().length > 0);

  if (lines.length <= 1) {
    console.log('⚠️ CSV file is empty or contains only headers.');
    return;
  }

  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
  console.log(`📋 Found headers: ${headers.join(', ')}`);

  let count = 0;
  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map((val) => val.trim().replace(/^"|"$/g, ''));
    if (!row[0]) continue;

    const companyName = row[0];
    const slug = companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const tier = row[1] || 'Product-based';
    const ctc = row[2] || '₹6.0 - 12.0 LPA';
    const sector = row[3] || 'IT Services / Product';
    const description = row[4] || `${companyName} visits SASTRA campus for software engineering & analyst roles.`;
    const tags = row[5] || 'Product-based,Core Software';

    await prisma.company.upsert({
      where: { slug },
      update: { name: companyName, tier, ctc, sector, description, tags },
      create: {
        slug,
        name: companyName,
        logoUrl: `https://logo.clearbit.com/${slug.split('-')[0]}.com`,
        tier,
        ctc,
        sector,
        description,
        tags,
      },
    });

    console.log(`✅ Upserted company [${i}/${lines.length - 1}]: ${companyName}`);
    count++;
  }

  console.log(`🎉 CSV Import finished successfully! Added/updated ${count} companies.`);
}

const targetPath = process.argv[2];
importCompanyCsv(targetPath)
  .catch((e) => console.error('❌ Import failed:', e))
  .finally(() => prisma.$disconnect());
