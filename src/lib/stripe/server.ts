import Stripe from 'stripe';

// Re-export pricing constants from single source of truth
export { SUBSCRIPTION_TIERS, CREDIT_PACKS } from '@/lib/pricing';
export type { SubscriptionTier, CreditPack } from '@/lib/pricing';

// Initialize Stripe lazily to avoid build-time errors
let _stripe: Stripe | null = null;

export function getStripeServer(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not set');
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2026-01-28.clover',
      typescript: true,
    });
  }
  return _stripe;
}

// For backwards compatibility
export const stripe = new Proxy({} as Stripe, {
  get(_, prop) {
    return getStripeServer()[prop as keyof Stripe];
  },
});
