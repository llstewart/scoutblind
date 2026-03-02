import { NextRequest, NextResponse } from 'next/server';
import { Business, EnrichedBusiness } from '@/lib/types';
import { analyzeWebsite } from '@/lib/website-analyzer';
import { checkSearchVisibility } from '@/lib/visibility';
import { fetchBusinessReviews, ReviewData } from '@/lib/outscraper';
import { classifyLocationType } from '@/utils/address';
import Cache, { cache, CACHE_TTL } from '@/lib/cache';
import { checkRateLimit, checkUserRateLimit } from '@/lib/api-rate-limit';
import { createClient } from '@/lib/supabase/server';
import { deductCredits, refundCredits } from '@/lib/credits';
import { analyzeSingleSchema } from '@/lib/validations';
import { analysisLogger } from '@/lib/logger';

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

  analysisLogger.info({ userId: user.id.slice(0, 8), creditsRemaining: deductResult.creditsRemaining }, 'Deducted 1 credit for single analysis');

  try {
    const body = await request.json();

    const parsed = analyzeSingleSchema.safeParse(body);
    if (!parsed.success) {
      // Refund the credit since we can't proceed with invalid input
      try {
        await refundCredits(user.id, 1, 'Refund: invalid request parameters for single analysis');
        analysisLogger.info({ userId: user.id.slice(0, 8) }, 'Refunded 1 credit for invalid params');
      } catch (refundError) {
        analysisLogger.error({ err: refundError }, 'Failed to refund credit');
      }
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { business, niche, location } = parsed.data;
    analysisLogger.info({ businessName: business.name }, 'Starting single analysis');

    // Run all enrichment in parallel
    const [visibilityResult, reviewData, websiteAnalysis] = await Promise.all([
      // Check visibility (with cache) - returns rank position or null
      (async (): Promise<number | null> => {
        const cacheKey = Cache.visibilityKey(niche, location);
        // Use Record instead of Map (Maps don't serialize properly to JSON)
        const cachedVisibility = await cache.get<Record<string, number | null>>(cacheKey);

        if (cachedVisibility && business.name in cachedVisibility) {
          analysisLogger.debug({ businessName: business.name }, 'Visibility cache hit');
          return cachedVisibility[business.name] ?? null;
        }

        analysisLogger.debug({ businessName: business.name }, 'Checking visibility');
        const result = await checkSearchVisibility(business.name, niche, location);
        return result;
      })(),

      // Fetch reviews (with cache)
      (async (): Promise<ReviewData> => {
        const query = business.placeId || `${business.name}, ${business.address}`;
        const cacheKey = Cache.reviewsKey(query);
        const cachedReviews = await cache.get<ReviewData>(cacheKey);

        if (cachedReviews) {
          analysisLogger.debug({ businessName: business.name }, 'Reviews cache hit');
          return cachedReviews;
        }

        analysisLogger.debug({ businessName: business.name }, 'Fetching reviews');
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
          analysisLogger.debug({ businessName: business.name }, 'Website cache hit');
          return cachedAnalysis;
        }

        analysisLogger.debug({ businessName: business.name }, 'Analyzing website');
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

    analysisLogger.info({ businessName: business.name }, 'Single analysis completed');

    return NextResponse.json({
      success: true,
      business: enrichedBusiness,
      creditsDeducted: 1,
      creditsRemaining: deductResult.creditsRemaining,
    });
  } catch (error) {
    analysisLogger.error({ err: error }, 'Single analysis error');

    // Refund the credit since analysis failed
    try {
      await refundCredits(user.id, 1, 'Refund: single business analysis failed due to error');
      analysisLogger.info({ userId: user.id.slice(0, 8) }, 'Refunded 1 credit after error');
    } catch (refundError) {
      analysisLogger.error({ err: refundError }, 'Failed to refund credit after error');
    }

    const message = error instanceof Error ? error.message : 'An unexpected error occurred';

    return NextResponse.json(
      {
        error: message,
        creditsRefunded: 1,
        creditsRemaining: deductResult.creditsRemaining + 1,
      },
      { status: 500 }
    );
  }
}
