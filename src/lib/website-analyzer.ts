interface WebsiteAnalysis {
  cms: string | null;
  seoOptimized: boolean;
  ownerName: string | null;
  ownerPhone: string | null;
  techStack: string;
}

const CMS_SIGNATURES: Record<string, string[]> = {
  WordPress: [
    'wp-content',
    'wp-includes',
    'wordpress',
    '/wp-json/',
    'wp-emoji',
    'flavor="developer:developer.developer"',
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

const PHONE_PATTERNS = [
  /\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
  /\+1[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
  /tel:[\d\-\+\(\)\s]+/gi,
  /href="tel:([^"]+)"/gi,
];

// More restrictive name patterns - must be 2-4 capitalized words, max 30 chars total
const NAME_PATTERNS = [
  /owner[:\s]+([A-Z][a-z]{1,15}(?:\s+[A-Z][a-z]{1,15}){1,3})(?=\s*[,.<]|\s*$)/i,
  /dr\.?\s+([A-Z][a-z]{1,15}(?:\s+[A-Z][a-z]{1,15}){1,2})(?=\s*[,.<]|\s*$)/i,
  /manager[:\s]+([A-Z][a-z]{1,15}(?:\s+[A-Z][a-z]{1,15}){1,3})(?=\s*[,.<]|\s*$)/i,
  /proprietor[:\s]+([A-Z][a-z]{1,15}(?:\s+[A-Z][a-z]{1,15}){1,3})(?=\s*[,.<]|\s*$)/i,
  /founded by[:\s]+([A-Z][a-z]{1,15}(?:\s+[A-Z][a-z]{1,15}){1,3})(?=\s*[,.<]|\s*$)/i,
  /ceo[:\s]+([A-Z][a-z]{1,15}(?:\s+[A-Z][a-z]{1,15}){1,3})(?=\s*[,.<]|\s*$)/i,
  /president[:\s]+([A-Z][a-z]{1,15}(?:\s+[A-Z][a-z]{1,15}){1,3})(?=\s*[,.<]|\s*$)/i,
];

// More realistic browser User-Agent
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

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

    console.log(`[Website Analyzer] Fetching: ${normalizedUrl}`);

    // Fetch the main page with better headers
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(normalizedUrl, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
      signal: controller.signal,
      redirect: 'follow',
    });

    clearTimeout(timeoutId);

    console.log(`[Website Analyzer] Response status: ${response.status} for ${normalizedUrl}`);

    if (!response.ok) {
      console.log(`[Website Analyzer] Non-OK response: ${response.status}`);
      return defaultResult;
    }

    const html = await response.text();
    console.log(`[Website Analyzer] Got HTML, length: ${html.length}`);

    const lowerHtml = html.toLowerCase();

    // Detect CMS
    let detectedCms: string | null = null;
    for (const [cms, signatures] of Object.entries(CMS_SIGNATURES)) {
      for (const sig of signatures) {
        if (lowerHtml.includes(sig.toLowerCase())) {
          detectedCms = cms;
          console.log(`[Website Analyzer] Detected CMS: ${cms}`);
          break;
        }
      }
      if (detectedCms) break;
    }

    // Check for SEO optimization signals
    let seoOptimized = false;
    for (const sig of SEO_PLUGIN_SIGNATURES) {
      if (lowerHtml.includes(sig.toLowerCase())) {
        seoOptimized = true;
        console.log(`[Website Analyzer] SEO signal found: ${sig}`);
        break;
      }
    }

    // Try to extract owner name
    let ownerName: string | null = null;
    for (const pattern of NAME_PATTERNS) {
      const match = html.match(pattern);
      if (match && match[1]) {
        const candidate = match[1].trim();
        // Validate: must be 2-4 words, only letters/spaces, max 40 chars, looks like a name
        if (
          candidate.length <= 40 &&
          candidate.length >= 3 &&
          /^[A-Za-z]+(?:\s+[A-Za-z]+){1,3}$/.test(candidate) &&
          !candidate.toLowerCase().includes('contact') &&
          !candidate.toLowerCase().includes('click') &&
          !candidate.toLowerCase().includes('questions')
        ) {
          ownerName = candidate;
          console.log(`[Website Analyzer] Found owner name: ${ownerName}`);
          break;
        }
      }
    }

    // Try to extract phone number
    let ownerPhone: string | null = null;

    // First try tel: links
    const telMatch = html.match(/href="tel:([^"]+)"/i);
    if (telMatch && telMatch[1]) {
      ownerPhone = telMatch[1].replace(/[^\d+\-\(\)\s]/g, '').trim();
      console.log(`[Website Analyzer] Found phone from tel link: ${ownerPhone}`);
    }

    // If no tel link, try patterns
    if (!ownerPhone) {
      for (const pattern of PHONE_PATTERNS) {
        const matches = html.match(pattern);
        if (matches && matches.length > 0) {
          // Filter out obvious non-phone numbers (too short, etc.)
          const validPhone = matches.find(m => {
            const digits = m.replace(/\D/g, '');
            return digits.length >= 10 && digits.length <= 11;
          });
          if (validPhone) {
            ownerPhone = validPhone;
            console.log(`[Website Analyzer] Found phone: ${ownerPhone}`);
            break;
          }
        }
      }
    }

    // Skip contact page scanning for performance - owner info not displayed in UI

    // Build tech stack string
    let techStack = detectedCms || 'Custom';
    if (seoOptimized) {
      techStack += ' + SEO';
    }

    const result = {
      cms: detectedCms,
      seoOptimized,
      ownerName,
      ownerPhone,
      techStack,
    };

    console.log(`[Website Analyzer] Result for ${normalizedUrl}:`, result);
    return result;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Website Analyzer] Failed for ${url}: ${errorMessage}`);
    return defaultResult;
  }
}

async function tryContactPage(baseUrl: string): Promise<{ ownerName: string | null; ownerPhone: string | null }> {
  const contactPaths = ['/contact', '/contact-us', '/about', '/about-us', '/team', '/our-team'];

  for (const path of contactPaths) {
    try {
      const url = new URL(path, baseUrl).toString();
      console.log(`[Website Analyzer] Trying contact page: ${url}`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(url, {
        headers: {
          'User-Agent': USER_AGENT,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
        signal: controller.signal,
        redirect: 'follow',
      });

      clearTimeout(timeoutId);

      if (!response.ok) continue;

      const html = await response.text();

      let ownerName: string | null = null;
      for (const pattern of NAME_PATTERNS) {
        const match = html.match(pattern);
        if (match && match[1]) {
          ownerName = match[1].trim();
          break;
        }
      }

      let ownerPhone: string | null = null;

      // Try tel: links first
      const telMatch = html.match(/href="tel:([^"]+)"/i);
      if (telMatch && telMatch[1]) {
        ownerPhone = telMatch[1].replace(/[^\d+\-\(\)\s]/g, '').trim();
      }

      if (!ownerPhone) {
        for (const pattern of PHONE_PATTERNS) {
          const matches = html.match(pattern);
          if (matches && matches.length > 0) {
            const validPhone = matches.find(m => {
              const digits = m.replace(/\D/g, '');
              return digits.length >= 10 && digits.length <= 11;
            });
            if (validPhone) {
              ownerPhone = validPhone;
              break;
            }
          }
        }
      }

      if (ownerName || ownerPhone) {
        console.log(`[Website Analyzer] Found from ${path}: name=${ownerName}, phone=${ownerPhone}`);
        return { ownerName, ownerPhone };
      }
    } catch {
      continue;
    }
  }

  return { ownerName: null, ownerPhone: null };
}
