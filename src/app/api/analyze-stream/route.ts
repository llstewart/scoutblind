import { NextRequest } from 'next/server';
import { AnalyzeRequest, EnrichedBusiness, Business } from '@/lib/types';
import { analyzeWebsite } from '@/lib/website-analyzer';
import { batchCheckVisibility } from '@/lib/openai';
import { fetchBatchReviews, ReviewData } from '@/lib/outscraper';
import { classifyLocationType } from '@/utils/address';
import { Semaphore, sleep } from '@/lib/rate-limiter';

// Configuration
const FIRST_PAGE_SIZE = 20; // Prioritize first page for fast initial load
const BATCH_SIZE = 5;

function calculateDaysDormant(lastOwnerActivity: Date | null): number | null {
  if (!lastOwnerActivity) return null;
  const now = new Date();
  const diffTime = now.getTime() - lastOwnerActivity.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

// Semaphore for website analysis (separate from reviews API)
const websiteAnalysisSemaphore = new Semaphore(5);

// Helper to process a batch of businesses
async function processBatch(
  businesses: Business[],
  startIndex: number,
  reviewResults: Map<string, ReviewData>,
  visibilityResults: Map<string, boolean>,
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder,
  completedCount: { value: number },
  totalBusinesses: number
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
        const searchVisibility = visibilityResults.get(business.name) || false;
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
        console.error(`[Stream API] Error processing ${business.name}:`, error);
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
          searchVisibility: visibilityResults.get(business.name) || false,
          responseRate: reviewData.responseRate,
          locationType: classifyLocationType(business.address),
          websiteTech: 'Analysis Failed',
          seoOptimized: false,
        };

        return { success: false, business: enrichedBusiness, index: globalIndex };
      }
    });
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
  }
}

export async function POST(request: NextRequest) {
  const body: AnalyzeRequest = await request.json();

  if (!body.businesses || !Array.isArray(body.businesses)) {
    return new Response(JSON.stringify({ error: 'Businesses array is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const totalBusinesses = body.businesses.length;
        const firstPageCount = Math.min(FIRST_PAGE_SIZE, totalBusinesses);
        const hasMorePages = totalBusinesses > FIRST_PAGE_SIZE;

        console.log(`[Stream API] Starting prioritized analysis: ${firstPageCount} first page, ${totalBusinesses} total`);

        // Split businesses into first page (priority) and rest
        const firstPageBusinesses = body.businesses.slice(0, FIRST_PAGE_SIZE);
        const remainingBusinesses = body.businesses.slice(FIRST_PAGE_SIZE);

        // Phase 1: Quick visibility check for ALL businesses (single API call)
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: 'status',
          message: 'Checking search visibility...',
          phase: 1,
          totalPhases: 3
        })}\n\n`));

        const visibilityResults = await batchCheckVisibility(
          body.businesses,
          body.niche,
          body.location
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

        const completedCount = { value: 0 };

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
            totalBusinesses
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
              totalBusinesses
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
          message: `Analysis complete: ${completedCount.value}/${totalBusinesses} businesses processed`
        })}\n\n`));
        controller.close();

      } catch (error) {
        console.error('[Stream API] Fatal error:', error);
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({
            type: 'error',
            message: error instanceof Error ? error.message : 'Unknown error',
            recoverable: false
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
