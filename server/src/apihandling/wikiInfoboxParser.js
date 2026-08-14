/**
 * Wikipedia Wikitext Infobox Parser
 * 
 * Extracts only placement-relevant company facts from Wikipedia's {{Infobox company ...}} template block.
 * Strips all wikitext markup ([[links]], {{templates}}, <ref> tags) while preserving financial figures and "as of" years.
 */

function cleanWikitextValue(text) {
  if (!text || typeof text !== 'string') return null;
  let str = text;

  // 1. Strip references, citations, and HTML comments
  str = str.replace(/<ref[^>]*>[\s\S]*?<\/ref>/gi, '');
  str = str.replace(/<ref[^>]*\/>/gi, '');
  str = str.replace(/<!--[\s\S]*?-->/g, '');

  // 2. Normalize HTML breaks to comma/space separators
  str = str.replace(/<br\s*\/?>/gi, ', ');
  str = str.replace(/<hr\s*\/?>/gi, ', ');

  // 3. Clean Wikilinks FIRST so internal pipes don't disrupt outer templates
  // [[Target|Label]] -> Label, [[Target]] -> Target
  str = str.replace(/\[\[(?:[^|\]]*\|)?([^\]]+)\]\]/g, '$1');

  // 4. Strip trend indicators (e.g., {{increase}}, {{decrease}}, {{steady}})
  str = str.replace(/\{\{(?:increase|decrease|steady|gain|loss|up|down|pos|neg|positive|negative)[^}]*\}\}/gi, '');

  // 5. Handle font-size templates, non-breaking space & nowrap
  str = str.replace(/\{\{(?:small|smaller|large|larger)\s*\|?([^}]*)\}\}/gi, '$1');
  str = str.replace(/\{\{(?:small|smaller|large|larger)\b[^}]*\}\}/gi, '');
  str = str.replace(/\{\{nbsp\}\}/gi, ' ');
  str = str.replace(/&nbsp;/gi, ' ');
  str = str.replace(/\{\{nowrap\|([^}]+)\}\}/gi, '$1');

  // 6. Currency & Conversion templates:
  // e.g. {{INRConvert|271423|c}} -> ₹271,423 crore
  str = str.replace(/\{\{(?:INRConvert|INR\s*convert)\|([^}]+)\}\}/gi, (m, p1) => {
    const parts = p1.split('|').map((s) => s.trim());
    const val = parts[0] || '';
    const unitCode = (parts[1] || 'c').toLowerCase();
    let unit = 'crore';
    if (unitCode === 'l' || unitCode === 'lk') unit = 'lakh';
    else if (unitCode === 'b') unit = 'billion';
    else if (unitCode === 'm') unit = 'million';
    else if (unitCode === 't') unit = 'trillion';
    return `₹${val} ${unit}`;
  });

  // e.g. {{US$Convert|331.8|b}} -> $331.8 billion
  str = str.replace(/\{\{(?:US\$Convert|USDConvert|USD\s*convert)\|([^}]+)\}\}/gi, (m, p1) => {
    const parts = p1.split('|').map((s) => s.trim());
    const val = parts[0] || '';
    const unitCode = (parts[1] || 'b').toLowerCase();
    let unit = 'billion';
    if (unitCode === 'm') unit = 'million';
    else if (unitCode === 't') unit = 'trillion';
    return `$${val} ${unit}`;
  });

  // Currency templates: {{US$|58.28 billion|link=yes}} -> $58.28 billion
  str = str.replace(/\{\{(?:US\$|USD|INR|₹|inr|EUR|€|GBP|£|\$)\|([^}]+)\}\}/gi, (m, val) => {
    const code = m.slice(2, m.indexOf('|')).toUpperCase();
    let sym = '$';
    if (code.includes('INR') || code.includes('₹')) sym = '₹';
    else if (code.includes('EUR') || code.includes('€')) sym = '€';
    else if (code.includes('GBP') || code.includes('£')) sym = '£';
    const amount = val.replace(/\|link=\w+/gi, '').replace(/\|[a-z]+=[^|]+/gi, '').trim();
    return `${sym}${amount}`;
  });

  // 7. Handle list templates: {{ubl|A|B}}, {{unbulleted list|A|B}}, {{plainlist|* A\n* B}}, {{flatlist|* A\n* B}}
  str = str.replace(/\{\{(?:unbulleted list|ubl|plainlist|flatlist)\s*\|([\s\S]*?)\}\}/gi, (m, p1) => {
    return p1
      .split('|')
      .map((item) => item.replace(/^\s*\*\s*/, '').trim())
      .filter(Boolean)
      .join(', ');
  });

  // 8. Clean URLs: {{URL|https://example.com|example.com}} -> example.com
  str = str.replace(/\{\{URL\|([^}]+)\}\}/gi, (m, p1) => {
    const parts = p1.split('|');
    return parts[parts.length - 1].trim();
  });

  // 9. Recursively remove any remaining arbitrary templates like {{Coord|...}}, {{as of|...}}
  let prev;
  do {
    prev = str;
    str = str.replace(/\{+[^{}]*\}+/g, '');
  } while (str !== prev && str.includes('{'));

  // 10. Strip lingering wikimarkup like bold/italic quotes ('' or ''')
  str = str.replace(/'''+/g, '');
  str = str.replace(/''+/g, '');

  // 11. Normalize whitespace, bullets, and punctuation
  str = str.replace(/\*\s*/g, '');
  str = str.replace(/\s+/g, ' ');
  str = str.replace(/,\s+/g, ', ');
  str = str.replace(/([^\d\s]),([^\d\s])/g, '$1, $2');
  str = str.replace(/;\s*;/g, '; ');
  str = str.replace(/,\s*,/g, ', ');
  str = str.replace(/^[\s,;:\-–—\s]+|[\s,;:\-–—\s]+$/g, '').trim();

  // Balance single unclosed opening parenthesis if needed e.g. '(2025' -> '(2025)'
  const openCount = (str.match(/\(/g) || []).length;
  const closeCount = (str.match(/\)/g) || []).length;
  if (openCount > closeCount) {
    str += ')'.repeat(openCount - closeCount);
  }

  // Filter out standalone year-only strings if not accompanied by fact content
  if (/^\(?\s*(?:19\d\d|20\d\d|FY\d\d)\s*\)?$/i.test(str)) {
    return null;
  }

  return str.length > 0 ? str : null;
}

/**
 * Extracts balanced {{Infobox company ...}} template string from wikitext.
 */
function extractInfoboxBlock(wikitext) {
  if (!wikitext || typeof wikitext !== 'string') return null;

  // Check for disambiguation template
  if (/\{\{(?:disambiguation|disambig|disamb)\b/i.test(wikitext)) {
    return null;
  }

  // Find start of Infobox company or organization
  const startMatch = wikitext.match(/\{\{Infobox\s+(?:company|organization)\b/i);
  if (!startMatch || startMatch.index === undefined) {
    return null;
  }

  const startIndex = startMatch.index;
  let braceDepth = 0;
  let endIndex = -1;

  for (let i = startIndex; i < wikitext.length; i++) {
    if (wikitext[i] === '{' && wikitext[i + 1] === '{') {
      braceDepth++;
      i++; // Skip second brace
    } else if (wikitext[i] === '}' && wikitext[i + 1] === '}') {
      braceDepth--;
      i++; // Skip second brace
      if (braceDepth === 0) {
        endIndex = i + 1;
        break;
      }
    }
  }

  if (endIndex === -1) return null;
  return wikitext.slice(startIndex, endIndex);
}

/**
 * Parses raw infobox block into a key-value dictionary of parameters.
 */
function parseInfoboxParams(infoboxBlock) {
  const params = {};
  if (!infoboxBlock) return params;

  // Remove outermost {{ and }}
  const inner = infoboxBlock.replace(/^\{\{\s*Infobox\s+(?:company|organization)\b/i, '').replace(/\}\}$/, '');

  let currentKey = null;
  let currentValue = '';
  let braceDepth = 0;
  let bracketDepth = 0;

  const lines = inner.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('|') && braceDepth === 0 && bracketDepth === 0) {
      if (currentKey) {
        params[currentKey] = currentValue.trim();
      }
      const firstEq = line.indexOf('=');
      if (firstEq !== -1) {
        currentKey = line.slice(line.indexOf('|') + 1, firstEq).trim().toLowerCase();
        currentValue = line.slice(firstEq + 1);
      } else {
        currentKey = null;
        currentValue = '';
      }
    } else if (currentKey) {
      currentValue += '\n' + line;
    }

    // Track template and link balance
    for (let i = 0; i < line.length; i++) {
      if (line[i] === '{' && line[i + 1] === '{') { braceDepth++; i++; }
      else if (line[i] === '}' && line[i + 1] === '}') { braceDepth = Math.max(0, braceDepth - 1); i++; }
      else if (line[i] === '[' && line[i + 1] === '[') { bracketDepth++; i++; }
      else if (line[i] === ']' && line[i + 1] === ']') { bracketDepth = Math.max(0, bracketDepth - 1); i++; }
    }
  }

  if (currentKey) {
    params[currentKey] = currentValue.trim();
  }

  return params;
}

/**
 * Attaches "as of" year to financial / quantitative figures if available.
 */
function appendYearIfAvailable(val, yearVal) {
  const cleanedVal = cleanWikitextValue(val);
  if (!cleanedVal) return null;
  const cleanedYear = cleanWikitextValue(yearVal);
  if (cleanedYear && !cleanedVal.includes(cleanedYear) && /^\d{4}/.test(cleanedYear)) {
    return `${cleanedVal} (${cleanedYear})`;
  }
  return cleanedVal;
}

/**
 * Main parser function: extracts only the 12 placement-relevant fields.
 * Returns null if no valid infobox or all fields are null.
 */
function parseWikiInfobox(wikitext, title) {
  const block = extractInfoboxBlock(wikitext);
  if (!block) return null;

  const params = parseInfoboxParams(block);

  // 1. Industry
  const industry = cleanWikitextValue(params.industry || params.type_industry);

  // 2. Products
  const products = cleanWikitextValue(params.products || params.product);

  // 3. Founders
  const founders = cleanWikitextValue(params.founders || params.founder);

  // 4. Key People
  const keyPeople = cleanWikitextValue(params.key_people || params.key_person || params.key_executives);

  // 5. Revenue
  const revenue = appendYearIfAvailable(params.revenue, params.revenue_year || params.income_year);

  // 6. Operating Income
  const operatingIncome = appendYearIfAvailable(params.operating_income, params.income_year || params.operating_income_year);

  // 7. Net Income
  const netIncome = appendYearIfAvailable(params.net_income, params.net_income_year || params.income_year);

  // 8. Total Assets
  const totalAssets = appendYearIfAvailable(params.total_assets || params.assets, params.assets_year || params.total_assets_year);

  // 9. Headquarters / Locations
  const hqParts = [
    params.hq_location,
    params.hq_location_city,
    params.hq_location_country,
    params.location,
    params.area_served ? `Area served: ${params.area_served}` : null,
  ]
    .map(cleanWikitextValue)
    .filter(Boolean);
  
  const uniqueHq = [];
  hqParts.forEach((p) => {
    if (!uniqueHq.some((existing) => existing.toLowerCase().includes(p.toLowerCase()) || p.toLowerCase().includes(existing.toLowerCase()))) {
      uniqueHq.push(p);
    }
  });
  const headquarters = uniqueHq.length > 0 ? uniqueHq.join(', ') : null;

  // 10. Number of Employees
  const numEmployees = appendYearIfAvailable(params.num_employees || params.num_employees_parent, params.num_employees_year);

  // 11. Parent Company
  const parentCompany = cleanWikitextValue(params.parent || params.parent_company);

  // 12. Subsidiaries / Divisions
  const subParts = [
    params.subsid || params.subsidiaries,
    params.divisions ? `Divisions: ${params.divisions}` : null,
  ]
    .map(cleanWikitextValue)
    .filter(Boolean);
  const subsidiaries = subParts.length > 0 ? subParts.join('; ') : null;

  // Check if at least one meaningful field exists
  const hasAnyFact = [
    industry,
    products,
    founders,
    keyPeople,
    revenue,
    operatingIncome,
    netIncome,
    totalAssets,
    headquarters,
    numEmployees,
    parentCompany,
    subsidiaries,
  ].some((f) => f !== null && f !== undefined && f !== '');

  if (!hasAnyFact) return null;

  const articleTitle = title || params.name || 'Company';
  const wikipediaUrl = `https://en.wikipedia.org/wiki/${encodeURIComponent(articleTitle.replace(/ /g, '_'))}`;

  return {
    industry,
    products,
    founders,
    keyPeople,
    revenue,
    operatingIncome,
    netIncome,
    totalAssets,
    headquarters,
    numEmployees,
    parentCompany,
    subsidiaries,
    wikipediaUrl,
  };
}

module.exports = {
  parseWikiInfobox,
  cleanWikitextValue,
  extractInfoboxBlock,
  parseInfoboxParams,
};
