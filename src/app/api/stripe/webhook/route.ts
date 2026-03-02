import { NextRequest, NextResponse } from 'next/server';
import { getStripeServer, SUBSCRIPTION_TIERS, SubscriptionTier } from '@/lib/stripe/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { stripeLogger } from '@/lib/logger';

// Lazy initialization to avoid build-time errors
let _supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (!_supabase) {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase environment variables not set');
    }
    _supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  }
  return _supabase;
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Missing signature or webhook secret' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = getStripeServer().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    stripeLogger.error({ err }, 'Webhook signature verification failed');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  stripeLogger.info({ eventType: event.type }, 'Webhook event received');

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutComplete(session);
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCanceled(subscription);
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaid(invoice);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
        break;
      }

      default:
        stripeLogger.debug({ eventType: event.type }, 'Unhandled webhook event type');
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    stripeLogger.error({ err: error }, 'Error processing webhook event');
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  stripeLogger.info({ metadata: session.metadata }, 'handleCheckoutComplete called');

  const userId = session.metadata?.user_id;
  const type = session.metadata?.type;

  if (!userId) {
    stripeLogger.error('No user_id in session metadata');
    return;
  }

  // ATOMIC IDEMPOTENCY: Try to insert a lock record first
  // If it fails due to unique constraint on stripe_session_id, we've already processed this
  // This is more robust than SELECT → INSERT which has a race window
  const lockResult = await getSupabase()
    .from('credit_transactions')
    .insert({
      user_id: userId,
      amount: 0, // Placeholder, will be updated
      type: 'checkout_lock',
      description: `Processing checkout ${session.id}`,
      balance_after: 0,
      stripe_session_id: session.id,
    })
    .select('id')
    .single();

  // If insert failed due to duplicate key (already exists), skip processing
  if (lockResult.error) {
    if (lockResult.error.code === '23505') { // Postgres unique violation
      stripeLogger.info({ sessionId: session.id }, 'Checkout already processed (unique constraint), skipping');
      return;
    }
    // For other errors, log but continue with legacy check
    stripeLogger.warn({ err: lockResult.error.message }, 'Lock insert warning');

    // Fallback: Check if transaction exists (legacy behavior)
    const { data: existingTransaction } = await getSupabase()
      .from('credit_transactions')
      .select('id')
      .eq('stripe_session_id', session.id)
      .single();

    if (existingTransaction) {
      stripeLogger.info({ sessionId: session.id }, 'Checkout already processed, skipping (idempotent)');
      return;
    }
  }

  stripeLogger.info({ userId: userId.slice(0, 8), type }, 'Processing checkout');

  if (type === 'credits') {
    // Handle one-time credit purchase
    const credits = parseInt(session.metadata?.credits || '0', 10);
    stripeLogger.info({ credits, userId: userId.slice(0, 8) }, 'Credit purchase');

    if (credits > 0) {
      // First verify the user exists in subscriptions table
      const { data: existingSub, error: fetchError } = await getSupabase()
        .from('subscriptions')
        .select('id, credits_purchased, credits_remaining')
        .eq('user_id', userId)
        .single();

      if (fetchError) {
        stripeLogger.error({ err: fetchError }, 'Error fetching subscription');
        stripeLogger.info('Creating subscription record for user');

        // Create subscription record if it doesn't exist
        const { error: insertError } = await getSupabase()
          .from('subscriptions')
          .insert({
            user_id: userId,
            tier: 'free',
            status: 'active',
            credits_monthly_allowance: 5,
            credits_remaining: 5,
            credits_purchased: credits,
          });

        if (insertError) {
          stripeLogger.error({ err: insertError }, 'Error creating subscription');
          return;
        }

        // Update the lock record with actual transaction data
        await getSupabase()
          .from('credit_transactions')
          .update({
            amount: credits,
            type: 'purchase',
            description: `Purchased ${credits} credits (new user)`,
            balance_after: 5 + credits,
          })
          .eq('stripe_session_id', session.id);

        stripeLogger.info({ credits }, 'Created subscription with purchased credits');
        return;
      }

      stripeLogger.info({ purchased: existingSub.credits_purchased, remaining: existingSub.credits_remaining }, 'Current subscription state');

      // Try direct update first (more reliable than RPC)
      const { error: updateError } = await getSupabase()
        .from('subscriptions')
        .update({
          credits_purchased: (existingSub.credits_purchased || 0) + credits,
        })
        .eq('user_id', userId);

      if (updateError) {
        stripeLogger.error({ err: updateError }, 'Error updating credits directly');

        // Fallback to RPC
        const { error: rpcError } = await getSupabase().rpc('add_credits', {
          p_user_id: userId,
          p_amount: credits,
          p_type: 'purchase',
          p_description: `Purchased ${credits} credits`,
        });

        if (rpcError) {
          stripeLogger.error({ err: rpcError }, 'RPC add_credits also failed');
          return;
        }
      }

      // Update the lock record with actual transaction data
      await getSupabase()
        .from('credit_transactions')
        .update({
          amount: credits,
          type: 'purchase',
          description: `Purchased ${credits} credits`,
          balance_after: (existingSub.credits_purchased || 0) + (existingSub.credits_remaining || 0) + credits,
        })
        .eq('stripe_session_id', session.id);

      stripeLogger.info({ credits, userId: userId.slice(0, 8) }, 'Successfully added credits');
    } else {
      stripeLogger.warn('No credits to add (credits <= 0)');
    }
  } else if (type === 'subscription') {
    // Handle subscription checkout completion
    const tier = session.metadata?.tier as SubscriptionTier | undefined;
    const tierConfig = tier ? SUBSCRIPTION_TIERS[tier] : SUBSCRIPTION_TIERS.starter;

    stripeLogger.info({ tier, userId: userId.slice(0, 8) }, 'Subscription checkout');

    // Ensure user has the subscription record with credits
    const { data: existingSub } = await getSupabase()
      .from('subscriptions')
      .select('id, tier, credits_remaining')
      .eq('user_id', userId)
      .single();

    if (existingSub) {
      // Update existing subscription with credits if not already set
      const { error: updateError } = await getSupabase()
        .from('subscriptions')
        .update({
          tier: tier || 'starter',
          status: 'active',
          credits_remaining: tierConfig.credits,
          credits_monthly_allowance: tierConfig.credits,
        })
        .eq('user_id', userId);

      if (updateError) {
        stripeLogger.error({ err: updateError }, 'Error updating subscription on checkout');
      } else {
        // Update the lock record with actual transaction data
        await getSupabase()
          .from('credit_transactions')
          .update({
            amount: tierConfig.credits,
            type: 'subscription_grant',
            description: `Subscription activated: ${tier} (${tierConfig.credits} credits)`,
            balance_after: tierConfig.credits,
          })
          .eq('stripe_session_id', session.id);
        stripeLogger.info({ tier, credits: tierConfig.credits }, 'Updated subscription');
      }
    } else {
      // Create subscription record
      const { error: insertError } = await getSupabase()
        .from('subscriptions')
        .insert({
          user_id: userId,
          tier: tier || 'starter',
          status: 'active',
          credits_remaining: tierConfig.credits,
          credits_monthly_allowance: tierConfig.credits,
          credits_purchased: 0,
        });

      if (insertError) {
        stripeLogger.error({ err: insertError }, 'Error creating subscription on checkout');
      } else {
        // Update the lock record with actual transaction data
        await getSupabase()
          .from('credit_transactions')
          .update({
            amount: tierConfig.credits,
            type: 'subscription_grant',
            description: `New subscription: ${tier} (${tierConfig.credits} credits)`,
            balance_after: tierConfig.credits,
          })
          .eq('stripe_session_id', session.id);
        stripeLogger.info({ tier, credits: tierConfig.credits }, 'Created new subscription');
      }
    }
  }
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.user_id;
  const tier = subscription.metadata?.tier as SubscriptionTier | undefined;

  if (!userId) {
    // Try to find user by customer ID
    const customerId = subscription.customer as string;
    const { data: sub } = await getSupabase()
      .from('subscriptions')
      .select('user_id')
      .eq('stripe_customer_id', customerId)
      .single();

    if (!sub) {
      stripeLogger.error('Could not find user for subscription');
      return;
    }
  }

  const actualUserId = userId || (await getUserIdByCustomer(subscription.customer as string));
  if (!actualUserId) return;

  const tierConfig = tier ? SUBSCRIPTION_TIERS[tier] : SUBSCRIPTION_TIERS.starter;
  const status = mapStripeStatus(subscription.status);

  // Get period dates from subscription items or default to now
  const subData = subscription as unknown as {
    current_period_start?: number;
    current_period_end?: number;
  };
  const periodStart = subData.current_period_start
    ? new Date(subData.current_period_start * 1000).toISOString()
    : new Date().toISOString();
  const periodEnd = subData.current_period_end
    ? new Date(subData.current_period_end * 1000).toISOString()
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  // Get current subscription to check if this is a new subscription or upgrade
  const { data: currentSub } = await getSupabase()
    .from('subscriptions')
    .select('tier, credits_remaining')
    .eq('user_id', actualUserId)
    .single();

  const isNewOrUpgrade = !currentSub || currentSub.tier === 'free' || currentSub.tier !== tier;

  // Update subscription in database
  // If new subscription or upgrade, also grant the monthly credits
  const updateData: Record<string, unknown> = {
    stripe_subscription_id: subscription.id,
    stripe_customer_id: subscription.customer as string,
    tier: tier || 'starter',
    status: status,
    current_period_start: periodStart,
    current_period_end: periodEnd,
    credits_monthly_allowance: tierConfig.credits,
  };

  // Grant credits on new subscription or upgrade
  if (isNewOrUpgrade && status === 'active') {
    updateData.credits_remaining = tierConfig.credits;
    stripeLogger.info({ credits: tierConfig.credits }, 'Granting credits for new/upgraded subscription');
  }

  const { error } = await getSupabase()
    .from('subscriptions')
    .update(updateData)
    .eq('user_id', actualUserId);

  if (error) {
    stripeLogger.error({ err: error }, 'Error updating subscription');
  } else {
    stripeLogger.info({ userId: actualUserId.slice(0, 8), tier, credits: isNewOrUpgrade ? tierConfig.credits : 'unchanged' }, 'Subscription updated');
  }
}

