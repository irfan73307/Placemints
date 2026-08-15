/**
 * Wikipedia API Service for Placement Facts
 * 
 * Sourced via MediaWiki Official API (No HTML scraping).
 * Enforces Wikimedia API etiquette with custom User-Agent, concurrency limiting, and 30-day DB caching.
 */

const https = require('https');
const prisma = require('../db');
const { parseWikiInfobox } = require('./wikiInfoboxParser');

const USER_AGENT = 'Placemints/1.0 (https://placemints.vercel.app; placement-prep@sastra.ac.in)';
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

/**
 * Lightweight in-memory promise concurrency queue
 */
class ConcurrencyLimiter {
  constructor(concurrency = 3) {
    this.concurrency = concurrency;
    this.running = 0;
    this.queue = [];
  }

  run(fn) {
    return new Promise((resolve, reject) => {
      this.queue.push({ fn, resolve, reject });
      this.next();
    });
  }

  next() {
    if (this.running >= this.concurrency || this.queue.length === 0) return;
    const { fn, resolve, reject } = this.queue.shift();
    this.running++;
    fn()
      .then(resolve)
      .catch(reject)
      .finally(() => {
        this.running--;
        this.next();
      });
  }
}

const wikiLimiter = new ConcurrencyLimiter(3);

/**
 * Helper to perform HTTPS GET requests with custom User-Agent
 */
function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      {
        headers: {
          'User-Agent': USER_AGENT,
          Accept: 'application/json',
        },
        timeout: 10000,
      },
      (res) => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          return reject(new Error(`HTTP ${res.statusCode} from ${url}`));
        }
        let raw = '';
        res.on('data', (chunk) => {
          raw += chunk;
        });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(raw);
            resolve(parsed);
          } catch (e) {
            reject(new Error(`Failed to parse JSON response: ${e.message}`));
          }
        });
      }
    );

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Wikipedia request timed out'));
    });
  });
}

/**
 * Validates that the search result title is strictly relevant to the queried company name.
 * Prevents cross-mapping unrelated companies (e.g. Sprint Corporation for Prodapt).
 */
function isTitleRelevant(queryName, candidateTitle) {
  if (!queryName || !candidateTitle) return false;
  const cleanQ = queryName.toLowerCase().replace(/[^a-z0-9]/g, ' ').trim();
  const cleanT = candidateTitle.toLowerCase().replace(/[^a-z0-9]/g, ' ').trim();

  // Exact match
  if (cleanT === cleanQ) return true;

  // Substring or prefix match (e.g. "Google" in "Google LLC" or "Tata Consultancy Services" for "TCS")
  if (cleanT.startsWith(cleanQ) || cleanQ.startsWith(cleanT)) return true;

  // Specific acronym mappings
  const ACRONYMS = {
    tcs: 'tata consultancy services',
    ami: 'american megatrends',
    bgst: 'bosch global software technologies',
  };
  if (ACRONYMS[cleanQ] && cleanT.includes(ACRONYMS[cleanQ])) return true;

  // Clean tokens check: the candidate title must explicitly contain the main company name
  const qTokens = cleanQ.split(/\s+/).filter((t) => t.length > 2);
  const tTokens = cleanT.split(/\s+/).filter((t) => t.length > 2);

  if (qTokens.length > 0 && qTokens.every((qt) => tTokens.includes(qt))) {
    return true;
  }

  return false;
}

/**
 * Fetches placement-relevant company facts from Wikipedia official API
 */
async function fetchCompanyWikiData(companyName) {
  if (!companyName || typeof companyName !== 'string') return null;
  const cleanName = companyName.trim();

  try {
    return await wikiLimiter.run(async () => {
      // Step 1: Search Wikipedia to resolve official page title
      const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
        cleanName
      )}&format=json&utf8=1`;

      const searchRes = await fetchJson(searchUrl);
      const searchList = searchRes?.query?.search;
      if (!searchList || searchList.length === 0) {
        return null;
      }

      // Check top result candidates for infobox company with strict title verification
      const topCandidates = searchList.slice(0, 3);
      for (const candidate of topCandidates) {
        const title = candidate.title;

        // Identity check: candidate title MUST match queried company
        if (!isTitleRelevant(cleanName, title)) {
          console.log(`[Wikipedia Validator] Rejected irrelevant candidate "${title}" for query "${cleanName}"`);
          continue;
        }

        // Step 2: Fetch section 0 wikitext for infobox
        const parseUrl = `https://en.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(
          title
        )}&prop=wikitext&section=0&format=json&utf8=1`;

        const parseRes = await fetchJson(parseUrl);
        const wikitext = parseRes?.parse?.wikitext?.['*'];

        if (!wikitext) continue;

        // Disambiguation check
        if (/\{\{(?:disambiguation|disambig|disamb)\b/i.test(wikitext)) {
          continue;
        }

        const facts = parseWikiInfobox(wikitext, title);
        if (facts) {
          console.log(`[Wikipedia Matched] Sourced verified infobox for "${cleanName}" from article "${title}"`);
          return facts;
        }
      }

      return null;
    });
  } catch (err) {
    console.warn(`[WikipediaService] Failed to fetch facts for "${companyName}":`, err.message);
    return null;
  }
}

/**
 * Cached getter: returns cached data immediately; if missing/stale, attempts fast fetch (with 2.5s timeout)
 * and falls back to background update if network is slow, saving results to database.
 */
async function getOrRefreshCompanyWikiData(company) {
  if (!company) return null;

  const now = Date.now();
  const fetchedAt = company.wikiFetchedAt ? new Date(company.wikiFetchedAt).getTime() : 0;
  const isFresh = company.wikiData && (now - fetchedAt) < CACHE_TTL_MS;

  if (isFresh) {
    return company.wikiData;
  }

  // If no cached data exists, try fast inline fetch so first-time views get facts immediately
  if (!company.wikiData) {
    try {
      const fastFetchPromise = fetchCompanyWikiData(company.name);
      const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve(null), 2500));
      const freshData = await Promise.race([fastFetchPromise, timeoutPromise]);

      if (freshData) {
        // Save to DB asynchronously
        prisma.company
          .update({
            where: { id: company.id },
            data: {
              wikiData: freshData,
              wikiFetchedAt: new Date(),
            },
          })
          .catch((e) => console.warn(`[WikipediaService Cache Write] Error for ${company.name}:`, e.message));

        return freshData;
      }
    } catch (e) {
      // Continue to background task
    }
  }

  // Kick off background refresh without blocking response
  setImmediate(async () => {
    try {
      const freshData = await fetchCompanyWikiData(company.name);
      await prisma.company.update({
        where: { id: company.id },
        data: {
          wikiData: freshData || null,
          wikiFetchedAt: new Date(),
        },
      });
    } catch (e) {
      console.warn(`[WikipediaService Background Refresh] Error for ${company.name}:`, e.message);
    }
  });

  return company.wikiData || null;
}

module.exports = {
  fetchCompanyWikiData,
  getOrRefreshCompanyWikiData,
  wikiLimiter,
  CACHE_TTL_MS,
};

