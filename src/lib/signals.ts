import { Business, OutscraperReview, OutscraperPost, EnrichedBusiness } from './types';

// --- Categorized signal types ---
export type SignalCategory = 'gbp' | 'rank' | 'web' | 'rep';

export interface SignalGroup {
  category: SignalCategory;
  label: string;
  signals: string[];
}

export interface CategorizedSignals {
  groups: SignalGroup[];
  totalCount: number;
}

export const SIGNAL_CATEGORY_COLORS: Record<SignalCategory, { bg: string; text: string; border: string }> = {
  gbp:  { bg: 'bg-sky-500/10',    text: 'text-sky-400',    border: 'border-sky-500/20' },
  rank: { bg: 'bg-amber-500/10',  text: 'text-amber-400',  border: 'border-amber-500/20' },
  web:  { bg: 'bg-violet-500/10', text: 'text-violet-400', border: 'border-violet-500/20' },
  rep:  { bg: 'bg-rose-500/10',   text: 'text-rose-400',   border: 'border-rose-500/20' },
};

export const SIGNAL_CATEGORY_LABELS: Record<SignalCategory, string> = {
  gbp:  'GBP',
  rank: 'Rank',
  web:  'Web',
  rep:  'Rep',
};

export function calculateDaysDormant(
  lastOwnerActivity: Date | string | null
): number | null {
  if (!lastOwnerActivity) {
    return null;
  }

  // Handle string dates (from JSON serialization)
  const dateObj = typeof lastOwnerActivity === 'string'
    ? new Date(lastOwnerActivity)
    : lastOwnerActivity;

  // Check if valid date
  if (isNaN(dateObj.getTime())) {
    return null;
  }

  const now = new Date();
  const diffTime = now.getTime() - dateObj.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}

export function calculateResponseRate(reviews: OutscraperReview[]): number {
  if (!reviews || reviews.length === 0) {
    return 0;
  }

  const reviewsWithReplies = reviews.filter(
    review => review.owner_answer && review.owner_answer.trim().length > 0
  );

  return Math.round((reviewsWithReplies.length / reviews.length) * 100);
}

export function getLastReviewDate(reviews: OutscraperReview[]): Date | null {
  if (!reviews || reviews.length === 0) {
    return null;
  }

  const sortedReviews = [...reviews].sort((a, b) => {
    const dateA = new Date(a.review_datetime_utc);
    const dateB = new Date(b.review_datetime_utc);
    return dateB.getTime() - dateA.getTime();
  });

  const latestReview = sortedReviews[0];

  if (latestReview?.review_datetime_utc) {
    return new Date(latestReview.review_datetime_utc);
  }

  return null;
}

export function getLastOwnerActivity(
  reviews: OutscraperReview[],
  posts: OutscraperPost[]
): Date | null {
  const dates: Date[] = [];

  // Check owner replies in reviews
  if (reviews && reviews.length > 0) {
    for (const review of reviews) {
      if (review.owner_answer_timestamp_datetime_utc) {
        dates.push(new Date(review.owner_answer_timestamp_datetime_utc));
      }
    }
  }

  // Check posts
  if (posts && posts.length > 0) {
    for (const post of posts) {
      if (post.post_datetime_utc) {
        dates.push(new Date(post.post_datetime_utc));
      }
    }
  }

  if (dates.length === 0) {
    return null;
  }

  // Return the most recent date
  return dates.sort((a, b) => b.getTime() - a.getTime())[0];
}

export function isDormant(daysDormant: number | null, threshold: number = 180): boolean {
  if (daysDormant === null) {
    return true; // Consider never updated as dormant
  }

  return daysDormant > threshold;
}

export function getResponseRateStatus(rate: number): 'success' | 'warning' | 'error' {
  if (rate >= 70) {
    return 'success';
  } else if (rate >= 30) {
    return 'warning';
  }
  return 'error';
}

