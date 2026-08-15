const prisma = require('../src/db');
const { scrapeOfficialCompanyInfo } = require('../src/services/officialScraper');

async function cleanAndSyncData() {
  console.log('🚀 Starting Data Sanitization & Official Company Data Sync...');

  try {
    // 1. Purge contaminated wikiData on Prodapt (and any other record where wikiData points to an unrelated entity)
    const allCompanies = await prisma.company.findMany();
    console.log(`Checking ${allCompanies.length} companies for cross-company data contamination...`);

    let cleanedWikiCount = 0;
    for (const c of allCompanies) {
      if (c.wikiData && c.wikiData.wikipediaUrl) {
        const wikiUrl = c.wikiData.wikipediaUrl.toLowerCase();
        const compSlug = c.slug.toLowerCase();
        const compName = c.name.toLowerCase().replace(/[^a-z0-9]/g, '');

        // If Prodapt has Sprint in wikipediaUrl or if url does not resemble the company name/slug
        if (
          (compSlug === 'prodapt' && wikiUrl.includes('sprint')) ||
          (!wikiUrl.includes(compSlug) && !wikiUrl.includes(compName.slice(0, 5)))
        ) {
          console.log(`🧹 Purging cross-mapped wikiData from "${c.name}" (contained: ${c.wikiData.wikipediaUrl})`);
          await prisma.company.update({
            where: { id: c.id },
            data: {
              wikiData: null,
              wikiFetchedAt: null,
            },
          });
          cleanedWikiCount++;
        }
      }
    }
    console.log(`Cleaned ${cleanedWikiCount} contaminated records.`);

    // 2. Fetch and populate official verified information for Prodapt
    const prodapt = await prisma.company.findFirst({
      where: { OR: [{ slug: 'prodapt' }, { name: 'Prodapt' }] },
    });

    if (prodapt) {
      console.log('\nSyncing official verified data for Prodapt...');
      const officialInfo = await scrapeOfficialCompanyInfo('Prodapt', 'https://www.prodapt.com/');
      if (officialInfo) {
        await prisma.company.update({
          where: { id: prodapt.id },
          data: {
            officialWebsite: officialInfo.officialWebsite,
            officialDomain: officialInfo.officialDomain,
            officialDescription: officialInfo.officialDescription,
            industry: officialInfo.industry,
            headquarters: 'Chennai, Tamil Nadu, India (Global Operations in US, Europe, LATAM)',
            officialServices: officialInfo.officialServices,
            officialTechnologies: officialInfo.officialTechnologies,
            officialSourceUrl: officialInfo.officialSourceUrl,
            officialSourceType: 'official_website',
            officialDataLastUpdated: new Date(),
            wikiData: null, // ensure Sprint data is completely cleared
            wikiFetchedAt: null,
          },
        });
        console.log('✅ Prodapt official data updated and verified in Supabase PostgreSQL!');
      }
    }

    // 3. Populate official website fields for other key companies
    const keyCompanies = ['google', 'microsoft', 'amazon', 'tcs', 'infosys', 'cognizant', 'accenture', 'zoho', 'paypal'];
    for (const slug of keyCompanies) {
      const comp = await prisma.company.findFirst({ where: { slug } });
      if (comp && !comp.officialDomain) {
        const info = await scrapeOfficialCompanyInfo(comp.name, comp.website);
        if (info) {
          await prisma.company.update({
            where: { id: comp.id },
            data: {
              officialWebsite: info.officialWebsite,
              officialDomain: info.officialDomain,
              officialDescription: info.officialDescription,
              industry: info.industry,
              officialServices: info.officialServices,
              officialTechnologies: info.officialTechnologies,
              officialSourceUrl: info.officialSourceUrl,
              officialSourceType: 'official_website',
              officialDataLastUpdated: new Date(),
            },
          });
          console.log(`✅ [${comp.name}] Official data populated.`);
        }
      }
    }

    console.log('\n🎉 Data Sanitization & Official Sync Completed Successfully!');
  } catch (err) {
    console.error('Error during clean and sync:', err);
  } finally {
    await prisma.$disconnect();
  }
}

cleanAndSyncData();
