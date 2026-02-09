// Single source of truth for subscription tiers and credit packs

export const SUBSCRIPTION_TIERS = {
  free: {
    name: 'Free',
    credits: 5,
    priceMonthly: 0,
    priceYearly: 0,
    features: ['5 credits on signup', 'General business search', 'CSV export'],
  },
  starter: {
    name: 'Starter',
    credits: 50,
    priceMonthly: 29,
    priceYearly: 290,
    features: ['50 credits per month', 'SEO Signals Pro analysis', 'All signals', 'Priority support'],
  },
  pro: {
    name: 'Pro',
    credits: 200,
    priceMonthly: 79,
    priceYearly: 790,
    features: ['200 credits per month', 'SEO Signals Pro analysis', 'All signals', 'Priority support'],
    popular: true,
  },
  enterprise: {
    name: 'Enterprise',
    credits: 1000,
    priceMonthly: 199,
    priceYearly: 1990,
    features: ['1000 credits per month', 'SEO Signals Pro analysis', 'All signals', 'Dedicated support'],
  },
} as const;

export const CREDIT_PACKS = {
  small: {
    name: '25 Credits',
    credits: 25,
    price: 15,
  },
  medium: {
    name: '50 Credits',
    credits: 50,
    price: 25,
  },
  large: {
    name: '100 Credits',
    credits: 100,
    price: 45,
  },
  xl: {
    name: '250 Credits',
    credits: 250,
    price: 99,
  },
} as const;

export type SubscriptionTier = keyof typeof SUBSCRIPTION_TIERS;
export type CreditPack = keyof typeof CREDIT_PACKS;
