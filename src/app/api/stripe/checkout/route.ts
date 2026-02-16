import { NextRequest, NextResponse } from 'next/server';
import { stripe, SUBSCRIPTION_TIERS, CREDIT_PACKS, SubscriptionTier, CreditPack } from '@/lib/stripe/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, tier, pack, interval } = body as {
      type: 'subscription' | 'credits';
      tier?: SubscriptionTier;
      pack?: CreditPack;
      interval?: 'month' | 'year';
    };

    // Get or create Stripe customer
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single();

    let customerId = subscription?.stripe_customer_id;

    if (!customerId) {
      // Check if customer already exists in Stripe (handles race conditions)
      const existingCustomers = await stripe.customers.list({
        email: user.email,
        limit: 1,
      });

      if (existingCustomers.data.length > 0) {
        // Use existing customer
        customerId = existingCustomers.data[0].id;
      } else {
        // Create new Stripe customer with idempotency key to prevent duplicates
        const customer = await stripe.customers.create({
          email: user.email,
          metadata: {
            supabase_user_id: user.id,
          },
        }, {
          idempotencyKey: `customer_create_${user.id}`,
        });
        customerId = customer.id;
      }

      // Save customer ID to database
      await supabase
        .from('subscriptions')
        .update({ stripe_customer_id: customerId })
        .eq('user_id', user.id);
    }

    const origin = request.headers.get('origin') || 'http://localhost:3000';

    if (type === 'subscription' && tier && tier !== 'free') {
      const tierConfig = SUBSCRIPTION_TIERS[tier];
      const priceInCents = interval === 'year'
        ? tierConfig.priceYearly * 100
        : tierConfig.priceMonthly * 100;

      // Create a checkout session for subscription
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `Scoutblind ${tierConfig.name} Plan`,
                description: `${tierConfig.credits} analyses per month`,
              },
              unit_amount: priceInCents,
              recurring: {
                interval: interval || 'month',
              },
            },
            quantity: 1,
          },
        ],
        metadata: {
          user_id: user.id,
          tier: tier,
          type: 'subscription',
        },
        success_url: `${origin}/dashboard?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/dashboard?checkout=canceled`,
        subscription_data: {
          metadata: {
            user_id: user.id,
            tier: tier,
          },
        },
      });

      return NextResponse.json({ sessionId: session.id, url: session.url });
    }

    if (type === 'credits' && pack) {
      const packConfig = CREDIT_PACKS[pack];

      // Create a checkout session for one-time credit purchase
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: packConfig.name,
                description: `${packConfig.credits} analysis credits for Scoutblind`,
              },
              unit_amount: packConfig.price * 100,
            },
            quantity: 1,
          },
        ],
        metadata: {
          user_id: user.id,
          credits: packConfig.credits.toString(),
          type: 'credits',
          pack: pack,
        },
        success_url: `${origin}/dashboard?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/dashboard?checkout=canceled`,
      });

      return NextResponse.json({ sessionId: session.id, url: session.url });
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  } catch (error) {
    console.error('[Stripe Checkout] Error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
