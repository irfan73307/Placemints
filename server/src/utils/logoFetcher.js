const axios = require('axios');

/**
 * LogoFetcher Utility
 * 
 * Scalable multi-provider logo fetcher.
 * Preferred Provider Order:
 * 1. Clearbit Logo API (https://logo.clearbit.com/${domain})
 * 2. Icon Horse Logo Provider (https://icon.horse/icon/${domain})
 * 3. Google Favicon HD API (https://www.google.com/s2/favicons?domain=${domain}&sz=128)
 * 4. Simple Icons Fallback
 */

/**
 * Extracts clean domain name from company name or website.
 * Examples:
 * - "Google", "https://google.com" -> "google.com"
 * - "Tata Consultancy Services (TCS)" -> "tcs.com"
 * - "Zoho Corporation" -> "zoho.com"
 * - "Amazon" -> "amazon.com"
 */
function resolveCompanyDomain(companyName, website) {
  if (website && typeof website === 'string' && website.trim() !== '') {
    try {
      const urlStr = website.startsWith('http') ? website : `https://${website}`;
      const parsed = new URL(urlStr);
      return parsed.hostname.replace(/^www\./, '');
    } catch (e) {
      // Fallback to name parsing
    }
  }

  if (!companyName || typeof companyName !== 'string') return null;

  const normalized = companyName.toLowerCase().trim();

  // Known domain dictionary for common recruiters
  const DOMAIN_MAP = {
    'tcs': 'tcs.com',
    'tata consultancy services': 'tcs.com',
    'zoho': 'zoho.com',
    'zoho corporation': 'zoho.com',
    'google': 'google.com',
    'microsoft': 'microsoft.com',
    'amazon': 'amazon.com',
    'adobe': 'adobe.com',
    'netflix': 'netflix.com',
    'meta': 'meta.com',
    'facebook': 'meta.com',
    'apple': 'apple.com',
    'cisco': 'cisco.com',
    'oracle': 'oracle.com',
    'salesforce': 'salesforce.com',
    'ibm': 'ibm.com',
    'accenture': 'accenture.com',
    'cognizant': 'cognizant.com',
    'infosys': 'infosys.com',
    'wipro': 'wipro.com',
    'capgemini': 'capgemini.com',
    'hcl': 'hcltech.com',
    'hcltech': 'hcltech.com',
    'goldman sachs': 'goldmansachs.com',
    'morgan stanley': 'morganstanley.com',
    'jpmorgan': 'jpmorgan.com',
    'jp morgan': 'jpmorgan.com',
    'paypal': 'paypal.com',
    'uber': 'uber.com',
    'flipkart': 'flipkart.com',
    'swiggy': 'swiggy.com',
    'zomato': 'zomato.com',
    'paytm': 'paytm.com',
    'freshworks': 'freshworks.com',
    'atlassian': 'atlassian.com',
    'nvidia': 'nvidia.com',
    'intel': 'intel.com',
    'qualcomm': 'qualcomm.com',
    'amd': 'amd.com',
    'samsung': 'samsung.com',
  };

  for (const [key, domain] of Object.entries(DOMAIN_MAP)) {
    if (normalized.includes(key)) {
      return domain;
    }
  }

  // Generic domain fallback: strip spaces and add .com
  const cleanName = normalized.replace(/[^a-z0-9]/g, '');
  return cleanName ? `${cleanName}.com` : null;
}

/**
 * Validates whether an image URL is live and accessible.
 */
async function checkImageAccessibility(url) {
  try {
    const response = await axios.head(url, { timeout: 3000 });
    const contentType = response.headers['content-type'] || '';
    return response.status === 200 && (contentType.includes('image') || contentType.includes('octet-stream'));
  } catch (err) {
    return false;
  }
}

/**
 * Fetches official company logo URL by querying multi-provider hierarchy.
 * Never throws an unhandled error; returns null on failure.
 */
async function fetchOfficialLogo(companyName, website) {
  const domain = resolveCompanyDomain(companyName, website);
  if (!domain) return null;

  const providers = [
    `https://logo.clearbit.com/${domain}`,
    `https://icon.horse/icon/${domain}`,
    `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
  ];

  for (const providerUrl of providers) {
    const isAccessible = await checkImageAccessibility(providerUrl);
    if (isAccessible) {
      return providerUrl;
    }
  }

  // Fallback to Clearbit direct string format
  return `https://logo.clearbit.com/${domain}`;
}

module.exports = {
  resolveCompanyDomain,
  fetchOfficialLogo,
};
