import { NextRequest, NextResponse } from 'next/server';
import { Business, EnrichedBusiness } from '@/lib/types';
import { analyzeWebsite } from '@/lib/website-analyzer';
import { checkSearchVisibility } from '@/lib/visibility';
import { fetchBusinessReviews, ReviewData } from '@/lib/outscraper';
import { classifyLocationType } from '@/utils/address';
import Cache, { cache, CACHE_TTL } from '@/lib/cache';
import { checkRateLimit, checkUserRateLimit } from '@/lib/api-rate-limit';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceSupabase } from '@supabase/supabase-js';
import { upsertLeadFireAndForget } from '@/lib/leads';

const FREE_PREVIEW_LIFETIME_CAP = 1; // Max preview sessions ever (each = up to 3 businesses)

function getServiceClient() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Supabase environment variables not set');
  }
  return createServiceSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

interface AnalyzePreviewRequest {
  businesses: Business[];
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
  // Check IP rate limit (using 'preview' type via analyze limiter with stricter limit)
  const rateLimitResponse = await checkRateLimit(request, 'preview' as any);
  if (rateLimitResponse) return rateLimitResponse;

  // Require authentication (but allow ALL tiers including free)
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({
      error: 'Authentication required',
      requiresAuth: true
    }, { status: 401 });
  }

  // Per-user rate limit
  const userRateLimitResponse = await checkUserRateLimit(user.id, 'preview' as any);
  if (userRateLimitResponse) return userRateLimitResponse;

  // Lifetime cap: check how many preview sessions this user has ever used
  const serviceClient = getServiceClient();
  const { count: previewUses } = await serviceClient
    .from('usage_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('action', 'preview_analysis');

  if ((previewUses ?? 0) >= FREE_PREVIEW_LIFETIME_CAP) {
    return NextResponse.json({
      error: 'You\'ve used your free preview. Upgrade for unlimited analysis.',
      previewCapReached: true,
    }, { status: 403 });
  }

  try {
    const body: AnalyzePreviewRequest = await request.json();

    if (!body.businesses || !body.niche || !body.location) {
      return NextResponse.json(
        { error: 'Businesses, niche, and location are required' },
        { status: 400 }
      );
    }

    // Hard cap: max 3 businesses
    const businessesToAnalyze = body.businesses.slice(0, 3);
    const { niche, location } = body;

    console.log(`[Preview] Starting preview analysis for ${businessesToAnalyze.length} businesses (user: ${user.id.slice(0, 8)})`);

    // Enrich all businesses in parallel
    const enrichedBusinesses: EnrichedBusiness[] = await Promise.all(
      businessesToAnalyze.map(async (business) => {
        const [visibilityResult, reviewData, websiteAnalysis] = await Promise.all([
          // Check visibility
          (async (): Promise<number | null> => {
            const cacheKey = Cache.visibilityKey(niche, location);
            const cachedVisibility = await cache.get<Record<string, number | null>>(cacheKey);
            if (cachedVisibility && business.name in cachedVisibility) {
              return cachedVisibility[business.name] ?? null;
            }
            const result = await checkSearchVisibility(business.name, niche, location);
            return result;
          })(),

          // Fetch reviews
          (async (): Promise<ReviewData> => {
            const query = business.placeId || `${business.name}, ${business.address}`;
            const cacheKey = Cache.reviewsKey(query);
            const cachedReviews = await cache.get<ReviewData>(cacheKey);
            if (cachedReviews) return cachedReviews;
            const result = await fetchBusinessReviews(query, 10);
            await cache.set(cacheKey, result, CACHE_TTL.REVIEWS);
            return result;
          })(),

          // Analyze website
          (async (): Promise<WebsiteAnalysisResult> => {
            if (!business.website) {
              return { cms: null, seoOptimized: false, ownerName: null, ownerPhone: null, techStack: 'No Website' };
            }
            const cacheKey = `website:${business.website}`;
            const cachedAnalysis = await cache.get<WebsiteAnalysisResult>(cacheKey);
            if (cachedAnalysis) return cachedAnalysis;
            const result = await analyzeWebsite(business.website);
            await cache.set(cacheKey, result, CACHE_TTL.WEBSITE_ANALYSIS);
            return result;
          })(),
        ]);

        return {
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
        } as EnrichedBusiness;
      })
    );

    console.log(`[Preview] Completed preview analysis for ${enrichedBusinesses.length} businesses`);

    // Upsert each enriched business into leads table
    for (const eb of enrichedBusinesses) {
      upsertLeadFireAndForget(user.id, eb, niche, location);
    }

    // Log this preview use for lifetime cap tracking (no credit deduction)
    await serviceClient.from('usage_logs').insert({
      user_id: user.id,
      action: 'preview_analysis',
      credits_used: 0,
      metadata: {
        niche,
        location,
        businessCount: enrichedBusinesses.length,
        businessNames: enrichedBusinesses.map(b => b.name),
      },
    });

    return NextResponse.json({
      enrichedBusinesses,
      isPreview: true,
    });
  } catch (error) {
    console.error('[Preview] Error:', error);
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