export function getDormancyStatus(daysDormant: number | null): 'success' | 'warning' | 'error' {
  if (daysDormant === null) {
    return 'error';
  }

  if (daysDormant <= 30) {
    return 'success';
  } else if (daysDormant <= 180) {
    return 'warning';
  }
  return 'error';
}

/**
 * Calculate SEO need score for a business.
 * Higher score = more urgently needs SEO services.
 * Score range: 0-100
 */
export function calculateSeoNeedScore(business: EnrichedBusiness): number {
  let score = 0;

  // Search visibility scoring (max 30 points)
  if (business.searchVisibility === null) {
    score += 30; // Not ranked at all
  } else if (business.searchVisibility > 10) {
    score += 22; // Page 2+, effectively invisible
  } else if (business.searchVisibility > 6) {
    score += 15; // Bottom of page 1
  } else if (business.searchVisibility > 3) {
    score += 8;  // Mid-pack
  }
  // Top 3: +0, doing well

  // Days dormant scoring (max 25 points)
  // Only score if data is available (not null)
  if (business.daysDormant !== null) {
    if (business.daysDormant > 365) {
      score += 25;
    } else if (business.daysDormant > 180) {
      score += 20;
    } else if (business.daysDormant > 90) {
      score += 15;
    } else if (business.daysDormant > 30) {
      score += 10;
    }
  }

  // Low response rate scoring (max 15 points)
  // Only score if data is available (responseRate > 0 means we have data)
  if (business.responseRate > 0) {
    if (business.responseRate < 20) {
      score += 12;
    } else if (business.responseRate < 50) {
      score += 8;
    } else if (business.responseRate < 70) {
      score += 4;
    }
  }

  // No website: +10 points
  if (!business.website) {
    score += 10;
  }

  // No SEO optimization: +10 points
  if (!business.seoOptimized) {
    score += 10;
  }

  // Unclaimed profile: +10 points
  if (!business.claimed) {
    score += 10;
  }

  // Lower rating indicates need for reputation management (max 5 points)
  if (business.rating < 3) {
    score += 5;
  } else if (business.rating < 4) {
    score += 3;
  } else if (business.rating < 4.5) {
    score += 1;
  }

  // Few reviews indicates low visibility (max 5 points)
  if (business.reviewCount < 10) {
    score += 5;
  } else if (business.reviewCount < 50) {
    score += 3;
  } else if (business.reviewCount < 100) {
    score += 1;
  }

  return score;
}

/**
 * Calculate basic opportunity score from search-level fields only (no enrichment needed).
 * Higher score = bigger opportunity gap. Score range: 0-100
 */
export function calculateBasicOpportunityScore(business: Business): number {
  let score = 0;

  // Unclaimed profile: +30
  if (!business.claimed) {
    score += 30;
  }

  // No website: +25
  if (!business.website) {
    score += 25;
  }

  // Low rating: up to +20
  if (business.rating === 0) {
    score += 20;
  } else if (business.rating < 3) {
    score += 18;
  } else if (business.rating < 3.5) {
    score += 14;
  } else if (business.rating < 4) {
    score += 10;
  } else if (business.rating < 4.5) {
    score += 5;
  }

  // Few reviews: up to +15
  if (business.reviewCount === 0) {
    score += 15;
  } else if (business.reviewCount < 5) {
    score += 12;
  } else if (business.reviewCount < 20) {
    score += 8;
  } else if (business.reviewCount < 50) {
    score += 4;
  }

  // No phone: +5
  if (!business.phone) {
    score += 5;
  }

  // Not running ads (not sponsored): +5
  if (!business.sponsored) {
    score += 5;
  }

  return Math.min(score, 100);
}

/**
 * Classify opportunity level based on score.
 */
export function getOpportunityLevel(score: number): 'high' | 'medium' | 'low' {
  if (score >= 50) return 'high';
  if (score >= 25) return 'medium';
  return 'low';
}

/**
 * Sort businesses by SEO need (highest need first)
 */
