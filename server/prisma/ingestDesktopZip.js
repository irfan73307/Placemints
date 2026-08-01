const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const zipPath = 'C:\\Users\\shaik\\Desktop\\company wise quesitons.zip';

async function processZipAndIngest() {
  console.log(`📦 Opening ZIP archive: ${zipPath}`);

  if (!fs.existsSync(zipPath)) {
    console.error(`❌ ZIP file not found at ${zipPath}`);
    process.exit(1);
  }

  // Create temporary extraction directory
  const extractDir = path.join(__dirname, 'temp_extracted_questions');
  if (fs.existsSync(extractDir)) {
    fs.rmSync(extractDir, { recursive: true, force: true });
  }
  fs.mkdirSync(extractDir, { recursive: true });

  console.log(`📂 Extracting ZIP contents to ${extractDir}...`);
  const powershellExtract = `Add-Type -AssemblyName System.IO.Compression.FileSystem; [System.IO.Compression.ZipFile]::ExtractToDirectory('${zipPath.replace(/'/g, "''")}', '${extractDir.replace(/'/g, "''")}')`;
  fs.writeFileSync(path.join(__dirname, 'extract.ps1'), powershellExtract);

  try {
    execSync(`powershell -File "${path.join(__dirname, 'extract.ps1')}"`);
    console.log(`✅ Extraction complete.`);
  } catch (err) {
    console.error('Extraction error:', err.message);
  } finally {
    if (fs.existsSync(path.join(__dirname, 'extract.ps1'))) {
      fs.unlinkSync(path.join(__dirname, 'extract.ps1'));
    }
  }

  // Find root folder containing company folders
  let baseFolder = extractDir;
  const items = fs.readdirSync(extractDir);
  if (items.length === 1 && fs.statSync(path.join(extractDir, items[0])).isDirectory()) {
    baseFolder = path.join(extractDir, items[0]);
  }

  const companyDirs = fs.readdirSync(baseFolder).filter((item) => {
    return fs.statSync(path.join(baseFolder, item)).isDirectory();
  });

  console.log(`🏢 Found ${companyDirs.length} company folders! Starting database ingestion...`);

  // Default User for contributions
  const user = await prisma.user.upsert({
    where: { email: 'shaik.haroon@sastra.ac.in' },
    update: {},
    create: {
      id: 'usr_sastra_2026_01',
      name: 'Shaik Haroon',
      email: 'shaik.haroon@sastra.ac.in',
      branch: 'CSE',
      batchYear: 2026,
    },
  });

  let totalCompaniesAdded = 0;
  let totalQuestionsAdded = 0;

  for (const compName of companyDirs) {
    const compDirPath = path.join(baseFolder, compName);
    const slug = compName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const logoUrl = `https://logo.clearbit.com/${slug.split('-')[0]}.com`;

    // Tier heuristic
    let tier = 'Product-based';
    if (['tcs', 'infosys', 'wipro', 'cognizant', 'accenture', 'capgemini', 'hcl'].some((m) => slug.includes(m))) {
      tier = 'Mass / Service-based';
    } else if (['amazon', 'google', 'meta', 'apple', 'microsoft', 'netflix', 'uber', 'paypal', 'atlassian'].some((m) => slug.includes(m))) {
      tier = 'Super Dream';
    }

    const company = await prisma.company.upsert({
      where: { slug },
      update: { name: compName, tier },
      create: {
        slug,
        name: compName,
        logoUrl,
        tier,
        ctc: tier === 'Super Dream' ? '₹24.0 - 45.0 LPA' : tier === 'Mass / Service-based' ? '₹4.5 - 9.0 LPA' : '₹8.0 - 18.0 LPA',
        sector: 'Software & Technology',
        description: `${compName} conducts campus & lateral recruitment for software engineering, data, and system design roles.`,
        tags: `${tier},Core Software,Placement 2026`,
      },
    });

    // Create standard selection rounds for this company
    const round1 = await prisma.interviewRound.create({
      data: {
        companyId: company.id,
        roundNumber: 1,
        title: 'Round 1: Online Coding Assessment (OA)',
        description: `Foundation aptitude & 2-3 LeetCode DSA problem solving in C++/Java/Python.`,
      },
    });

    const round2 = await prisma.interviewRound.create({
      data: {
        companyId: company.id,
        roundNumber: 2,
        title: 'Round 2: Technical Interview (DSA & Core CS)',
        description: `Live coding, Data Structures, Algorithms, DBMS queries, OOPs, and Operating Systems.`,
      },
    });

    await prisma.interviewRound.create({
      data: {
        companyId: company.id,
        roundNumber: 3,
        title: 'Round 3: System Design / HR Interview',
        description: `Low Level Design (LLD) / High Level Design (HLD) + Behavioral & Culture fit assessment.`,
      },
    });

    totalCompaniesAdded++;

    // Find questions CSV files (prioritize 5. All.csv)
    const files = fs.readdirSync(compDirPath);
    const targetCsvFile = files.find((f) => f.includes('5. All.csv')) || files.find((f) => f.endsWith('.csv'));

    if (!targetCsvFile) continue;

    const csvPath = path.join(compDirPath, targetCsvFile);
    const content = fs.readFileSync(csvPath, 'utf-8');
    const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);

    if (lines.length <= 1) continue;

    for (let i = 1; i < lines.length; i++) {
      const row = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map((val) => val.trim().replace(/^"|"$/g, ''));
      if (row.length < 2) continue;

      const difficulty = (row[0] || 'Medium').charAt(0).toUpperCase() + (row[0] || 'Medium').slice(1).toLowerCase();
      const questionText = row[1];
      if (!questionText) continue;

      const frequency = parseFloat(row[2]) || 15.0;
      const topics = row[5] || 'DSA,Algorithms';

      await prisma.question.create({
        data: {
          companyId: company.id,
          roundId: i % 2 === 0 ? round1.id : round2.id,
          questionText,
          difficulty,
          topicTags: topics,
          year: 2024,
          likeCount: Math.round(frequency),
          contributedBy: user.id,
        },
      });

      totalQuestionsAdded++;
    }

    console.log(`✅ Ingested ${compName}: added rounds and company questions.`);
  }

  console.log(`\n🎉 INGESTION COMPLETE!`);
  console.log(`📊 Summary: ${totalCompaniesAdded} companies and ${totalQuestionsAdded} questions added into database!`);

  // Clean up extraction temp folder
  if (fs.existsSync(extractDir)) {
    fs.rmSync(extractDir, { recursive: true, force: true });
  }
}

processZipAndIngest()
  .catch((e) => console.error('❌ Error during zip ingestion:', e))
  .finally(() => prisma.$disconnect());
