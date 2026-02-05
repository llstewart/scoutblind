import { Business } from './types';
import { withRetry, Semaphore, sleep, RetryOptions } from './rate-limiter';

// Outscraper has multiple API endpoints for redundancy (from their official Python SDK)
// We try them in order if one fails
// Note: api.outscraper.net is currently the primary working endpoint (as of Feb 2025)
const OUTSCRAPER_API_URLS = [
  'https://api.outscraper.net',           // Primary - currently working
  'https://api.app.outscraper.com',       // Fallback 1
  'https://api.app.outscraper.cloud',     // Fallback 2
];

const SEARCH_ENDPOINT = '/maps/search-v3';
const REVIEWS_ENDPOINT = '/maps/reviews-v3';

// Rate limiting configuration for Outscraper API
const SEARCH_API_TIMEOUT_MS = 30000; // 30 seconds for search
const REVIEWS_API_TIMEOUT_MS = 20000; // 20 seconds (reduced from 45s)

// Retry options optimized for serverless DNS issues
// DNS failures need longer delays to allow resolution to recover
const SEARCH_RETRY_OPTIONS: Partial<RetryOptions> = {
  maxRetries: 3,        // 4 total attempts
  baseDelayMs: 2000,    // Start with 2s delay
  maxDelayMs: 8000,     // Cap at 8s
  jitterMs: 500,        // Add randomness to avoid thundering herd
};
const REVIEWS_RETRY_OPTIONS: Partial<RetryOptions> = {
  maxRetries: 3,        // 4 total attempts
  baseDelayMs: 2000,
  maxDelayMs: 8000,
  jitterMs: 500,
};

// Global semaphore to limit concurrent reviews API calls
const reviewsApiSemaphore = new Semaphore(3); // Max 3 concurrent reviews requests

interface OutscraperRawPlace {
  name?: string;
  place_id?: string;
  google_id?: string;
  full_address?: string;
  address?: string;
  phone?: string;
  site?: string;
  website?: string;
  rating?: number;
  reviews?: number;
  reviews_count?: number;
  type?: string;
  category?: string;
  main_category?: string;
  verified?: boolean;
  is_claimed?: boolean;
  claimed?: boolean;
  is_sponsored?: boolean;
  sponsored?: boolean;
  [key: string]: unknown;
}

export interface ReviewData {
  lastReviewDate: Date | null;
  lastOwnerActivity: Date | null;
  responseRate: number;
  reviewCount: number;
}

interface OutscraperReview {
  review_id?: string;
  author_title?: string;
  review_text?: string;
  review_rating?: number;
  review_datetime_utc?: string;
  review_timestamp?: number;
  owner_answer?: string;
  owner_answer_timestamp?: number;
  owner_answer_timestamp_datetime_utc?: string;
}

interface OutscraperReviewsResponse {
  name?: string;
  place_id?: string;
  reviews_data?: OutscraperReview[];
  [key: string]: unknown;
}

/**
 * Internal function to make a single search API request
 * Tries multiple API URLs for redundancy (like Outscraper's official SDK)
 */
async function searchGoogleMapsInternal(
  searchQuery: string,
  limit: number,
  apiKey: string
): Promise<Business[]> {
  const params = new URLSearchParams({
    query: searchQuery,
    limit: limit.toString(),
    async: 'false',
  });

  let lastError: Error | null = null;

  // Try each API URL in order
  for (const baseUrl of OUTSCRAPER_API_URLS) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), SEARCH_API_TIMEOUT_MS);

    try {
      const url = `${baseUrl}${SEARCH_ENDPOINT}?${params}`;
      console.log(`[Outscraper] Trying: ${baseUrl}`);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'X-API-KEY': apiKey,
          'client': 'TrueSignal',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Outscraper API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();

      // Outscraper returns results in a nested array structure
      const places: OutscraperRawPlace[] = data.data?.[0] || data.data || [];

      console.log(`[Outscraper] Found ${places.length} places via ${baseUrl}`);

      return places.map(parseOutscraperPlace);
    } catch (error) {
      clearTimeout(timeoutId);
      lastError = error instanceof Error ? error : new Error(String(error));

      // Log the failure and try next URL
      console.log(`[Outscraper] Failed with ${baseUrl}: ${lastError.message}`);

      // Continue to next URL unless it's a non-recoverable error (like bad API key)
      if (lastError.message.includes('401') || lastError.message.includes('403')) {
        throw lastError; // Don't retry auth errors
      }
    }
  }

  // All URLs failed
  throw lastError || new Error('All Outscraper API endpoints failed');
}

