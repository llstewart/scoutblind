import { NextRequest, NextResponse } from 'next/server';
import { Business, EnrichedBusiness } from '@/lib/types';
import { analyzeWebsite } from '@/lib/website-analyzer';
import { checkSearchVisibility } from '@/lib/openai';
import { fetchBusinessReviews, ReviewData } from '@/lib/outscraper';
import { classifyLocationType } from '@/utils/address';
import { cache, CACHE_TTL } from '@/lib/cache';
import MemoryCache from '@/lib/cache';

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

function calculateDaysDormant(lastOwnerActivity: Date | null): number | null {
  if (!lastOwnerActivity) return null;
  const now = new Date();
  const diffTime = now.getTime() - lastOwnerActivity.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

export async function POST(request: NextRequest) {
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
      // Check visibility (with cache)
      (async () => {
        const cacheKey = MemoryCache.visibilityKey(niche, location);
        const cachedVisibility = cache.get<Map<string, boolean>>(cacheKey);

        if (cachedVisibility && cachedVisibility.has(business.name)) {
          console.log(`[Analyze Single] Visibility cache HIT for ${business.name}`);
          return cachedVisibility.get(business.name) || false;
        }

        console.log(`[Analyze Single] Checking visibility for ${business.name}`);
        const result = await checkSearchVisibility(business.name, niche, location);
        return result;
      })(),

      // Fetch reviews (with cache)
      (async (): Promise<ReviewData> => {
        const query = business.placeId || `${business.name}, ${business.address}`;
        const cacheKey = MemoryCache.reviewsKey(query);
        const cachedReviews = cache.get<ReviewData>(cacheKey);

        if (cachedReviews) {
          console.log(`[Analyze Single] Reviews cache HIT for ${business.name}`);
          return cachedReviews;
        }

        console.log(`[Analyze Single] Fetching reviews for ${business.name}`);
        const result = await fetchBusinessReviews(query, 10);
        cache.set(cacheKey, result, CACHE_TTL.REVIEWS);
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
        const cachedAnalysis = cache.get<WebsiteAnalysisResult>(cacheKey);

        if (cachedAnalysis) {
          console.log(`[Analyze Single] Website cache HIT for ${business.name}`);
          return cachedAnalysis;
        }

        console.log(`[Analyze Single] Analyzing website for ${business.name}`);
        const result = await analyzeWebsite(business.website);
        cache.set(cacheKey, result, CACHE_TTL.WEBSITE_ANALYSIS);
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
