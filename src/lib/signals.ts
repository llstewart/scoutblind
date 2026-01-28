import { OutscraperReview, OutscraperPost, EnrichedBusiness } from './types';

export function calculateDaysDormant(
  lastOwnerActivity: Date | null
): number | null {
  if (!lastOwnerActivity) {
    return null;
  }

  const now = new Date();
  const diffTime = now.getTime() - lastOwnerActivity.getTime();
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

  // Not ranked in search visibility: +30 points (biggest signal)
  if (!business.searchVisibility) {
    score += 30;
  }

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
 * Generate a summary of why this business needs SEO services
 * Thresholds aligned with calculateSeoNeedScore for consistency
 */
export function getSeoNeedSummary(business: EnrichedBusiness): string[] {
  const signals: string[] = [];

  // Not ranked in search visibility (+30 points in score)
  if (!business.searchVisibility) {
    signals.push('Not ranking in search');
  }

  // GBP Activity (up to +25 points in score)
  // Note: daysDormant is null when data is unavailable from API
  if (business.daysDormant !== null) {
    if (business.daysDormant > 365) {
      signals.push(`Dormant 1+ year`);
    } else if (business.daysDormant > 180) {
      signals.push(`Dormant ${business.daysDormant} days`);
    } else if (business.daysDormant > 90) {
      signals.push(`Inactive ${business.daysDormant} days`);
    } else if (business.daysDormant > 30) {
      signals.push(`Slowing activity (${business.daysDormant}d)`);
    }
  }

  // Response rate (up to +15 points in score)
  // Note: responseRate is 0 when data is unavailable from API
  if (business.responseRate > 0) {
    if (business.responseRate < 20) {
      signals.push(`Very low response (${business.responseRate}%)`);
    } else if (business.responseRate < 50) {
      signals.push(`Low response (${business.responseRate}%)`);
    } else if (business.responseRate < 70) {
      signals.push(`Moderate response (${business.responseRate}%)`);
    }
  }

  // No SEO optimization (+10 points in score)
  if (!business.seoOptimized) {
    signals.push('No SEO optimization');
  }

  // Unclaimed profile (+10 points in score)
  if (!business.claimed) {
    signals.push('Unclaimed profile');
  }

  // Rating (up to +5 points in score)
  if (business.rating > 0 && business.rating < 3) {
    signals.push(`Poor rating (${business.rating})`);
  } else if (business.rating > 0 && business.rating < 4) {
    signals.push(`Below avg rating (${business.rating})`);
  } else if (business.rating > 0 && business.rating < 4.5) {
    signals.push(`Could improve rating (${business.rating})`);
  }

  // Review count (up to +5 points in score)
  if (business.reviewCount < 10) {
    signals.push(`Very few reviews (${business.reviewCount})`);
  } else if (business.reviewCount < 50) {
    signals.push(`Few reviews (${business.reviewCount})`);
  } else if (business.reviewCount < 100) {
    signals.push(`Moderate reviews (${business.reviewCount})`);
  }

  // No website
  if (!business.website) {
    signals.push('No website');
  }

  return signals;
}
