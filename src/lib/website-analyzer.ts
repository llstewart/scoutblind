import * as cheerio from 'cheerio';
import { websiteLogger } from '@/lib/logger';

interface WebsiteAnalysis {
  cms: string | null;
  seoOptimized: boolean;
  ownerName: string | null;
  ownerPhone: string | null;
  techStack: string;
}

// Fallback string signatures for CMS detection (used when DOM queries don't match)
const CMS_SIGNATURES: Record<string, string[]> = {
  WordPress: [
    'wp-content',
    'wp-includes',
    'wordpress',
    '/wp-json/',
    'wp-emoji',
  ],
  Wix: [
    'wix.com',
    '_wix_browser_sess',
    'wixsite.com',
    'X-Wix-',
    'wixpress.com',
  ],
  Squarespace: [
    'squarespace',
    'sqsp.net',
    'static1.squarespace.com',
    'squarespace-cdn',
  ],
  Shopify: [
    'cdn.shopify.com',
    'shopify.com',
    'myshopify.com',
  ],
  Webflow: [
    'webflow.com',
    'wf-cdn.com',
    'website-files.com',
  ],
  GoDaddy: [
    'godaddy.com',
    'secureserver.net',
    'godaddysites.com',
  ],
  Weebly: [
    'weebly.com',
    'editmysite.com',
  ],
};

// Fallback string signatures for SEO plugin detection
const SEO_PLUGIN_SIGNATURES: string[] = [
  'yoast',
  'rank math',
  'rankmath',
  'all in one seo',
  'aioseo',
  'seopress',
  'schema.org',
  'application/ld+json',
];

// More realistic browser User-Agent
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

/**
 * Detect CMS using cheerio DOM queries first, then fall back to raw HTML string matching.
 */
function detectCms($: cheerio.CheerioAPI, html: string): string | null {
  // WordPress: wp-content links, wp-includes scripts, generator meta
  if (
    $('link[href*="wp-content"], script[src*="wp-includes"]').length > 0 ||
    $('meta[name="generator"][content*="WordPress"]').length > 0
  ) {
    websiteLogger.debug({ cms: 'WordPress', method: 'DOM' }, 'Detected CMS');
    return 'WordPress';
  }

  // Wix: generator meta, parastorage links, wixsite links
  if (
    $('meta[name="generator"][content*="Wix"]').length > 0 ||
    $('link[href*="parastorage.com"]').length > 0 ||
    $('link[href*="wixsite.com"]').length > 0
  ) {
    websiteLogger.debug({ cms: 'Wix', method: 'DOM' }, 'Detected CMS');
    return 'Wix';
  }

  // Squarespace: generator meta, sqsp.net links
  if (
    $('meta[name="generator"][content*="Squarespace"]').length > 0 ||
    $('link[href*="sqsp.net"]').length > 0
  ) {
    websiteLogger.debug({ cms: 'Squarespace', method: 'DOM' }, 'Detected CMS');
    return 'Squarespace';
  }

  // Shopify: cdn.shopify.com links and scripts
  if (
    $('link[href*="cdn.shopify.com"]').length > 0 ||
    $('script[src*="cdn.shopify.com"]').length > 0
  ) {
    websiteLogger.debug({ cms: 'Shopify', method: 'DOM' }, 'Detected CMS');
    return 'Shopify';
  }

  // Webflow: data-wf-site attribute, generator meta
  if (
    $('[data-wf-site]').length > 0 ||
    $('meta[name="generator"][content*="Webflow"]').length > 0
  ) {
    websiteLogger.debug({ cms: 'Webflow', method: 'DOM' }, 'Detected CMS');
    return 'Webflow';
  }

  // GoDaddy: content meta, godaddysites links
  if (
    $('meta[content*="GoDaddy"]').length > 0 ||
    $('link[href*="godaddysites.com"]').length > 0
  ) {
    websiteLogger.debug({ cms: 'GoDaddy', method: 'DOM' }, 'Detected CMS');
    return 'GoDaddy';
  }

  // Weebly: editmysite links, weebly links
  if (
    $('link[href*="editmysite.com"]').length > 0 ||
    $('link[href*="weebly.com"]').length > 0
  ) {
    websiteLogger.debug({ cms: 'Weebly', method: 'DOM' }, 'Detected CMS');
    return 'Weebly';
  }

  // Fallback: check raw HTML with string signatures
  const lowerHtml = html.toLowerCase();
  for (const [cms, signatures] of Object.entries(CMS_SIGNATURES)) {
    for (const sig of signatures) {
      if (lowerHtml.includes(sig.toLowerCase())) {
        websiteLogger.debug({ cms, matchedSignature: sig, method: 'fallback' }, 'Detected CMS');
        return cms;
      }
    }
  }

  return null;
}

