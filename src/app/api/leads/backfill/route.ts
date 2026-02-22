import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { EnrichedBusiness, isEnrichedBusiness } from '@/lib/types';
import { upsertLead } from '@/lib/leads';

/**
 * POST /api/leads/backfill - Migrate saved_analyses JSONB to leads table
 * Idempotent: safe to call multiple times (upsert handles conflicts)
 */
export async function POST() {
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
    return NextResponse.json({ error: 'Upgrade required' }, { status: 403 });
  }

  try {
    const { data: savedAnalyses, error } = await supabase
      .from('saved_analyses')
      .select('niche, location, businesses')
      .eq('user_id', user.id);

    if (error) {
      console.error('[Backfill] Failed to fetch saved_analyses:', error);
      return NextResponse.json({ error: 'Failed to read saved analyses' }, { status: 500 });
    }

    let migrated = 0;
    let skipped = 0;

    for (const row of savedAnalyses || []) {
      const businesses = (row.businesses || []) as any[];
      const niche = row.niche;
      const location = row.location;

      for (const business of businesses) {
        if (!isEnrichedBusiness(business)) {
          skipped++;
          continue;
        }

        try {
          await upsertLead(user.id, business as EnrichedBusiness, niche, location);
          migrated++;
        } catch (err) {
          console.error(`[Backfill] Failed to upsert ${business.name}:`, err);
          skipped++;
        }
      }
    }

    console.log(`[Backfill] User ${user.id.slice(0, 8)}: migrated=${migrated}, skipped=${skipped}`);

    return NextResponse.json({ migrated, skipped });
  } catch (error) {
    console.error('[Backfill] Error:', error);
    return NextResponse.json({ error: 'Backfill failed' }, { status: 500 });
  }
}
