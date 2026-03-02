import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { EnrichedBusiness } from '@/lib/types';
import { leadsDeleteSchema, leadsUpdateSchema } from '@/lib/validations';
import { leadsLogger } from '@/lib/logger';

interface LeadRow {
  id: string;
  canonical_id: string;
  place_id: string | null;
  name: string;
  address: string;
  phone: string | null;
  website: string | null;
  rating: number;
  review_count: number;
  category: string;
  claimed: boolean;
  owner_name: string | null;
  owner_phone: string | null;
  last_review_date: string | null;
  last_owner_activity: string | null;
  days_dormant: number | null;
  search_visibility: number | null;
  response_rate: number;
  location_type: string;
  website_tech: string;
  seo_optimized: boolean;
  lead_status: string;
  lead_notes: string | null;
  source_niche: string | null;
  source_location: string | null;
  updated_at: string;
}

function leadRowToEnrichedBusiness(row: LeadRow): EnrichedBusiness {
  return {
    leadId: row.id,
    name: row.name,
    placeId: row.place_id,
    address: row.address,
    phone: row.phone,
    website: row.website,
    rating: row.rating,
    reviewCount: row.review_count,
    category: row.category,
    claimed: row.claimed,
    sponsored: false,
    ownerName: row.owner_name,
    ownerPhone: row.owner_phone,
    lastReviewDate: row.last_review_date ? new Date(row.last_review_date) : null,
    lastOwnerActivity: row.last_owner_activity ? new Date(row.last_owner_activity) : null,
    daysDormant: row.days_dormant,
    searchVisibility: row.search_visibility,
    responseRate: row.response_rate,
    locationType: (row.location_type as 'residential' | 'commercial') || 'commercial',
    websiteTech: row.website_tech || 'Unknown',
    seoOptimized: row.seo_optimized,
    leadStatus: (row.lead_status as any) || 'new',
    leadNotes: row.lead_notes || undefined,
    sourceNiche: row.source_niche || undefined,
    sourceLocation: row.source_location || undefined,
  };
}

/**
 * GET /api/leads - List all leads for the authenticated user
 */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('tier')
    .eq('user_id', user.id)
    .single();

  if (!subscription || subscription.tier === 'free') {
    return NextResponse.json({ error: 'Upgrade required', leads: [] }, { status: 403 });
  }

  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) {
    leadsLogger.error({ err: error }, 'GET leads error');
    return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 });
  }

  const leads = (data as LeadRow[]).map(leadRowToEnrichedBusiness);

  return NextResponse.json({ leads });
}

/**
 * DELETE /api/leads - Delete one or more leads
 */
export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const body = await request.json();

  const parsed = leadsDeleteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }
  const { leadIds } = parsed.data;

  const { error } = await supabase
    .from('leads')
    .delete()
    .in('id', leadIds);

  if (error) {
    leadsLogger.error({ err: error }, 'DELETE leads error');
    return NextResponse.json({ error: 'Failed to delete leads' }, { status: 500 });
  }

  return NextResponse.json({ success: true, deleted: leadIds.length });
}

/**
 * PATCH /api/leads - Update CRM fields for a single lead
 */
export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const body = await request.json();

  const parsed = leadsUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }
  const { leadId, status, notes } = parsed.data;

  const updates: Record<string, any> = {};
  if (status !== undefined) updates.lead_status = status;
  if (notes !== undefined) updates.lead_notes = notes;

  const { error } = await supabase
    .from('leads')
    .update(updates)
    .eq('id', leadId);

  if (error) {
    leadsLogger.error({ err: error }, 'PATCH leads error');
    return NextResponse.json({ error: 'Failed to update lead' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
