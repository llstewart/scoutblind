import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { EnrichedBusiness, Business } from '@/lib/types';

// Helper to generate search key
function getSearchKey(niche: string, location: string): string {
  return `${niche.toLowerCase().trim()}|${location.toLowerCase().trim()}`;
}

/**
 * GET /api/session - Get saved searches for logged-in user
 * Requires authentication
 * Query params:
 *   - niche: optional (filter by search)
 *   - location: optional (filter by search)
 */
export async function GET(request: NextRequest) {
  const niche = request.nextUrl.searchParams.get('niche');
  const location = request.nextUrl.searchParams.get('location');

  // Require authentication
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({
      error: 'Sign in required to view saved searches',
      requiresAuth: true
    }, { status: 401 });
  }

  try {
    if (niche && location) {
      // Get specific search
      const { data } = await supabase
        .from('saved_analyses')
        .select('businesses, business_count, updated_at')
        .eq('user_id', user.id)
        .eq('niche', niche.toLowerCase().trim())
        .eq('location', location.toLowerCase().trim())
        .single();

      return NextResponse.json({
        businesses: data?.businesses || [],
        businessCount: data?.business_count || 0,
        searchKey: getSearchKey(niche, location),
      });
    }

    // Get all saved searches for user
    const { data } = await supabase
      .from('saved_analyses')
      .select('niche, location, businesses, business_count, created_at, updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    // Transform to standardized format
    const analyses: Record<string, {
      niche: string;
      location: string;
      businesses: (Business | EnrichedBusiness)[];
      businessCount: number;
      createdAt: string;
      lastAccessed: string;
      hasEnrichedData: boolean;
      analyzedCount: number;
    }> = {};

    for (const row of data || []) {
      const searchKey = getSearchKey(row.niche, row.location);
      const businesses = row.businesses as (Business | EnrichedBusiness)[];
      // Check if any business has enriched data (has lastReviewDate or responseRate)
      const enrichedBusinesses = businesses.filter(b =>
        'lastReviewDate' in b || 'responseRate' in b || 'searchVisibility' in b
      );
      const hasEnrichedData = enrichedBusinesses.length > 0;

      analyses[searchKey] = {
        niche: row.niche,
        location: row.location,
        businesses,
        businessCount: row.business_count,
        createdAt: row.created_at,
        lastAccessed: row.updated_at,
        hasEnrichedData,
        analyzedCount: enrichedBusinesses.length,
      };
    }

    return NextResponse.json({ analyses });

  } catch (error) {
    console.error('[Session API] GET error:', error);
    return NextResponse.json({ error: 'Failed to get saved searches' }, { status: 500 });
  }
}

/**
 * POST /api/session - Save a search for logged-in user
 * Requires authentication
 * Body:
 *   - niche: required
 *   - location: required
 *   - businesses: required (array of Business or EnrichedBusiness)
 *   - type: 'general' | 'analyzed' (optional, defaults to checking data)
 */
export async function POST(request: NextRequest) {
  // Require authentication
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({
      error: 'Sign in required to save searches',
      requiresAuth: true
    }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { niche, location, businesses } = body as {
      niche: string;
      location: string;
      businesses: (Business | EnrichedBusiness)[];
    };

    if (!niche || !location || !businesses || !Array.isArray(businesses)) {
      return NextResponse.json(
        { error: 'niche, location, and businesses array are required' },
        { status: 400 }
      );
    }

    const normalizedNiche = niche.toLowerCase().trim();
    const normalizedLocation = location.toLowerCase().trim();

    // Check if search exists for this user/niche/location
    const { data: existing } = await supabase
      .from('saved_analyses')
      .select('id, businesses')
      .eq('user_id', user.id)
      .eq('niche', normalizedNiche)
      .eq('location', normalizedLocation)
      .single();

    if (existing) {
      // Merge with existing businesses (update existing, add new)
      const existingBusinesses = (existing.businesses as (Business | EnrichedBusiness)[]) || [];
      const businessMap = new Map(existingBusinesses.map(b => [b.placeId || b.name, b]));

      for (const business of businesses) {
        const id = business.placeId || business.name;
        const existingBusiness = businessMap.get(id);

        // Only update if new data has more info (is enriched) or doesn't exist
        if (!existingBusiness || 'lastReviewDate' in business || 'responseRate' in business) {
          businessMap.set(id, business);
        }
      }

      const mergedBusinesses = Array.from(businessMap.values());

      // Update existing record
      const { error } = await supabase
        .from('saved_analyses')
        .update({
          businesses: mergedBusinesses,
          business_count: mergedBusinesses.length,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);

      if (error) {
        console.error('[Session API] Error updating saved search:', error);
        return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
      }

      console.log(`[Session API] Updated search with ${mergedBusinesses.length} businesses for user ${user.id.slice(0, 8)}...`);
    } else {
      // Create new record
      const { error } = await supabase
        .from('saved_analyses')
        .insert({
          user_id: user.id,
          niche: normalizedNiche,
          location: normalizedLocation,
          businesses: businesses,
          business_count: businesses.length,
        });

      if (error) {
        console.error('[Session API] Error creating saved search:', error);
        return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
      }

      console.log(`[Session API] Created new search with ${businesses.length} businesses for user ${user.id.slice(0, 8)}...`);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('[Session API] POST error:', error);
    return NextResponse.json({ error: 'Failed to save search' }, { status: 500 });
  }
}

/**
 * DELETE /api/session - Delete saved searches for logged-in user
 * Requires authentication
 * Query params:
 *   - key: optional (format: "niche|location") - delete specific search
 *   - If no key provided, deletes ALL searches
 */
export async function DELETE(request: NextRequest) {
  const searchKey = request.nextUrl.searchParams.get('key');

  // Require authentication
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({
      error: 'Sign in required',
      requiresAuth: true
    }, { status: 401 });
  }

  try {
    if (searchKey) {
      // Delete specific search
      const [niche, location] = searchKey.split('|');
      if (!niche || !location) {
        return NextResponse.json({ error: 'Invalid search key format' }, { status: 400 });
      }

      const { error } = await supabase
        .from('saved_analyses')
        .delete()
        .eq('user_id', user.id)
        .eq('niche', niche.toLowerCase().trim())
        .eq('location', location.toLowerCase().trim());

      if (error) {
        console.error('[Session API] Error deleting saved search:', error);
        return NextResponse.json({ error: 'Failed to delete search' }, { status: 500 });
      }

      console.log(`[Session API] Deleted search "${niche}|${location}" for user ${user.id.slice(0, 8)}...`);
      return NextResponse.json({ success: true });
    }

    // Delete all searches
    const { error } = await supabase
      .from('saved_analyses')
      .delete()
      .eq('user_id', user.id);

    if (error) {
      console.error('[Session API] Error deleting saved searches:', error);
      return NextResponse.json({ error: 'Failed to clear' }, { status: 500 });
    }

    console.log(`[Session API] Cleared all searches for user ${user.id.slice(0, 8)}...`);
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('[Session API] DELETE error:', error);
    return NextResponse.json({ error: 'Failed to clear saved searches' }, { status: 500 });
  }
}