export function sortBySeoPriority(businesses: EnrichedBusiness[]): EnrichedBusiness[] {
  return [...businesses].sort((a, b) => {
    const scoreA = calculateSeoNeedScore(a);
    const scoreB = calculateSeoNeedScore(b);
    return scoreB - scoreA; // Higher score = higher priority = comes first
  });
}

/**
 * Generate a categorized summary of why this business needs SEO services
 * Thresholds aligned with calculateSeoNeedScore for consistency
 */
export function getSeoNeedSummary(business: EnrichedBusiness): CategorizedSignals {
  const gbp: string[] = [];
  const rank: string[] = [];
  const web: string[] = [];
  const rep: string[] = [];

  // --- RANK signals ---
  // Search visibility (up to +30 points in score)
  if (business.searchVisibility === null) {
    rank.push('Not ranking in search');
  } else if (business.searchVisibility > 10) {
    rank.push(`Buried in search (#${business.searchVisibility})`);
  } else if (business.searchVisibility > 6) {
    rank.push(`Low search rank (#${business.searchVisibility})`);
  } else if (business.searchVisibility > 3) {
    rank.push(`Mid-pack rank (#${business.searchVisibility})`);
  }

  // --- GBP signals ---
  // Unclaimed profile (+10 points in score)
  if (!business.claimed) {
    gbp.push('Unclaimed profile');
  }

  // GBP Activity (up to +25 points in score)
  // Note: daysDormant is null when data is unavailable from API
  if (business.daysDormant !== null) {
    if (business.daysDormant > 365) {
      gbp.push(`No review reply in 1+ year`);
    } else if (business.daysDormant > 180) {
      gbp.push(`No review reply in ${business.daysDormant} days`);
    } else if (business.daysDormant > 90) {
      gbp.push(`No review reply in ${business.daysDormant} days`);
    } else if (business.daysDormant > 30) {
      gbp.push(`Last review reply ${business.daysDormant} days ago`);
    }
  }

  // Response rate (up to +15 points in score)
  // Note: responseRate is 0 when data is unavailable from API
  if (business.responseRate > 0) {
    if (business.responseRate < 20) {
      gbp.push(`Rarely replies to reviews (${business.responseRate}%)`);
    } else if (business.responseRate < 50) {
      gbp.push(`Low review reply rate (${business.responseRate}%)`);
    } else if (business.responseRate < 70) {
      gbp.push(`Sometimes replies to reviews (${business.responseRate}%)`);
    }
  }

  // --- WEB signals ---
  // No website
  if (!business.website) {
    web.push('No website');
  }

  // No SEO tools detected (+10 points in score)
  // Only show when business HAS a website but lacks SEO tools
  if (business.website && !business.seoOptimized) {
    web.push('No SEO tools detected');
  }

  // --- REP signals ---
  // Rating (up to +5 points in score)
  if (business.rating > 0 && business.rating < 3) {
    rep.push(`Poor rating (${business.rating})`);
  } else if (business.rating > 0 && business.rating < 4) {
    rep.push(`Below avg rating (${business.rating})`);
  } else if (business.rating > 0 && business.rating < 4.5) {
    rep.push(`Could improve rating (${business.rating})`);
  }

  // Review count (up to +5 points in score)
  if (business.reviewCount < 10) {
    rep.push(`Very few reviews (${business.reviewCount})`);
  } else if (business.reviewCount < 50) {
    rep.push(`Few reviews (${business.reviewCount})`);
  } else if (business.reviewCount < 100) {
    rep.push(`Moderate reviews (${business.reviewCount})`);
  }

  // Build groups (only include non-empty categories)
  const groups: SignalGroup[] = [];
  if (gbp.length > 0) groups.push({ category: 'gbp', label: 'GBP', signals: gbp });
  if (rank.length > 0) groups.push({ category: 'rank', label: 'Rank', signals: rank });
  if (web.length > 0) groups.push({ category: 'web', label: 'Web', signals: web });
  if (rep.length > 0) groups.push({ category: 'rep', label: 'Rep', signals: rep });

  const totalCount = gbp.length + rank.length + web.length + rep.length;

  return { groups, totalCount };
}
