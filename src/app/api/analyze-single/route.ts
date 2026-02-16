import { NextRequest, NextResponse } from 'next/server';
import { Business, EnrichedBusiness } from '@/lib/types';
import { analyzeWebsite } from '@/lib/website-analyzer';
import { checkSearchVisibility } from '@/lib/visibility';
import { fetchBusinessReviews, ReviewData } from '@/lib/outscraper';
import { classifyLocationType } from '@/utils/address';
import Cache, { cache, CACHE_TTL } from '@/lib/cache';
import { checkRateLimit, checkUserRateLimit } from '@/lib/api-rate-limit';
import { createClient } from '@/lib/supabase/server';
import { deductCredits } from '@/lib/credits';

interface AnalyzeSingleRequest {
  business: Business;
  niche: string;
  location: string;
}

interface WebsiteAnalysisResult {
  cms: string | null;
  seoOptimized: boolean;
  ownerName: string | null;
  ownerPhone: string | null;
  techStack: string;
}

function calculateDaysDormant(lastOwnerActivity: Date | string | null): number | null {
  if (!lastOwnerActivity) return null;
  const dateObj = typeof lastOwnerActivity === 'string'
    ? new Date(lastOwnerActivity)
    : lastOwnerActivity;
  if (isNaN(dateObj.getTime())) return null;
  const now = new Date();
  const diffTime = now.getTime() - dateObj.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

export async function POST(request: NextRequest) {
  // Check rate limit
  const rateLimitResponse = await checkRateLimit(request, 'analyze');
  if (rateLimitResponse) return rateLimitResponse;

  // Require authentication
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({
      error: 'Authentication required',
      requiresAuth: true
    }, { status: 401 });
  }

  // Per-user rate limit
  const userRateLimitResponse = await checkUserRateLimit(user.id, 'analyze');
  if (userRateLimitResponse) return userRateLimitResponse;

  // Check subscription tier - only paid users can analyze
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('tier, credits_remaining, credits_purchased')
    .eq('user_id', user.id)
    .single();

  if (!subscription || subscription.tier === 'free') {
    return NextResponse.json({
      error: 'Upgrade to unlock Lead Intel features',
      requiresUpgrade: true
    }, { status: 403 });
  }

  // Validate credits (need at least 1)
  const totalCredits = (subscription.credits_remaining || 0) + (subscription.credits_purchased || 0);
  if (totalCredits < 1) {
    return NextResponse.json({
      error: 'Insufficient credits. You have 0 credits but need 1.',
      insufficientCredits: true,
      creditsRemaining: 0,
      creditsRequired: 1
    }, { status: 402 });
  }

  // CRITICAL: Deduct credit SERVER-SIDE before starting analysis
  const deductResult = await deductCredits(
    user.id,
    1,
    'Single business analysis (Business Lookup)'
  );

  if (!deductResult.success) {
    return NextResponse.json({
      error: deductResult.error || 'Failed to deduct credit',
      insufficientCredits: true,
      creditsRemaining: deductResult.creditsRemaining,
      creditsRequired: 1
    }, { status: 402 });
  }

  console.log(`[Analyze Single] Deducted 1 credit for user ${user.id.slice(0, 8)} (${deductResult.creditsRemaining} remaining)`);

  try {
    const body: AnalyzeSingleRequest = await request.json();

    if (!body.business || !body.niche || !body.location) {
      return NextResponse.json(
        { error: 'Business, niche, and location are required' },
        { status: 400 }
      );
    }

    const { business, niche, location } = body;
    console.log(`[Analyze Single] Starting analysis for: ${business.name}`);

    // Run all enrichment in parallel
    const [visibilityResult, reviewData, websiteAnalysis] = await Promise.all([
      // Check visibility (with cache) - returns rank position or null
      (async (): Promise<number | null> => {
        const cacheKey = Cache.visibilityKey(niche, location);
        // Use Record instead of Map (Maps don't serialize properly to JSON)
        const cachedVisibility = await cache.get<Record<string, number | null>>(cacheKey);

        if (cachedVisibility && business.name in cachedVisibility) {
          console.log(`[Analyze Single] Visibility cache HIT for ${business.name}`);
          return cachedVisibility[business.name] ?? null;
        }

        console.log(`[Analyze Single] Checking visibility for ${business.name}`);
        const result = await checkSearchVisibility(business.name, niche, location);
        return result;
      })(),

      // Fetch reviews (with cache)
      (async (): Promise<ReviewData> => {
        const query = business.placeId || `${business.name}, ${business.address}`;
        const cacheKey = Cache.reviewsKey(query);
        const cachedReviews = await cache.get<ReviewData>(cacheKey);

        if (cachedReviews) {
          console.log(`[Analyze Single] Reviews cache HIT for ${business.name}`);
          return cachedReviews;
        }

        console.log(`[Analyze Single] Fetching reviews for ${business.name}`);
        const result = await fetchBusinessReviews(query, 10);
        await cache.set(cacheKey, result, CACHE_TTL.REVIEWS);
        return result;
      })(),

      // Analyze website (with cache)
      (async (): Promise<WebsiteAnalysisResult> => {
        if (!business.website) {
          return {
            cms: null,
            seoOptimized: false,
            ownerName: null,
            ownerPhone: null,
            techStack: 'No Website',
          };
        }

        const cacheKey = `website:${business.website}`;
        const cachedAnalysis = await cache.get<WebsiteAnalysisResult>(cacheKey);

        if (cachedAnalysis) {
          console.log(`[Analyze Single] Website cache HIT for ${business.name}`);
          return cachedAnalysis;
        }

        console.log(`[Analyze Single] Analyzing website for ${business.name}`);
        const result = await analyzeWebsite(business.website);
        await cache.set(cacheKey, result, CACHE_TTL.WEBSITE_ANALYSIS);
        return result;
      })(),
    ]);

    const enrichedBusiness: EnrichedBusiness = {
      ...business,
      ownerName: websiteAnalysis.ownerName,
      ownerPhone: websiteAnalysis.ownerPhone,
      lastReviewDate: reviewData.lastReviewDate,
      lastOwnerActivity: reviewData.lastOwnerActivity,
      daysDormant: calculateDaysDormant(reviewData.lastOwnerActivity),
      searchVisibility: visibilityResult,
      responseRate: reviewData.responseRate,
      locationType: classifyLocationType(business.address),
      websiteTech: websiteAnalysis.techStack,
      seoOptimized: websiteAnalysis.seoOptimized,
    };

    console.log(`[Analyze Single] Completed analysis for: ${business.name}`);

    return NextResponse.json({
      success: true,
      business: enrichedBusiness,
      creditsDeducted: 1,
      creditsRemaining: deductResult.creditsRemaining,
    });
  } catch (error) {
    console.error('[Analyze Single] Error:', error);

    const message = error instanceof Error ? error.message : 'An unexpected error occurred';

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