export async function searchGoogleMaps(
  query: string,
  location: string,
  limit: number = 50
): Promise<Business[]> {
  const apiKey = process.env.OUTSCRAPER_API_KEY;

  if (!apiKey) {
    throw new Error('OUTSCRAPER_API_KEY is not configured');
  }

  const searchQuery = `${query} in ${location}`;
  console.log(`[Outscraper] Searching: ${searchQuery}`);

  // Use retry logic to handle transient network/DNS failures
  return withRetry(
    () => searchGoogleMapsInternal(searchQuery, limit, apiKey),
    SEARCH_RETRY_OPTIONS,
    (attempt, error, delayMs) => {
      console.log(`[Outscraper] Search retry ${attempt} after ${delayMs}ms: ${error.message}`);
    }
  );
}

function parseOutscraperPlace(place: OutscraperRawPlace): Business {
  // Handle various field name possibilities from Outscraper
  const website = place.site || place.website || null;
  const address = place.full_address || place.address || 'Address not available';
  const reviewCount = place.reviews || place.reviews_count || 0;
  const category = place.type || place.category || place.main_category || 'Uncategorized';
  const claimed = place.is_claimed ?? place.claimed ?? place.verified ?? false;
  const sponsored = place.is_sponsored ?? place.sponsored ?? false;

  // Prefer place_id (ChIJ format) over google_id (hex format) for reviews API compatibility
  const placeId = place.place_id || place.google_id || null;

  // Log the IDs we're getting for debugging
  if (place.name) {
    console.log(`[Outscraper] Parsed ${place.name}: place_id=${place.place_id}, google_id=${place.google_id?.substring(0, 30)}`);
  }

  const parsed: Business = {
    name: place.name || 'Unknown Business',
    placeId,
    address,
    phone: place.phone || null,
    website,
    rating: place.rating || 0,
    reviewCount,
    category,
    claimed,
    sponsored,
  };

  return parsed;
}

/**
 * Internal function to make a single reviews API request
 * Tries multiple API URLs for redundancy (like Outscraper's official SDK)
 */
