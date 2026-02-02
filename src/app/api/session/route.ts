import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  getSessionAnalyses,
  saveSessionAnalyses,
  getSearchAnalyses,
  clearSessionAnalyses,
  getSearchKey,
} from '@/lib/session-store';
import { EnrichedBusiness } from '@/lib/types';

/**
 * GET /api/session - Get all analyses for a session/user
 * Query params:
 *   - sessionId: required for anonymous users
 *   - niche: optional (filter by search)
 *   - location: optional (filter by search)
 */
export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get('sessionId');
  const niche = request.nextUrl.searchParams.get('niche');
  const location = request.nextUrl.searchParams.get('location');

  // Check if user is logged in
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  try {
    // LOGGED IN USER: Use Supabase
    if (user) {
      if (niche && location) {
        // Get specific search analyses
        const { data } = await supabase
          .from('saved_analyses')
          .select('businesses')
          .eq('user_id', user.id)
          .eq('niche', niche.toLowerCase().trim())
          .eq('location', location.toLowerCase().trim())
          .single();

        return NextResponse.json({
          businesses: data?.businesses || [],
          searchKey: getSearchKey(niche, location),
        });
      }

      // Get all analyses for user
      const { data } = await supabase
        .from('saved_analyses')
        .select('niche, location, businesses, business_count, updated_at')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      // Transform to session format for compatibility
      const analyses: Record<string, {
        niche: string;
        location: string;
        businesses: EnrichedBusiness[];
        analyzedAt: string;
      }> = {};

      for (const row of data || []) {
        const searchKey = getSearchKey(row.niche, row.location);
        analyses[searchKey] = {
          niche: row.niche,
          location: row.location,
          businesses: row.businesses as EnrichedBusiness[],
          analyzedAt: row.updated_at,
        };
      }

      return NextResponse.json({ analyses });
    }

    // ANONYMOUS USER: Use Redis
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    if (niche && location) {
      const businesses = await getSearchAnalyses(sessionId, niche, location);
      return NextResponse.json({
        businesses,
        searchKey: getSearchKey(niche, location),
      });
    }

    const analyses = await getSessionAnalyses(sessionId);
    return NextResponse.json({ analyses: analyses || {} });

  } catch (error) {
    console.error('[Session API] GET error:', error);
    return NextResponse.json({ error: 'Failed to get session data' }, { status: 500 });
  }
}

/**
 * POST /api/session - Save analyses for a session/user
 * Body:
 *   - sessionId: required for anonymous users
 *   - niche: required
 *   - location: required
 *   - businesses: required (array of EnrichedBusiness)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, niche, location, businesses } = body as {
      sessionId: string;
      niche: string;
      location: string;
      businesses: EnrichedBusiness[];
    };

    if (!niche || !location || !businesses) {
      return NextResponse.json(
        { error: 'niche, location, and businesses are required' },
        { status: 400 }
      );
    }

    // Check if user is logged in
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // LOGGED IN USER: Save to Supabase
    if (user) {
      const normalizedNiche = niche.toLowerCase().trim();
      const normalizedLocation = location.toLowerCase().trim();

      // Check if analysis exists for this user/niche/location
      const { data: existing } = await supabase
        .from('saved_analyses')
        .select('id, businesses')
        .eq('user_id', user.id)
        .eq('niche', normalizedNiche)
        .eq('location', normalizedLocation)
        .single();

      if (existing) {
        // Merge with existing businesses
        const existingBusinesses = (existing.businesses as EnrichedBusiness[]) || [];
        const businessMap = new Map(existingBusinesses.map(b => [b.placeId || b.name, b]));

        for (const business of businesses) {
          const id = business.placeId || business.name;
          businessMap.set(id, business);
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
          console.error('[Session API] Error updating saved analysis:', error);
          return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
        }

        console.log(`[Session API] Updated ${mergedBusinesses.length} businesses for user ${user.id.slice(0, 8)}...`);
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
          console.error('[Session API] Error creating saved analysis:', error);
          return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
        }

        console.log(`[Session API] Created new analysis with ${businesses.length} businesses for user ${user.id.slice(0, 8)}...`);
      }

      return NextResponse.json({ success: true });
    }

    // ANONYMOUS USER: Save to Redis
    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId required for anonymous users' },
        { status: 400 }
      );
    }

    const success = await saveSessionAnalyses(sessionId, niche, location, businesses);

    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: 'Failed to save (Redis may not be configured)' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[Session API] POST error:', error);
    return NextResponse.json({ error: 'Failed to save session data' }, { status: 500 });
  }
}

/**
 * DELETE /api/session - Clear all analyses for a session/user
 * Query params:
 *   - sessionId: required for anonymous users
 */
export async function DELETE(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get('sessionId');

  // Check if user is logged in
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  try {
    // LOGGED IN USER: Delete from Supabase
    if (user) {
      const { error } = await supabase
        .from('saved_analyses')
        .delete()
        .eq('user_id', user.id);

      if (error) {
        console.error('[Session API] Error deleting saved analyses:', error);
        return NextResponse.json({ error: 'Failed to clear' }, { status: 500 });
      }

      console.log(`[Session API] Cleared all analyses for user ${user.id.slice(0, 8)}...`);
      return NextResponse.json({ success: true });
    }

    // ANONYMOUS USER: Clear from Redis
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    const success = await clearSessionAnalyses(sessionId);
    return NextResponse.json({ success });

  } catch (error) {
    console.error('[Session API] DELETE error:', error);
    return NextResponse.json({ error: 'Failed to clear session data' }, { status: 500 });
  }
}
