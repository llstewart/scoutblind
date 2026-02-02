'use client';

import { useState } from 'react';
import { X, Check, Zap, Loader2, CreditCard, Sparkles } from 'lucide-react';
import { SUBSCRIPTION_TIERS, CREDIT_PACKS } from '@/lib/pricing';

interface BillingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTier: string;
  creditsRemaining: number;
}

export function BillingModal({ isOpen, onClose, currentTier, creditsRemaining }: BillingModalProps) {
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month');
  const [activeTab, setActiveTab] = useState<'plans' | 'credits'>('plans');
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubscribe = async (tier: string) => {
    if (tier === 'free' || tier === currentTier) return;

    setLoading(tier);
    setError(null);

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'subscription',
          tier,
          interval: billingInterval,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe Checkout URL
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(null);
    }
  };

  const handleBuyCredits = async (pack: string) => {
    setLoading(pack);
    setError(null);

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'credits',
          pack,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe Checkout URL
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(null);
    }
  };

  const handleManageBilling = async () => {
    setLoading('portal');
    setError(null);

    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to open billing portal');
      }

      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-gray-900 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto m-4 border border-gray-800">
        {/* Header */}
        <div className="sticky top-0 bg-gray-900 border-b border-gray-800 p-6 flex items-center justify-between z-10">
          <div>
            <h2 className="text-2xl font-bold text-white">Upgrade Your Plan</h2>
            <p className="text-gray-400 mt-1">
              Current: {SUBSCRIPTION_TIERS[currentTier as keyof typeof SUBSCRIPTION_TIERS]?.name || 'Free'}
              {' '}&bull;{' '}
              {creditsRemaining} credits remaining
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 pt-4">
          <div className="flex gap-2 p-1 bg-gray-800/50 rounded-lg w-fit">
            <button
              onClick={() => setActiveTab('plans')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'plans'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Subscription Plans
            </button>
            <button
              onClick={() => setActiveTab('credits')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'credits'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Buy Credits
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          {activeTab === 'plans' ? (
            <>
              {/* Billing Toggle */}
              <div className="flex items-center justify-center gap-4 mb-8">
                <span className={`text-sm ${billingInterval === 'month' ? 'text-white' : 'text-gray-500'}`}>
                  Monthly
                </span>
                <button
                  onClick={() => setBillingInterval(billingInterval === 'month' ? 'year' : 'month')}
                  className="relative w-14 h-7 bg-gray-700 rounded-full transition-colors"
                >
                  <div
                    className={`absolute top-1 w-5 h-5 bg-blue-500 rounded-full transition-transform ${
                      billingInterval === 'year' ? 'translate-x-8' : 'translate-x-1'
                    }`}
                  />
                </button>
                <span className={`text-sm ${billingInterval === 'year' ? 'text-white' : 'text-gray-500'}`}>
                  Yearly
                  <span className="ml-1 text-green-400 text-xs">(Save 17%)</span>
                </span>
              </div>

              {/* Subscription Plans */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(SUBSCRIPTION_TIERS).map(([key, tier]) => {
                  const isCurrentTier = key === currentTier;
                  const price = billingInterval === 'year' ? tier.priceYearly : tier.priceMonthly;
                  const monthlyPrice = billingInterval === 'year' ? Math.round(tier.priceYearly / 12) : tier.priceMonthly;
                  const isPopular = 'popular' in tier && tier.popular;

                  return (
                    <div
                      key={key}
                      className={`relative rounded-xl border p-5 flex flex-col ${
                        isPopular
                          ? 'border-blue-500 bg-blue-500/5'
                          : isCurrentTier
                          ? 'border-green-500/50 bg-green-500/5'
                          : 'border-gray-700 bg-gray-800/50'
                      }`}
                    >
                      {isPopular && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                          <span className="px-3 py-1 bg-blue-500 text-white text-xs font-medium rounded-full flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            Most Popular
                          </span>
                        </div>
                      )}

                      <div className="mb-4">
                        <h3 className="text-lg font-semibold text-white">{tier.name}</h3>
                        <div className="mt-2">
                          {price === 0 ? (
                            <span className="text-3xl font-bold text-white">Free</span>
                          ) : (
                            <>
                              <span className="text-3xl font-bold text-white">${monthlyPrice}</span>
                              <span className="text-gray-400">/mo</span>
                              {billingInterval === 'year' && (
                                <div className="text-xs text-gray-500 mt-1">
                                  Billed ${price}/year
                                </div>
                              )}
                            </>
                          )}
                        </div>
                        <p className="text-sm text-blue-400 mt-2">
                          <Zap className="w-4 h-4 inline mr-1" />
                          {tier.credits} analyses/month
                        </p>
                      </div>

                      <ul className="space-y-2 mb-6 flex-grow">
                        {tier.features.map((feature, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                            <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                            {feature}
                          </li>
                        ))}
                      </ul>

                      <button
                        onClick={() => handleSubscribe(key)}
                        disabled={isCurrentTier || key === 'free' || loading === key}
                        className={`w-full py-2.5 px-4 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2 ${
                          isCurrentTier
                            ? 'bg-green-500/20 text-green-400 cursor-default'
                            : key === 'free'
                            ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                            : isPopular
                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                            : 'bg-gray-700 hover:bg-gray-600 text-white'
                        }`}
                      >
                        {loading === key ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : isCurrentTier ? (
                          'Current Plan'
                        ) : key === 'free' ? (
                          'Free Tier'
                        ) : (
                          'Subscribe'
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Manage Billing */}
              {currentTier !== 'free' && (
                <div className="mt-6 text-center">
                  <button
                    onClick={handleManageBilling}
                    disabled={loading === 'portal'}
                    className="text-sm text-gray-400 hover:text-white underline flex items-center gap-2 mx-auto"
                  >
                    {loading === 'portal' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CreditCard className="w-4 h-4" />
                    )}
                    Manage billing & invoices
                  </button>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Credit Packs */}
              <div className="text-center mb-8">
                <h3 className="text-lg font-semibold text-white">Need more credits?</h3>
                <p className="text-gray-400 text-sm mt-1">
                  Purchase additional credits anytime. They never expire!
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
                {Object.entries(CREDIT_PACKS).map(([key, pack]) => {
                  const pricePerCredit = (pack.price / pack.credits).toFixed(2);

                  return (
                    <div
                      key={key}
                      className="rounded-xl border border-gray-700 bg-gray-800/50 p-5 flex flex-col"
                    >
                      <div className="text-center mb-4">
                        <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                          <Zap className="w-6 h-6 text-blue-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-white">{pack.name}</h3>
                        <p className="text-xs text-gray-500 mt-1">
                          ${pricePerCredit}/credit
                        </p>
                      </div>

                      <div className="text-center mb-4">
                        <span className="text-3xl font-bold text-white">${pack.price}</span>
                      </div>

                      <button
                        onClick={() => handleBuyCredits(key)}
                        disabled={loading === key}
                        className="w-full py-2.5 px-4 rounded-lg font-medium text-sm bg-gray-700 hover:bg-gray-600 text-white transition-colors flex items-center justify-center gap-2"
                      >
                        {loading === key ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          'Buy Now'
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>

              <p className="text-center text-xs text-gray-500 mt-6">
                Credits are added to your account immediately after purchase.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
