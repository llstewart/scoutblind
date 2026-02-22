import { createClient } from '@supabase/supabase-js';
import { EnrichedBusiness } from '@/lib/types';
import crypto from 'crypto';

let _serviceClient: ReturnType<typeof createClient> | null = null;

function getServiceClient() {
  if (!_serviceClient) {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase environment variables not set');
    }
    _serviceClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  }
  return _serviceClient;
}

export function computeCanonicalId(business: { placeId?: string | null; name: string; address: string }): string {
  if (business.placeId) return business.placeId;
  const raw = `${business.name.toLowerCase().trim()}|${business.address.toLowerCase().trim()}`;
  return crypto.createHash('sha256').update(raw).digest('hex').slice(0, 16);
}

export async function upsertLead(
  userId: string,
  business: EnrichedBusiness,
  niche: string,
  location: string
): Promise<void> {
  const supabase = getServiceClient();
  const canonicalId = computeCanonicalId(business);

  const { error } = await (supabase as any).rpc('upsert_lead', {
    p_user_id: userId,
    p_canonical_id: canonicalId,
    p_place_id: business.placeId || null,
    p_name: business.name,
    p_address: business.address,
    p_phone: business.phone || null,
    p_website: business.website || null,
    p_rating: business.rating,
    p_review_count: business.reviewCount,
    p_category: business.category,
    p_claimed: business.claimed,
    p_owner_name: business.ownerName || null,
    p_owner_phone: business.ownerPhone || null,
    p_last_review_date: business.lastReviewDate ? new Date(business.lastReviewDate as any).toISOString() : null,
    p_last_owner_activity: business.lastOwnerActivity ? new Date(business.lastOwnerActivity as any).toISOString() : null,
    p_days_dormant: business.daysDormant ?? null,
    p_search_visibility: business.searchVisibility ?? null,
    p_response_rate: business.responseRate,
    p_location_type: business.locationType,
    p_website_tech: business.websiteTech,
    p_seo_optimized: business.seoOptimized,
    p_source_niche: niche,
    p_source_location: location,
  });

  if (error) {
    throw error;
  }
}

export function upsertLeadFireAndForget(
  userId: string,
  business: EnrichedBusiness,
  niche: string,
  location: string
): void {
  upsertLead(userId, business, niche, location).catch(err => {
    console.error(`[Leads] Failed to upsert lead ${business.name}:`, err);
  });
}
