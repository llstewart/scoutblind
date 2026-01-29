import { NextRequest } from 'next/server';
import { Business, EnrichedBusiness } from '@/lib/types';
import { analyzeWebsite } from '@/lib/website-analyzer';
import { batchCheckVisibility } from '@/lib/openai';
import { fetchBatchReviews, ReviewData } from '@/lib/outscraper';
import { classifyLocationType } from '@/utils/address';
import { cache, CACHE_TTL } from '@/lib/cache';
import MemoryCache from '@/lib/cache';
import { Semaphore, sleep } from '@/lib/rate-limiter';

interface AnalyzeSelectedRequest {
  businesses: Business[];
  niche: string;
  location: string;
}

const BATCH_SIZE = 5;
const websiteAnalysisSemaphore = new Semaphore(5);

function calculateDaysDormant(lastOwnerActivity: Date | null): number | null {
  if (!lastOwnerActivity) return null;
  const now = new Date();
  const diffTime = now.getTime() - lastOwnerActivity.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

export async function POST(request: NextRequest) {
  const body: AnalyzeSelectedRequest = await request.json();

  if (!body.businesses || !Array.isArray(body.businesses) || body.businesses.length === 0) {
    return new Response(JSON.stringify({ error: 'At least one business is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const { businesses, niche, location } = body;
        const totalBusinesses = businesses.length;

        console.log(`[Analyze Selected] Starting analysis for ${totalBusinesses} selected businesses`);

        // Phase 1: Check visibility (try cache first)
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: 'status',
          message: 'Checking search visibility...',
          phase: 1,
          totalPhases: 3
        })}\n\n`));

        const visibilityCacheKey = MemoryCache.visibilityKey(niche, location);
        let visibilityResults = cache.get<Map<string, boolean>>(visibilityCacheKey);

        if (!visibilityResults) {
          visibilityResults = await batchCheckVisibility(businesses, niche, location);
          cache.set(visibilityCacheKey, visibilityResults, CACHE_TTL.VISIBILITY);
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
        businesses.forEach((business, index) => {
          const query = business.placeId || `${business.name}, ${business.address}`;
          const cacheKey = MemoryCache.reviewsKey(query);
          const cachedReview = cache.get<ReviewData>(cacheKey);

          if (cachedReview) {
            reviewResults.set(`${index}`, cachedReview);
          } else {
            uncachedReviewQueries.push({ id: `${index}`, query, index });
          }
        });

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
          fetchedReviews.forEach((reviewData, id) => {
            const queryInfo = uncachedReviewQueries.find(q => q.id === id);
            if (queryInfo) {
              cache.set(MemoryCache.reviewsKey(queryInfo.query), reviewData, CACHE_TTL.REVIEWS);
            }
            reviewResults.set(id, reviewData);
          });
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
                const cached = cache.get<WebsiteAnalysisResult>(websiteCacheKey);

                if (cached) {
                  websiteAnalysis = cached;
                } else {
                  websiteAnalysis = await analyzeWebsite(business.website);
                  cache.set(websiteCacheKey, websiteAnalysis, CACHE_TTL.WEBSITE_ANALYSIS);
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
                searchVisibility: visibilityResults?.get(business.name) || false,
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
          }

          if (i + BATCH_SIZE < businesses.length) {
            await sleep(200);
          }
        }

        // Complete
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: 'complete',
          total: completedCount,
          message: `Analysis complete: ${completedCount} businesses processed`
        })}\n\n`));
        controller.close();

      } catch (error) {
        console.error('[Analyze Selected] Error:', error);
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: 'error',
          message: error instanceof Error ? error.message : 'Unknown error'
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
