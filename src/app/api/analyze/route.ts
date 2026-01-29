import { NextRequest, NextResponse } from 'next/server';
import { AnalyzeRequest, AnalyzeResponse, EnrichedBusiness, Business } from '@/lib/types';
import { analyzeWebsite } from '@/lib/website-analyzer';
import { batchCheckVisibility } from '@/lib/visibility';
import { classifyLocationType } from '@/utils/address';
import { fetchBatchReviews, ReviewData } from '@/lib/outscraper';
import { Semaphore, sleep } from '@/lib/rate-limiter';

// Configuration
const ENABLE_REVIEWS_API = true; // Set to true to enable reviews fetching
const WEBSITE_ANALYSIS_CONCURRENCY = 5;
const BATCH_SIZE = 5;
const BATCH_DELAY_MS = 500;

// Semaphore for website analysis
const websiteAnalysisSemaphore = new Semaphore(WEBSITE_ANALYSIS_CONCURRENCY);

function calculateDaysDormant(lastOwnerActivity: Date | null): number | null {
  if (!lastOwnerActivity) {
    return null;
  }
  const now = new Date();
  const diffTime = now.getTime() - lastOwnerActivity.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

export async function POST(request: NextRequest) {
  try {
    const body: AnalyzeRequest = await request.json();

    if (!body.businesses || !Array.isArray(body.businesses)) {
      return NextResponse.json(
        { error: 'Businesses array is required' },
        { status: 400 }
      );
    }

    if (!body.niche || !body.location) {
      return NextResponse.json(
        { error: 'Niche and location are required' },
        { status: 400 }
      );
    }

    const totalBusinesses = body.businesses.length;
    console.log(`[Analyze API] Starting analysis for ${totalBusinesses} businesses`);

    // Phase 1: Check visibility for all businesses (single API call)
    console.log(`[Analyze API] Phase 1: Checking search visibility...`);
    const visibilityResults = await batchCheckVisibility(
      body.businesses,
      body.niche,
      body.location
    );
    console.log(`[Analyze API] Visibility check complete`);

    // Phase 2: Fetch reviews if enabled (with internal rate limiting)
    let reviewResults: Map<string, ReviewData> = new Map();

    if (ENABLE_REVIEWS_API) {
      console.log(`[Analyze API] Phase 2: Fetching reviews for ${totalBusinesses} businesses...`);

      const reviewQueries = body.businesses.map((business: Business, index: number) => ({
        id: `${index}`,
        query: business.placeId || `${business.name}, ${business.address}`,
      }));

      reviewResults = await fetchBatchReviews(
        reviewQueries,
        5, // reviewsLimit per business
        (completed, total) => {
          if (completed % 10 === 0 || completed === total) {
            console.log(`[Analyze API] Reviews progress: ${completed}/${total}`);
          }
        }
      );

      console.log(`[Analyze API] Reviews fetching complete`);
    } else {
      console.log(`[Analyze API] Phase 2: Skipping reviews (disabled)`);
    }

    // Phase 3: Process businesses with website analysis
    console.log(`[Analyze API] Phase 3: Analyzing websites...`);
    const enrichedBusinesses: EnrichedBusiness[] = [];

    for (let i = 0; i < body.businesses.length; i += BATCH_SIZE) {
      const batch = body.businesses.slice(i, i + BATCH_SIZE);
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(body.businesses.length / BATCH_SIZE);
      console.log(`[Analyze API] Processing batch ${batchNum}/${totalBatches}`);

      const batchResults = await Promise.all(
        batch.map(async (business: Business, batchIndex: number) => {
          const globalIndex = i + batchIndex;

          return websiteAnalysisSemaphore.withPermit(async () => {
            try {
              // Website analysis
              const websiteAnalysis = business.website
                ? await analyzeWebsite(business.website)
                : {
                    cms: null,
                    seoOptimized: false,
                    ownerName: null,
                    ownerPhone: null,
                    techStack: 'No Website',
                  };

              // Get review data
              const reviewData: ReviewData = reviewResults.get(`${globalIndex}`) || {
                lastReviewDate: null,
                lastOwnerActivity: null,
                responseRate: 0,
                reviewCount: business.reviewCount || 0,
              };

              const locationType = classifyLocationType(business.address);
              const searchVisibility = visibilityResults.get(business.name) || false;
              const daysDormant = calculateDaysDormant(reviewData.lastOwnerActivity);

              return {
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
            } catch (error) {
              console.error(`[Analyze API] Error processing ${business.name}:`, error);

              // Return with defaults on error - never skip
              const reviewData: ReviewData = reviewResults.get(`${globalIndex}`) || {
                lastReviewDate: null,
                lastOwnerActivity: null,
                responseRate: 0,
                reviewCount: business.reviewCount || 0,
              };

              return {
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
            }
          });
        })
      );

      enrichedBusinesses.push(...batchResults);

      // Throttle between batches
      if (i + BATCH_SIZE < body.businesses.length) {
        await sleep(BATCH_DELAY_MS + Math.random() * 200);
      }
    }

    console.log(`[Analyze API] Analysis complete for ${enrichedBusinesses.length}/${totalBusinesses} businesses`);

    const response: AnalyzeResponse = {
      enrichedBusinesses,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Analyze API error:', error);

    const message = error instanceof Error ? error.message : 'An unexpected error occurred';

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
