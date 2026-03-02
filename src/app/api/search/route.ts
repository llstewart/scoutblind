import { NextRequest, NextResponse } from 'next/server';
import { searchGoogleMaps } from '@/lib/outscraper';
import { SearchResponse, Business } from '@/lib/types';
import Cache, { cache, CACHE_TTL } from '@/lib/cache';
import { checkRateLimit, checkUserRateLimit } from '@/lib/api-rate-limit';
import { createClient } from '@/lib/supabase/server';
import { deductCredits, refundCredits } from '@/lib/credits';
import { sanitizeErrorMessage } from '@/lib/errors';
import { searchSchema } from '@/lib/validations';
import { searchLogger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  // Check rate limit
  const rateLimitResponse = await checkRateLimit(request, 'search');
  if (rateLimitResponse) return rateLimitResponse;

  // Require authentication
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({
      error: 'Authentication required to search',
      requiresAuth: true
    }, { status: 401 });
  }

  // Per-user rate limit
  const userRateLimitResponse = await checkUserRateLimit(user.id, 'search');
  if (userRateLimitResponse) return userRateLimitResponse;

  try {
    const body = await request.json();

    const parsed = searchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const { niche, location } = parsed.data;

    // Check cache first - cached results are FREE (no credit cost)
    const cacheKey = Cache.searchKey(niche, location);
    const cachedResults = await cache.get<Business[]>(cacheKey);

    if (cachedResults) {
      searchLogger.info({ niche, location, cached: true }, 'Search cache hit');
      const response: SearchResponse = {
        businesses: cachedResults,
        totalResults: cachedResults.length,
        cached: true,
        creditsDeducted: 0, // No credit cost for cached results
      };
      return NextResponse.json(response);
    }

    searchLogger.info({ niche, location, cached: false }, 'Search cache miss');

    // CRITICAL: Deduct 1 credit SERVER-SIDE before making API call
    // This prevents the race condition where client could bypass credit deduction
    const deductResult = await deductCredits(
      user.id,
      1,
      `Search: "${niche}" in "${location}"`
    );

    if (!deductResult.success) {
      return NextResponse.json({
        error: deductResult.error || 'Insufficient credits. You need 1 credit to search.',
        insufficientCredits: true,
        creditsRemaining: deductResult.creditsRemaining,
        creditsRequired: 1
      }, { status: 402 });
    }

    searchLogger.info({ userId: user.id.slice(0, 8), creditsRemaining: deductResult.creditsRemaining }, 'Deducted 1 credit for search');

    // Call Outscraper API - if this fails, we need to refund the credit
    let businesses: Business[];
    try {
      businesses = await searchGoogleMaps(niche, location, 25);
    } catch (searchError) {
      // Outscraper failed - refund the credit
      searchLogger.error({ err: searchError }, 'Outscraper failed, refunding credit');
      await refundCredits(
        user.id,
        1,
        `Refund: Search failed for "${niche}" in "${location}"`
      );

      // Re-throw to be caught by outer catch
      throw searchError;
    }

    // Cache the results
    await cache.set(cacheKey, businesses, CACHE_TTL.SEARCH_RESULTS);

    const response: SearchResponse = {
      businesses,
      totalResults: businesses.length,
      cached: false,
      creditsDeducted: 1, // Signal to client that credit was deducted server-side
      creditsRemaining: deductResult.creditsRemaining,
    };

    return NextResponse.json(response);
  } catch (error) {
    searchLogger.error({ err: error }, 'Search API error');

    // Sanitize error message to prevent leaking internal details
    const message = sanitizeErrorMessage(error, 'Search failed. Please try again.');

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