async function fetchReviewsInternal(
  placeIdOrName: string,
  reviewsLimit: number,
  apiKey: string
): Promise<ReviewData> {
  const params = new URLSearchParams({
    query: placeIdOrName,
    reviewsLimit: reviewsLimit.toString(),
    sort: 'newest',
    async: 'false',
  });

  let lastError: Error | null = null;

  // Try each API URL in order
  for (const baseUrl of OUTSCRAPER_API_URLS) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REVIEWS_API_TIMEOUT_MS);

    try {
      const url = `${baseUrl}${REVIEWS_ENDPOINT}?${params}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'X-API-KEY': apiKey,
          'client': 'TrueSignal',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      // Outscraper returns results in various nested structures - handle them all
      let place: OutscraperReviewsResponse | null = null;

      if (data.data?.[0]?.[0]) {
        place = data.data[0][0];
      } else if (data.data?.[0] && !Array.isArray(data.data[0])) {
        place = data.data[0];
      } else if (Array.isArray(data.data) && data.data.length > 0) {
        place = data.data[0];
      } else if (data.reviews_data) {
        place = data;
      }

      if (!place) {
        // Return empty but valid result - no data found
        return {
          lastReviewDate: null,
          lastOwnerActivity: null,
          responseRate: 0,
          reviewCount: 0,
        };
      }

      const reviews = place.reviews_data || [];

      if (reviews.length === 0) {
        return {
          lastReviewDate: null,
          lastOwnerActivity: null,
          responseRate: 0,
          reviewCount: 0,
        };
      }

      // Calculate last review date
      let lastReviewDate: Date | null = null;
      for (const review of reviews) {
        if (review.review_datetime_utc) {
          const reviewDate = new Date(review.review_datetime_utc);
          if (!lastReviewDate || reviewDate > lastReviewDate) {
            lastReviewDate = reviewDate;
          }
        } else if (review.review_timestamp) {
          const reviewDate = new Date(review.review_timestamp * 1000);
          if (!lastReviewDate || reviewDate > lastReviewDate) {
            lastReviewDate = reviewDate;
          }
        }
      }

      // Calculate last owner activity and response rate
      let lastOwnerActivity: Date | null = null;
      let repliedCount = 0;

      for (const review of reviews) {
        if (review.owner_answer && review.owner_answer.trim().length > 0) {
          repliedCount++;

          if (review.owner_answer_timestamp_datetime_utc) {
            const replyDate = new Date(review.owner_answer_timestamp_datetime_utc);
            if (!lastOwnerActivity || replyDate > lastOwnerActivity) {
              lastOwnerActivity = replyDate;
            }
          } else if (review.owner_answer_timestamp) {
            const replyDate = new Date(review.owner_answer_timestamp * 1000);
            if (!lastOwnerActivity || replyDate > lastOwnerActivity) {
              lastOwnerActivity = replyDate;
            }
          }
        }
      }

      const responseRate = reviews.length > 0
        ? Math.round((repliedCount / reviews.length) * 100)
        : 0;

      return {
        lastReviewDate,
        lastOwnerActivity,
        responseRate,
        reviewCount: reviews.length,
      };
    } catch (error) {
      clearTimeout(timeoutId);
      lastError = error instanceof Error ? error : new Error(String(error));

      // Continue to next URL unless it's a non-recoverable error
      if (lastError.message.includes('401') || lastError.message.includes('403')) {
        throw lastError; // Don't retry auth errors
      }
    }
  }

  // All URLs failed
  throw lastError || new Error('All Outscraper API endpoints failed');
}

/**
 * Fetch reviews for a single business with retry logic and rate limiting
 */
export async function fetchBusinessReviews(
  placeIdOrName: string,
  reviewsLimit: number = 20
): Promise<ReviewData> {
  const apiKey = process.env.OUTSCRAPER_API_KEY;

  if (!apiKey) {
    throw new Error('OUTSCRAPER_API_KEY is not configured');
  }

  const defaultResult: ReviewData = {
    lastReviewDate: null,
    lastOwnerActivity: null,
    responseRate: 0,
    reviewCount: 0,
  };

  // Use semaphore to limit concurrent requests
  return reviewsApiSemaphore.withPermit(async () => {
    try {
      console.log(`[Outscraper Reviews] Fetching reviews for: ${placeIdOrName}`);

      const result = await withRetry(
        () => fetchReviewsInternal(placeIdOrName, reviewsLimit, apiKey),
        REVIEWS_RETRY_OPTIONS,
        (attempt, error, delayMs) => {
          console.log(`[Outscraper Reviews] Retry ${attempt} for ${placeIdOrName} after ${delayMs}ms: ${error.message}`);
        }
      );

      console.log(`[Outscraper Reviews] Success for ${placeIdOrName}: responseRate=${result.responseRate}%`);
      return result;

    } catch (error) {
      console.error(`[Outscraper Reviews] All retries failed for ${placeIdOrName}:`, error);
      return defaultResult;
    }
  });
}

/**
 * Fetch reviews for multiple businesses in parallel with controlled concurrency
 * This is more efficient than calling fetchBusinessReviews individually
 */
export async function fetchBatchReviews(
  businesses: Array<{ id: string; query: string }>,
  reviewsLimit: number = 5,
  onProgress?: (completed: number, total: number, businessId: string, success: boolean) => void
): Promise<Map<string, ReviewData>> {
  const apiKey = process.env.OUTSCRAPER_API_KEY;

  if (!apiKey) {
    throw new Error('OUTSCRAPER_API_KEY is not configured');
  }

  const results = new Map<string, ReviewData>();
  const defaultResult: ReviewData = {
    lastReviewDate: null,
    lastOwnerActivity: null,
    responseRate: 0,
    reviewCount: 0,
  };

  console.log(`[Outscraper Reviews] Batch fetching reviews for ${businesses.length} businesses`);

  // Process all businesses with controlled concurrency via semaphore
  let completedCount = 0;

  const promises = businesses.map(async ({ id, query }) => {
    return reviewsApiSemaphore.withPermit(async () => {
      // Add small staggered delay to avoid burst requests
      await sleep(Math.random() * 300);

      try {
        const result = await withRetry(
          () => fetchReviewsInternal(query, reviewsLimit, apiKey),
          REVIEWS_RETRY_OPTIONS,
          (attempt, error, delayMs) => {
            console.log(`[Outscraper Reviews] Retry ${attempt} for ${id} after ${delayMs}ms: ${error.message}`);
          }
        );

        results.set(id, result);
        completedCount++;
        onProgress?.(completedCount, businesses.length, id, true);
        console.log(`[Outscraper Reviews] ✓ ${id} (${completedCount}/${businesses.length})`);

      } catch (error) {
        console.error(`[Outscraper Reviews] ✗ ${id}: All retries failed`);
        results.set(id, defaultResult);
        completedCount++;
        onProgress?.(completedCount, businesses.length, id, false);
      }

      // Throttle between requests within semaphore
      await sleep(500 + Math.random() * 500); // 500-1000ms between requests
    });
  });

  await Promise.all(promises);

  console.log(`[Outscraper Reviews] Batch complete: ${results.size}/${businesses.length} succeeded`);
  return results;
}
