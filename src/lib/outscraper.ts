import { Business } from './types';

const OUTSCRAPER_SEARCH_URL = 'https://api.app.outscraper.com/maps/search-v3';
const OUTSCRAPER_REVIEWS_URL = 'https://api.app.outscraper.com/maps/reviews-v3';

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

  const params = new URLSearchParams({
    query: searchQuery,
    limit: limit.toString(),
    async: 'false',
  });

  console.log(`[Outscraper] Searching: ${searchQuery}`);

  const response = await fetch(`${OUTSCRAPER_SEARCH_URL}?${params}`, {
    method: 'GET',
    headers: {
      'X-API-KEY': apiKey,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Outscraper API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();

  // Outscraper returns results in a nested array structure
  const places: OutscraperRawPlace[] = data.data?.[0] || data.data || [];

  console.log(`[Outscraper] Found ${places.length} places`);

  return places.map(parseOutscraperPlace);
}

function parseOutscraperPlace(place: OutscraperRawPlace): Business {
  // Handle various field name possibilities from Outscraper
  const website = place.site || place.website || null;
  const address = place.full_address || place.address || 'Address not available';
  const reviewCount = place.reviews || place.reviews_count || 0;
  const category = place.type || place.category || place.main_category || 'Uncategorized';
  const claimed = place.is_claimed ?? place.claimed ?? place.verified ?? false;
  const sponsored = place.is_sponsored ?? place.sponsored ?? false;
  const placeId = place.place_id || place.google_id || null;

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

  try {
    const params = new URLSearchParams({
      query: placeIdOrName,
      reviewsLimit: reviewsLimit.toString(),
      sort: 'newest',
      async: 'false',
    });

    console.log(`[Outscraper Reviews] Fetching reviews for: ${placeIdOrName}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

    const response = await fetch(`${OUTSCRAPER_REVIEWS_URL}?${params}`, {
      method: 'GET',
      headers: {
        'X-API-KEY': apiKey,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(`[Outscraper Reviews] Error: ${response.status}`);
      return defaultResult;
    }

    const data = await response.json();

    // Outscraper returns results in a nested array structure
    const results: OutscraperReviewsResponse[] = data.data?.[0] || data.data || [];

    if (!results || results.length === 0) {
      console.log(`[Outscraper Reviews] No results for: ${placeIdOrName}`);
      return defaultResult;
    }

    const place = results[0];
    const reviews = place.reviews_data || [];

    console.log(`[Outscraper Reviews] Got ${reviews.length} reviews for: ${placeIdOrName}`);

    if (reviews.length === 0) {
      return defaultResult;
    }

    // Calculate last review date (reviews should be sorted by newest)
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

        // Get owner reply date
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

    const result: ReviewData = {
      lastReviewDate,
      lastOwnerActivity,
      responseRate,
      reviewCount: reviews.length,
    };

    console.log(`[Outscraper Reviews] Result for ${placeIdOrName}: lastReview=${lastReviewDate?.toISOString()}, lastOwnerActivity=${lastOwnerActivity?.toISOString()}, responseRate=${responseRate}%`);

    return result;

  } catch (error) {
    console.error(`[Outscraper Reviews] Failed for ${placeIdOrName}:`, error);
    return defaultResult;
  }
}