/**
 * Detect SEO optimization using cheerio DOM queries first, then fall back to raw HTML.
 */
function detectSeo($: cheerio.CheerioAPI, html: string): boolean {
  // JSON-LD structured data present
  if ($('script[type="application/ld+json"]').length > 0) {
    websiteLogger.debug({ signal: 'JSON-LD' }, 'SEO signal detected');
    return true;
  }

  // Yoast SEO: meta tags or HTML comments
  if (
    $('meta[name="yoast"]').length > 0 ||
    $('meta[property="yoast"]').length > 0 ||
    html.includes('<!-- This site is optimized with the Yoast') ||
    html.includes('yoast-schema-graph')
  ) {
    websiteLogger.debug({ signal: 'Yoast' }, 'SEO signal detected');
    return true;
  }

  // RankMath: breadcrumb class or rankmath references in scripts
  if ($('.rank-math-breadcrumb').length > 0) {
    websiteLogger.debug({ signal: 'RankMath breadcrumb' }, 'SEO signal detected');
    return true;
  }

  // Check for rankmath in script sources
  let hasRankMath = false;
  $('script[src]').each((_i, el) => {
    const src = $(el).attr('src') || '';
    if (src.toLowerCase().includes('rankmath')) {
      hasRankMath = true;
      return false; // break out of .each
    }
  });
  if (hasRankMath) {
    websiteLogger.debug({ signal: 'RankMath script' }, 'SEO signal detected');
    return true;
  }

  // Generic: canonical link + meta description both present
  if (
    $('link[rel="canonical"]').length > 0 &&
    $('meta[name="description"]').length > 0
  ) {
    websiteLogger.debug({ signal: 'canonical + meta description' }, 'SEO signal detected');
    return true;
  }

  // Fallback: check raw HTML for SEO plugin signatures
  const lowerHtml = html.toLowerCase();
  for (const sig of SEO_PLUGIN_SIGNATURES) {
    if (lowerHtml.includes(sig.toLowerCase())) {
      websiteLogger.debug({ signal: sig, method: 'fallback' }, 'SEO signal detected');
      return true;
    }
  }

  return false;
}

/**
 * Extract contact information from a cheerio-parsed page.
 * Returns owner name and phone if found.
 */
function extractContacts($: cheerio.CheerioAPI): { ownerName: string | null; ownerPhone: string | null } {
  let ownerName: string | null = null;
  let ownerPhone: string | null = null;

  // Phone: prefer tel: links (most reliable signal)
  const telLink = $('a[href^="tel:"]').first();
  if (telLink.length > 0) {
    const href = telLink.attr('href') || '';
    const phone = href.replace('tel:', '').replace(/[^\d+\-\(\)\s]/g, '').trim();
    if (phone.length >= 10) {
      ownerPhone = phone;
      websiteLogger.debug({ ownerPhone }, 'Found phone via tel: link');
    }
  }

  // Owner from JSON-LD structured data (LocalBusiness, Organization, etc.)
  $('script[type="application/ld+json"]').each((_i, el) => {
    if (ownerName) return; // already found

    try {
      const raw = $(el).html();
      if (!raw) return;

      const data = JSON.parse(raw);

      // Handle @graph arrays (common in Yoast/RankMath output)
      const items = Array.isArray(data['@graph']) ? data['@graph'] : [data];

      for (const item of items) {
        const type = item['@type'];
        if (!type) continue;

        const types = Array.isArray(type) ? type : [type];
        const isRelevant = types.some((t: string) =>
          ['LocalBusiness', 'Organization', 'Restaurant', 'Store',
           'ProfessionalService', 'MedicalBusiness', 'LegalService',
           'FinancialService', 'AutoRepair', 'BeautySalon', 'DayCare',
           'Dentist', 'HealthClub', 'HomeAndConstructionBusiness'].includes(t)
        );

        if (!isRelevant) continue;

        // Try founder, employee, member fields
        const personFields = ['founder', 'employee', 'member', 'author'];
        for (const field of personFields) {
          if (item[field]) {
            const person = Array.isArray(item[field]) ? item[field][0] : item[field];
            if (person && person.name && typeof person.name === 'string') {
              ownerName = person.name.trim();
              websiteLogger.debug({ ownerName, source: `JSON-LD ${field}` }, 'Found owner name');
              return; // break out of .each
            }
          }
        }

        // Also try contactPoint for phone if not already found
        if (!ownerPhone && item.telephone) {
          const phone = String(item.telephone).replace(/[^\d+\-\(\)\s]/g, '').trim();
          if (phone.length >= 10) {
            ownerPhone = phone;
            websiteLogger.debug({ ownerPhone, source: 'JSON-LD telephone' }, 'Found phone');
          }
        }
      }
    } catch {
      // Invalid JSON-LD, skip
    }
  });

  // Owner fallback: meta author tag
  if (!ownerName) {
    const authorMeta = $('meta[name="author"]').attr('content');
    if (authorMeta && authorMeta.trim().length > 0 && authorMeta.trim().length <= 50) {
      ownerName = authorMeta.trim();
      websiteLogger.debug({ ownerName, source: 'meta author' }, 'Found owner name');
    }
  }

  return { ownerName, ownerPhone };
}

