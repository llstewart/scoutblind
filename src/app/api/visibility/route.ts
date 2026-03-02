import { NextRequest, NextResponse } from 'next/server';
import { checkSearchVisibility } from '@/lib/visibility';
import { VisibilityResponse } from '@/lib/types';
import { checkRateLimit, checkUserRateLimit } from '@/lib/api-rate-limit';
import { createClient } from '@/lib/supabase/server';
import { visibilitySchema } from '@/lib/validations';
import { visibilityLogger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  // Check rate limit
  const rateLimitResponse = await checkRateLimit(request, 'visibility');
  if (rateLimitResponse) return rateLimitResponse;

  // Require authentication
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({
      error: 'Authentication required',
      requiresAuth: true
    }, { status: 401 });
  }

  // Per-user rate limit
  const userRateLimitResponse = await checkUserRateLimit(user.id, 'visibility');
  if (userRateLimitResponse) return userRateLimitResponse;

  // Check subscription tier - only paid users can check visibility
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('tier')
    .eq('user_id', user.id)
    .single();

  if (!subscription || subscription.tier === 'free') {
    return NextResponse.json({
      error: 'Upgrade to unlock visibility checks',
      requiresUpgrade: true
    }, { status: 403 });
  }

  try {
    const body = await request.json();

    const parsed = visibilitySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const { businessName, niche, location } = parsed.data;

    const rank = await checkSearchVisibility(
      businessName,
      niche,
      location
    );

    const response: VisibilityResponse = {
      rank,
    };

    return NextResponse.json(response);
  } catch (error) {
    visibilityLogger.error({ err: error }, 'Visibility API error');

    const message = error instanceof Error ? error.message : 'An unexpected error occurred';

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
