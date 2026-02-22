import { NextRequest, NextResponse } from 'next/server';
import { Business, EnrichedBusiness } from '@/lib/types';
import { analyzeWebsite } from '@/lib/website-analyzer';
import { batchCheckVisibility } from '@/lib/visibility';
import { fetchBatchReviews, ReviewData } from '@/lib/outscraper';
import { classifyLocationType } from '@/utils/address';
import Cache, { cache, CACHE_TTL } from '@/lib/cache';
import { Semaphore, sleep } from '@/lib/rate-limiter';
import { checkRateLimit, checkUserRateLimit } from '@/lib/api-rate-limit';
import { createClient } from '@/lib/supabase/server';
import { deductCredits } from '@/lib/credits';
import { sanitizeErrorMessage } from '@/lib/errors';
import { upsertLeadFireAndForget } from '@/lib/leads';

interface AnalyzeSelectedRequest {
  businesses: Business[];
  niche: string;
  location: string;
}

const BATCH_SIZE = 5;
const websiteAnalysisSemaphore = new Semaphore(5);

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
    return new Response(JSON.stringify({
      error: 'Authentication required',
      requiresAuth: true
    }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
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
    return new Response(JSON.stringify({
      error: 'Upgrade to unlock Lead Intel features',
      requiresUpgrade: true
    }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const body: AnalyzeSelectedRequest = await request.json();

  if (!body.businesses || !Array.isArray(body.businesses) || body.businesses.length === 0) {
    return new Response(JSON.stringify({ error: 'At least one business is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Validate credits before analysis (include both remaining and purchased)
  const requestedCount = body.businesses.length;
  const totalCredits = (subscription.credits_remaining || 0) + (subscription.credits_purchased || 0);
  if (totalCredits < requestedCount) {
    return new Response(JSON.stringify({
      error: `Insufficient credits. You have ${totalCredits} credits but requested ${requestedCount} analyses.`,
      insufficientCredits: true,
      creditsRemaining: totalCredits,
      creditsRequired: requestedCount
    }), {
      status: 402,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // CRITICAL: Deduct credits SERVER-SIDE before starting analysis
  const deductResult = await deductCredits(
    user.id,
    requestedCount,
    `Selected analysis: ${requestedCount} businesses for "${body.niche}" in "${body.location}"`
  );

  if (!deductResult.success) {
    return new Response(JSON.stringify({
      error: deductResult.error || 'Failed to deduct credits',
      insufficientCredits: true,
      creditsRemaining: deductResult.creditsRemaining,
      creditsRequired: requestedCount
    }), {
      status: 402,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  console.log(`[Analyze Selected] Deducted ${requestedCount} credits for user ${user.id.slice(0, 8)} (${deductResult.creditsRemaining} remaining)`);

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const { businesses, niche, location } = body;
        const totalBusinesses = businesses.length;

        console.log(`[Analyze Selected] Starting analysis for ${totalBusinesses} selected businesses`);

        // Immediately notify client that credits were deducted server-side
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: 'started',
          total: totalBusinesses,
          creditsDeducted: requestedCount,
          creditsRemaining: deductResult.creditsRemaining,
          serverSideDeduction: true,
          message: `Starting analysis of ${totalBusinesses} businesses (${requestedCount} credits charged)`
        })}\n\n`));

        // Phase 1: Check visibility (try cache first)
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: 'status',
          message: 'Checking search visibility...',
          phase: 1,
          totalPhases: 3
        })}\n\n`));

        const visibilityCacheKey = Cache.visibilityKey(niche, location);
        // Use Record instead of Map (Maps don't serialize properly to JSON)
        // Value is rank position (1-based) or null if not ranked
        let visibilityResults = await cache.get<Record<string, number | null>>(visibilityCacheKey);

        if (!visibilityResults) {
          const visibilityMap = await batchCheckVisibility(businesses, niche, location);
          // Convert Map to plain object for caching
          visibilityResults = Object.fromEntries(visibilityMap);
          await cache.set(visibilityCacheKey, visibilityResults, CACHE_TTL.VISIBILITY);
          console.log(`[Analyze Selected] Visibility cached for ${niche} in ${location}`);
        } else {
          console.log(`[Analyze Selected] Visibility cache HIT`);
        }

        // Phase 2: Fetch reviews (check cache for each)
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: 'status',
          message: 'Fetching review data...',
          phase: 2,
          totalPhases: 3
        })}\n\n`));

        const reviewResults = new Map<string, ReviewData>();
        const uncachedReviewQueries: Array<{ id: string; query: string; index: number }> = [];

        // Check cache for each business
        for (let index = 0; index < businesses.length; index++) {
          const business = businesses[index];
          const query = business.placeId || `${business.name}, ${business.address}`;
          const cacheKey = Cache.reviewsKey(query);
          const cachedReview = await cache.get<ReviewData>(cacheKey);

          if (cachedReview) {
            reviewResults.set(`${index}`, cachedReview);
          } else {
            uncachedReviewQueries.push({ id: `${index}`, query, index });
          }
        }

        console.log(`[Analyze Selected] Reviews: ${reviewResults.size} cached, ${uncachedReviewQueries.length} to fetch`);

        // Fetch uncached reviews
        if (uncachedReviewQueries.length > 0) {
          const fetchedReviews = await fetchBatchReviews(
            uncachedReviewQueries.map(q => ({ id: q.id, query: q.query })),
            5,
            (completed, total) => {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                type: 'progress',
                message: `Fetching reviews: ${completed}/${total}`,
                completed,
                total,
                phase: 2
              })}\n\n`));
            }
          );

          // Cache and merge results
          for (const [id, reviewData] of Array.from(fetchedReviews.entries())) {
            const queryInfo = uncachedReviewQueries.find(q => q.id === id);
            if (queryInfo) {
              await cache.set(Cache.reviewsKey(queryInfo.query), reviewData, CACHE_TTL.REVIEWS);
            }
            reviewResults.set(id, reviewData);
          }
        }

        // Phase 3: Analyze websites and stream results
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: 'status',
          message: 'Analyzing websites...',
          phase: 3,
          totalPhases: 3
        })}\n\n`));

        let completedCount = 0;

        // Process in batches
        for (let i = 0; i < businesses.length; i += BATCH_SIZE) {
          const batch = businesses.slice(i, i + BATCH_SIZE);

          const batchPromises = batch.map(async (business, batchIndex) => {
            const globalIndex = i + batchIndex;

            return websiteAnalysisSemaphore.withPermit(async () => {
              // Define the website analysis type
              type WebsiteAnalysisResult = {
                cms: string | null;
                seoOptimized: boolean;
                ownerName: string | null;
                ownerPhone: string | null;
                techStack: string;
              };

              // Check website cache
              let websiteAnalysis: WebsiteAnalysisResult;
              if (business.website) {
                const websiteCacheKey = `website:${business.website}`;
                const cached = await cache.get<WebsiteAnalysisResult>(websiteCacheKey);

                if (cached) {
                  websiteAnalysis = cached;
                } else {
                  websiteAnalysis = await analyzeWebsite(business.website);
                  await cache.set(websiteCacheKey, websiteAnalysis, CACHE_TTL.WEBSITE_ANALYSIS);
                }
              } else {
                websiteAnalysis = {
                  cms: null,
                  seoOptimized: false,
                  ownerName: null,
                  ownerPhone: null,
                  techStack: 'No Website',
                };
              }

              const reviewData = reviewResults.get(`${globalIndex}`) || {
                lastReviewDate: null,
                lastOwnerActivity: null,
                responseRate: 0,
                reviewCount: 0,
              };

              const enrichedBusiness: EnrichedBusiness = {
                ...business,
                ownerName: websiteAnalysis.ownerName,
                ownerPhone: websiteAnalysis.ownerPhone,
                lastReviewDate: reviewData.lastReviewDate,
                lastOwnerActivity: reviewData.lastOwnerActivity,
                daysDormant: calculateDaysDormant(reviewData.lastOwnerActivity),
                searchVisibility: visibilityResults?.[business.name] ?? null,
                responseRate: reviewData.responseRate,
                locationType: classifyLocationType(business.address),
                websiteTech: websiteAnalysis.techStack,
                seoOptimized: websiteAnalysis.seoOptimized,
              };

              return enrichedBusiness;
            });
          });

          const batchResults = await Promise.all(batchPromises);

          // Stream each result
          for (const enrichedBusiness of batchResults) {
            completedCount++;
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              type: 'business',
              business: enrichedBusiness,
              success: true,
              progress: { completed: completedCount, total: totalBusinesses }
            })}\n\n`));
            upsertLeadFireAndForget(user.id, enrichedBusiness, niche, location);
          }

          if (i + BATCH_SIZE < businesses.length) {
            await sleep(200);
          }
        }

        // Complete
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: 'complete',
          total: completedCount,
          message: `Analysis complete: ${completedCount} businesses processed`,
          creditsDeducted: requestedCount,
          creditsRemaining: deductResult.creditsRemaining,
          serverSideDeduction: true
        })}\n\n`));
        controller.close();

      } catch (error) {
        console.error('[Analyze Selected] Error:', error);
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: 'error',
          message: sanitizeErrorMessage(error, 'Analysis failed. Please try again.')
        })}\n\n`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
