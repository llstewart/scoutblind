import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

const FREE_SIGNUP_CREDITS = 5;

// Get service role client for bypassing RLS
function getServiceClient() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Supabase environment variables not set');
  }
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

/**
 * POST /api/init-subscription
 * Creates a subscription with free credits for new users
 * Called when a user signs up and doesn't have a subscription yet
 *
 * Uses INSERT with ON CONFLICT to handle race conditions where multiple
 * requests try to create a subscription simultaneously
 */
export async function POST() {
  // Get the current user
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  // Use service role client to bypass RLS
  const serviceClient = getServiceClient();

  // Check if this email already claimed free credits
  const userEmail = user.email?.toLowerCase();
  let grantCredits = FREE_SIGNUP_CREDITS;

  if (userEmail) {
    const { data: claim } = await serviceClient
      .from('free_credit_claims')
      .select('email')
      .eq('email', userEmail)
      .single();

    if (claim) {
      grantCredits = 0;
    }
  }

  // ATOMIC: Try to insert, if conflict (user_id already exists), do nothing
  // This prevents the SELECT → INSERT race condition
  const { data: newSub, error } = await serviceClient
    .from('subscriptions')
    .upsert({
      user_id: user.id,
      tier: 'free',
      status: 'active',
      credits_remaining: grantCredits,
      credits_purchased: 0,
      credits_monthly_allowance: 0,
    }, {
      onConflict: 'user_id',
      ignoreDuplicates: true, // Don't update if exists, just ignore
    })
    .select()
    .single();

  if (error) {
    // If upsert fails, try to fetch existing subscription
    // This handles the case where another request just created it
    if (error.code === '23505' || error.code === 'PGRST116') {
      const { data: existing } = await serviceClient
        .from('subscriptions')
        .select('id, credits_remaining, credits_purchased')
        .eq('user_id', user.id)
        .single();

      if (existing) {
        return NextResponse.json({
          success: true,
          message: 'Subscription already exists',
          credits: (existing.credits_remaining || 0) + (existing.credits_purchased || 0)
        });
      }
    }

    console.error('[Init Subscription] Error creating subscription:', error);
    return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 });
  }

  // Check if this was a new insert or existing record
  if (newSub) {
    // Record the claim if credits were granted
    if (grantCredits > 0 && userEmail) {
      await serviceClient
        .from('free_credit_claims')
        .upsert({ email: userEmail }, { onConflict: 'email', ignoreDuplicates: true });
    }

    console.log(`[Init Subscription] Created subscription with ${grantCredits} credits for user ${user.id.slice(0, 8)}...`);
    return NextResponse.json({
      success: true,
      message: 'Subscription created',
      credits: newSub.credits_remaining
    });
  }

  // Fetch existing subscription
  const { data: existing } = await serviceClient
    .from('subscriptions')
    .select('credits_remaining, credits_purchased')
    .eq('user_id', user.id)
    .single();

  return NextResponse.json({
    success: true,
    message: 'Subscription already exists',
    credits: existing ? (existing.credits_remaining || 0) + (existing.credits_purchased || 0) : FREE_SIGNUP_CREDITS
  });
}