/**
 * Try fetching contact/about pages to extract owner name and phone.
 * Uses cheerio for DOM parsing instead of raw regex.
 */
async function tryContactPage(baseUrl: string): Promise<{ ownerName: string | null; ownerPhone: string | null }> {
  const contactPaths = ['/contact', '/contact-us', '/about', '/about-us', '/team', '/our-team'];

  for (const path of contactPaths) {
    try {
      const url = new URL(path, baseUrl).toString();
      websiteLogger.debug({ url }, 'Trying contact page');

      const abortController = new AbortController();
      const timeoutId = setTimeout(() => abortController.abort(), 8000);

      const response = await fetch(url, {
        headers: {
          'User-Agent': USER_AGENT,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
        signal: abortController.signal,
        redirect: 'follow',
      });

      clearTimeout(timeoutId);

      if (!response.ok) continue;

      const html = await response.text();
      const $ = cheerio.load(html);

      const contacts = extractContacts($);

      if (contacts.ownerName || contacts.ownerPhone) {
        websiteLogger.debug({ path, ownerName: contacts.ownerName, ownerPhone: contacts.ownerPhone }, 'Found contacts from subpage');
        return contacts;
      }
    } catch {
      continue;
    }
  }

  return { ownerName: null, ownerPhone: null };
}

export async function analyzeWebsite(url: string): Promise<WebsiteAnalysis> {
  const defaultResult: WebsiteAnalysis = {
    cms: null,
    seoOptimized: false,
    ownerName: null,
    ownerPhone: null,
    techStack: 'Unknown',
  };

  if (!url) {
    return defaultResult;
  }

  try {
    // Ensure URL has protocol and clean it up
    let normalizedUrl = url.trim();
    if (!normalizedUrl.startsWith('http')) {
      normalizedUrl = `https://${normalizedUrl}`;
    }

    // Remove trailing slashes for consistency
    normalizedUrl = normalizedUrl.replace(/\/+$/, '');

    websiteLogger.info({ url: normalizedUrl }, 'Fetching website');

    // Fetch the main page with better headers
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), 8000);

    const response = await fetch(normalizedUrl, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
      signal: abortController.signal,
      redirect: 'follow',
    });

    clearTimeout(timeoutId);

    websiteLogger.debug({ status: response.status, url: normalizedUrl }, 'Response received');

    if (!response.ok) {
      websiteLogger.warn({ status: response.status, url: normalizedUrl }, 'Non-OK response');
      return defaultResult;
    }

    const html = await response.text();
    websiteLogger.debug({ htmlLength: html.length }, 'Got HTML');

    // Parse with cheerio
    const $ = cheerio.load(html);

    // Detect CMS (DOM-first, string fallback)
    const detectedCms = detectCms($, html);

    // Detect SEO optimization (DOM-first, string fallback)
    const seoOptimized = detectSeo($, html);

    // Extract contact info from main page
    let { ownerName, ownerPhone } = extractContacts($);

    // If we didn't find contacts on the main page, try contact/about pages
    if (!ownerName && !ownerPhone) {
      websiteLogger.debug('No contacts on main page, trying contact/about pages');
      const contactPageResult = await tryContactPage(normalizedUrl);
      ownerName = contactPageResult.ownerName || ownerName;
      ownerPhone = contactPageResult.ownerPhone || ownerPhone;
    }

    // Build tech stack string
    let techStack = detectedCms || 'Custom';
    if (seoOptimized) {
      techStack += ' + SEO';
    }

    const result: WebsiteAnalysis = {
      cms: detectedCms,
      seoOptimized,
      ownerName,
      ownerPhone,
      techStack,
    };

    websiteLogger.info({ url: normalizedUrl, cms: result.cms, seoOptimized: result.seoOptimized, ownerName: result.ownerName }, 'Analysis complete');
    return result;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    websiteLogger.error({ url, err: errorMessage }, 'Website analysis failed');
    return defaultResult;
  }
}