async function handleSubscriptionCanceled(subscription: Stripe.Subscription) {
  const userId = await getUserIdByCustomer(subscription.customer as string);
  if (!userId) return;

  // Downgrade to free tier
  const { error } = await getSupabase()
    .from('subscriptions')
    .update({
      tier: 'free',
      status: 'canceled',
      stripe_subscription_id: null,
      credits_monthly_allowance: SUBSCRIPTION_TIERS.free.credits,
    })
    .eq('user_id', userId);

  if (error) {
    stripeLogger.error({ err: error }, 'Error canceling subscription');
  } else {
    stripeLogger.info({ userId: userId.slice(0, 8) }, 'Subscription canceled');
  }
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  // Cast invoice to access subscription property
  const invoiceData = invoice as unknown as { subscription?: string | null; customer: string };
  if (!invoiceData.subscription) return; // Only handle subscription invoices

  const userId = await getUserIdByCustomer(invoiceData.customer);
  if (!userId) return;

  // Get current subscription tier
  const { data: sub } = await getSupabase()
    .from('subscriptions')
    .select('tier, credits_monthly_allowance')
    .eq('user_id', userId)
    .single();

  if (!sub) return;

  // Reset monthly credits on successful payment
  const { error } = await getSupabase()
    .from('subscriptions')
    .update({
      credits_remaining: sub.credits_monthly_allowance,
      status: 'active',
    })
    .eq('user_id', userId);

  if (error) {
    stripeLogger.error({ err: error }, 'Error resetting credits');
  } else {
    // Log the credit grant
    await getSupabase().rpc('add_credits', {
      p_user_id: userId,
      p_amount: 0, // Just for logging, actual reset done above
      p_type: 'subscription_grant',
      p_description: `Monthly credit refresh: ${sub.credits_monthly_allowance} credits`,
    });

    stripeLogger.info({ userId: userId.slice(0, 8), credits: sub.credits_monthly_allowance }, 'Monthly credits reset');
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const invoiceData = invoice as unknown as { customer: string };
  const userId = await getUserIdByCustomer(invoiceData.customer);
  if (!userId) return;

  // Update subscription status to past_due
  const { error } = await getSupabase()
    .from('subscriptions')
    .update({ status: 'past_due' })
    .eq('user_id', userId);

  if (error) {
    stripeLogger.error({ err: error }, 'Error updating payment status');
  } else {
    stripeLogger.info({ userId: userId.slice(0, 8) }, 'Subscription marked as past_due');
  }
}

async function getUserIdByCustomer(customerId: string): Promise<string | null> {
  const { data } = await getSupabase()
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_customer_id', customerId)
    .single();

  return data?.user_id || null;
}

function mapStripeStatus(status: Stripe.Subscription.Status): string {
  const statusMap: Record<string, string> = {
    active: 'active',
    canceled: 'canceled',
    incomplete: 'incomplete',
    incomplete_expired: 'canceled',
    past_due: 'past_due',
    trialing: 'trialing',
    unpaid: 'past_due',
    paused: 'canceled',
  };
  return statusMap[status] || 'active';
}
