import { NextRequest, NextResponse } from 'next/server';
import { getStripeServer, SUBSCRIPTION_TIERS, SubscriptionTier } from '@/lib/stripe/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

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
    console.error('[Stripe Webhook] Signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  console.log(`[Stripe Webhook] Received event: ${event.type}`);

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
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[Stripe Webhook] Error processing event:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.user_id;
  const type = session.metadata?.type;

  if (!userId) {
    console.error('[Stripe Webhook] No user_id in session metadata');
    return;
  }

  if (type === 'credits') {
    // Handle one-time credit purchase
    const credits = parseInt(session.metadata?.credits || '0', 10);

    if (credits > 0) {
      // Add credits to user
      const { error } = await getSupabase().rpc('add_credits', {
        p_user_id: userId,
        p_amount: credits,
        p_type: 'purchase',
        p_description: `Purchased ${credits} credits`,
      });

      if (error) {
        console.error('[Stripe Webhook] Error adding credits:', error);
      } else {
        console.log(`[Stripe Webhook] Added ${credits} credits to user ${userId}`);
      }
    }
  }
  // Subscription handling is done via subscription events
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
      console.error('[Stripe Webhook] Could not find user for subscription');
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

  // Update subscription in database
  const { error } = await getSupabase()
    .from('subscriptions')
    .update({
      stripe_subscription_id: subscription.id,
      tier: tier || 'starter',
      status: status,
      current_period_start: periodStart,
      current_period_end: periodEnd,
      credits_monthly_allowance: tierConfig.credits,
    })
    .eq('user_id', actualUserId);

  if (error) {
    console.error('[Stripe Webhook] Error updating subscription:', error);
  } else {
    console.log(`[Stripe Webhook] Updated subscription for user ${actualUserId} to ${tier}`);
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
    console.error('[Stripe Webhook] Error canceling subscription:', error);
  } else {
    console.log(`[Stripe Webhook] Canceled subscription for user ${userId}`);
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
    console.error('[Stripe Webhook] Error resetting credits:', error);
  } else {
    // Log the credit grant
    await getSupabase().rpc('add_credits', {
      p_user_id: userId,
      p_amount: 0, // Just for logging, actual reset done above
      p_type: 'subscription_grant',
      p_description: `Monthly credit refresh: ${sub.credits_monthly_allowance} credits`,
    });

    console.log(`[Stripe Webhook] Reset ${sub.credits_monthly_allowance} credits for user ${userId}`);
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
    console.error('[Stripe Webhook] Error updating payment status:', error);
  } else {
    console.log(`[Stripe Webhook] Marked subscription as past_due for user ${userId}`);
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
