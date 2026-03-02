import { NextRequest } from 'next/server';
import { EnrichedBusiness, Business } from '@/lib/types';
import { analyzeSchema } from '@/lib/validations';
import { analyzeWebsite } from '@/lib/website-analyzer';
import { batchCheckVisibility } from '@/lib/visibility';
import { fetchBatchReviews, ReviewData } from '@/lib/outscraper';
import { classifyLocationType } from '@/utils/address';
import { Semaphore, sleep } from '@/lib/rate-limiter';
import { checkRateLimit, checkUserRateLimit } from '@/lib/api-rate-limit';
import { createClient } from '@/lib/supabase/server';
import { deductCredits, refundCredits } from '@/lib/credits';
import { sanitizeErrorMessage } from '@/lib/errors';
import { upsertLeadFireAndForget } from '@/lib/leads';
import { analysisLogger } from '@/lib/logger';

// Configuration
const FIRST_PAGE_SIZE = 20; // Prioritize first page for fast initial load
const BATCH_SIZE = 5;

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

// Semaphore for website analysis (separate from reviews API)
const websiteAnalysisSemaphore = new Semaphore(5);

// Helper to process a batch of businesses
async function processBatch(
  businesses: Business[],
  startIndex: number,
  reviewResults: Map<string, ReviewData>,
  visibilityResults: Map<string, number | null>,
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder,
  completedCount: { value: number },
  totalBusinesses: number,
  userId: string,
  niche: string,
  location: string
): Promise<void> {
  const batchPromises = businesses.map(async (business: Business, batchIndex: number) => {
    const globalIndex = startIndex + batchIndex;

    return websiteAnalysisSemaphore.withPermit(async () => {
      try {
        const websiteAnalysis = business.website
          ? await analyzeWebsite(business.website)
          : {
              cms: null,
              seoOptimized: false,
              ownerName: null,
              ownerPhone: null,
              techStack: 'No Website',
            };

        const reviewData: ReviewData = reviewResults.get(`${globalIndex}`) || {
          lastReviewDate: null,
          lastOwnerActivity: null,
          responseRate: 0,
          reviewCount: 0,
        };

        const locationType = classifyLocationType(business.address);
        const searchVisibility = visibilityResults.get(business.name) ?? null;
        const daysDormant = calculateDaysDormant(reviewData.lastOwnerActivity);

        const enrichedBusiness: EnrichedBusiness = {
          ...business,
          ownerName: websiteAnalysis.ownerName,
          ownerPhone: websiteAnalysis.ownerPhone,
          lastReviewDate: reviewData.lastReviewDate,
          lastOwnerActivity: reviewData.lastOwnerActivity,
          daysDormant,
          searchVisibility,
          responseRate: reviewData.responseRate,
          locationType,
          websiteTech: websiteAnalysis.techStack,
          seoOptimized: websiteAnalysis.seoOptimized,
        };

        return { success: true, business: enrichedBusiness, index: globalIndex };
      } catch (error) {
        analysisLogger.error({ businessName: business.name, err: error }, 'Error processing business in stream');
        const reviewData: ReviewData = reviewResults.get(`${globalIndex}`) || {
          lastReviewDate: null,
          lastOwnerActivity: null,
          responseRate: 0,
          reviewCount: 0,
        };

        const enrichedBusiness: EnrichedBusiness = {
          ...business,
          ownerName: null,
          ownerPhone: null,
          lastReviewDate: reviewData.lastReviewDate,
          lastOwnerActivity: reviewData.lastOwnerActivity,
          daysDormant: calculateDaysDormant(reviewData.lastOwnerActivity),
          searchVisibility: visibilityResults.get(business.name) ?? null,
          responseRate: reviewData.responseRate,
          locationType: classifyLocationType(business.address),
          websiteTech: 'Analysis Failed',
          seoOptimized: false,
        };

        return { success: false, business: enrichedBusiness, index: globalIndex };
      }
    }, 10000);
  });

  const results = await Promise.all(batchPromises);

  for (const result of results) {
    completedCount.value++;
    controller.enqueue(
      encoder.encode(`data: ${JSON.stringify({
        type: 'business',
        business: result.business,
        success: result.success,
        progress: { completed: completedCount.value, total: totalBusinesses }
      })}\n\n`)
    );
    upsertLeadFireAndForget(userId, result.business, niche, location);
  }
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

  const body = await request.json();

  const parsed = analyzeSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: 'Invalid input', details: parsed.error.flatten().fieldErrors }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  const { businesses, niche, location } = parsed.data;

  // Validate credits before analysis (include both remaining and purchased)
  const requestedCount = businesses.length;
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
  // This prevents race conditions where multiple tabs could start analyses simultaneously
  const deductResult = await deductCredits(
    user.id,
    requestedCount,
    `Analysis: ${requestedCount} businesses for "${niche}" in "${location}"`
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

  analysisLogger.info({ userId: user.id.slice(0, 8), creditsDeducted: requestedCount, creditsRemaining: deductResult.creditsRemaining }, 'Credits deducted for stream analysis');

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const completedCount = { value: 0 };
      try {
        const totalBusinesses = businesses.length;
        const firstPageCount = Math.min(FIRST_PAGE_SIZE, totalBusinesses);
        const hasMorePages = totalBusinesses > FIRST_PAGE_SIZE;

        analysisLogger.info({ firstPageCount, totalBusinesses }, 'Starting prioritized stream analysis');

        // Immediately notify client that credits were deducted server-side
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: 'started',
          total: totalBusinesses,
          creditsDeducted: requestedCount,
          creditsRemaining: deductResult.creditsRemaining,
          serverSideDeduction: true,
          message: `Starting analysis of ${totalBusinesses} businesses (${requestedCount} credits charged)`
        })}\n\n`));

        // Split businesses into first page (priority) and rest
        const firstPageBusinesses = businesses.slice(0, FIRST_PAGE_SIZE);
        const remainingBusinesses = businesses.slice(FIRST_PAGE_SIZE);

        // Phase 1: Quick visibility check for ALL businesses (single API call)
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: 'status',
          message: 'Checking search visibility...',
          phase: 1,
          totalPhases: 3
        })}\n\n`));

        const visibilityResults = await batchCheckVisibility(
          businesses,
          niche,
          location
        );

        // Phase 2: Fetch reviews - PRIORITIZE first page
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: 'status',
          message: `Fetching review data (prioritizing first ${firstPageCount})...`,
          phase: 2,
          totalPhases: 3
        })}\n\n`));

        // Prepare review queries - first page first
        const firstPageReviewQueries = firstPageBusinesses.map((business: Business, index: number) => ({
          id: `${index}`,
          query: business.placeId || `${business.name}, ${business.address}`,
        }));

        const remainingReviewQueries = remainingBusinesses.map((business: Business, index: number) => ({
          id: `${FIRST_PAGE_SIZE + index}`,
          query: business.placeId || `${business.name}, ${business.address}`,
        }));

        // Fetch first page reviews first
        let reviewsCompleted = 0;
        const firstPageReviewResults = await fetchBatchReviews(
          firstPageReviewQueries,
          5,
          (completed, total, businessId, success) => {
            reviewsCompleted = completed;
            if (completed % 5 === 0 || completed === total) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                type: 'progress',
                message: `Fetched reviews: ${completed}/${firstPageCount} (first page)`,
                completed,
                total: firstPageCount,
                phase: 2
              })}\n\n`));
            }
          }
        );

        // Combine into single map
        const reviewResults = new Map(firstPageReviewResults);

        // Phase 3: Analyze first page websites IMMEDIATELY
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: 'status',
          message: 'Analyzing first page...',
          phase: 3,
          totalPhases: 3
        })}\n\n`));

        // Process first page in batches
        for (let i = 0; i < firstPageBusinesses.length; i += BATCH_SIZE) {
          const batch = firstPageBusinesses.slice(i, i + BATCH_SIZE);
          await processBatch(
            batch,
            i,
            reviewResults,
            visibilityResults,
            controller,
            encoder,
            completedCount,
            totalBusinesses,
            user.id,
            niche,
            location
          );

          if (i + BATCH_SIZE < firstPageBusinesses.length) {
            await sleep(200 + Math.random() * 100);
          }
        }

        // Signal first page complete
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: 'first_page_complete',
          count: firstPageCount,
          total: totalBusinesses,
          hasMore: hasMorePages,
          message: hasMorePages
            ? `First page ready! Loading ${remainingBusinesses.length} more in background...`
            : 'Analysis complete!'
        })}\n\n`));

        // If there are more businesses, continue in background
        if (hasMorePages && remainingBusinesses.length > 0) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'status',
            message: `Loading remaining ${remainingBusinesses.length} businesses...`,
            phase: 3,
            totalPhases: 3,
            isBackground: true
          })}\n\n`));

          // Fetch remaining reviews
          const remainingReviewResults = await fetchBatchReviews(
            remainingReviewQueries,
            5,
            (completed, total, businessId, success) => {
              if (completed % 10 === 0 || completed === total) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                  type: 'progress',
                  message: `Background: Fetched reviews ${completed}/${total}`,
                  completed: firstPageCount + completed,
                  total: totalBusinesses,
                  phase: 3,
                  isBackground: true
                })}\n\n`));
              }
            }
          );

          // Add to combined results
          remainingReviewResults.forEach((value, key) => {
            reviewResults.set(key, value);
          });

          // Process remaining businesses
          for (let i = 0; i < remainingBusinesses.length; i += BATCH_SIZE) {
            const batch = remainingBusinesses.slice(i, i + BATCH_SIZE);
            await processBatch(
              batch,
              FIRST_PAGE_SIZE + i,
              reviewResults,
              visibilityResults,
              controller,
              encoder,
              completedCount,
              totalBusinesses,
              user.id,
              niche,
              location
            );

            if (i + BATCH_SIZE < remainingBusinesses.length) {
              await sleep(300 + Math.random() * 200);
            }
          }
        }

        // Signal full completion
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: 'complete',
          total: completedCount.value,
          successCount: completedCount.value,
          message: `Analysis complete: ${completedCount.value}/${totalBusinesses} businesses processed`,
          creditsDeducted: requestedCount, // Credits already deducted server-side
          creditsRemaining: deductResult.creditsRemaining,
          serverSideDeduction: true // Flag to indicate client should NOT deduct again
        })}\n\n`));
        controller.close();

      } catch (error) {
        analysisLogger.error({ err: error }, 'Stream analysis fatal error');

        // Refund credits for unprocessed businesses
        const unprocessed = requestedCount - completedCount.value;
        if (unprocessed > 0) {
          try {
            await refundCredits(user.id, unprocessed,
              `Refund: ${unprocessed}/${requestedCount} businesses not processed due to error`);
            analysisLogger.info({ userId: user.id.slice(0, 8), refunded: unprocessed }, 'Refunded credits for unprocessed businesses');
          } catch (refundError) {
            analysisLogger.error({ err: refundError }, 'Failed to refund credits');
          }
        }

        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({
            type: 'error',
            message: sanitizeErrorMessage(error, 'Analysis failed. Please try again.'),
            recoverable: false,
            creditsRefunded: unprocessed > 0 ? unprocessed : 0,
            creditsRemaining: deductResult.creditsRemaining + (unprocessed > 0 ? unprocessed : 0),
          })}\n\n`)
        );
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
