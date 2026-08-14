/**
 * slugify.js
 *
 * Normalizes a company name into a unique, URL-safe slug used as the
 * case-insensitive primary key for company resolution (upsert / dedup).
 *
 * Examples:
 *   "Google"     → "google"
 *   "  GOOGLE  " → "google"
 *   "J.P. Morgan"→ "jp-morgan"
 *   "Tata Consultancy Services" → "tata-consultancy-services"
 */
function slugify(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')   // strip non-word chars (except spaces & hyphens)
    .replace(/[\s_]+/g, '-')    // spaces / underscores → hyphens
    .replace(/-+/g, '-')        // collapse repeated hyphens
    .replace(/^-+|-+$/g, '');   // trim leading/trailing hyphens
}

module.exports = { slugify };
