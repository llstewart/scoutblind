import { NextRequest, NextResponse } from 'next/server';
import { AnalyzeRequest, AnalyzeResponse, EnrichedBusiness, Business } from '@/lib/types';
import { analyzeWebsite } from '@/lib/website-analyzer';
import { batchCheckVisibility } from '@/lib/openai';
import { fetchBusinessReviews } from '@/lib/outscraper';
import { classifyLocationType } from '@/utils/address';

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

    console.log(`[Analyze API] Starting analysis for ${body.businesses.length} businesses`);

    // Check visibility for all businesses in parallel batches
    console.log(`[Analyze API] Checking search visibility...`);
    const visibilityResults = await batchCheckVisibility(
      body.businesses,
      body.niche,
      body.location
    );
    console.log(`[Analyze API] Visibility check complete`);

    // Process businesses in parallel batches for speed
    const enrichedBusinesses: EnrichedBusiness[] = [];
    const batchSize = 10; // Process 10 at a time for speed

    for (let i = 0; i < body.businesses.length; i += batchSize) {
      const batch = body.businesses.slice(i, i + batchSize);
      console.log(`[Analyze API] Processing batch ${Math.floor(i / batchSize) + 1} (businesses ${i + 1}-${Math.min(i + batchSize, body.businesses.length)})`);

      const batchResults = await Promise.all(
        batch.map(async (business: Business) => {
          console.log(`[Analyze API] Analyzing: ${business.name}`);

          // Run website analysis and reviews fetch in PARALLEL for speed
          const queryForReviews = business.placeId || business.name;

          const [websiteAnalysis, reviewData] = await Promise.all([
            business.website
              ? analyzeWebsite(business.website)
              : Promise.resolve({
                  cms: null,
                  seoOptimized: false,
                  ownerName: null,
                  ownerPhone: null,
                  techStack: 'No Website',
                }),
            fetchBusinessReviews(queryForReviews, 10), // Reduced from 20 to 10 for speed
          ]);

          const locationType = classifyLocationType(business.address);
          const searchVisibility = visibilityResults.get(business.name) || false;
          const daysDormant = calculateDaysDormant(reviewData.lastOwnerActivity);

          console.log(`[Analyze API] Complete for ${business.name}: responseRate=${reviewData.responseRate}%, daysDormant=${daysDormant}`);

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
        })
      );

      enrichedBusinesses.push(...batchResults);
    }

    console.log(`[Analyze API] Analysis complete for ${enrichedBusinesses.length} businesses`);

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
