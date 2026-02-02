'use client';

import { StatusTag } from './StatusTag';

interface PremiumGateProps {
  onUpgradeClick: () => void;
  niche?: string;
  location?: string;
}

// Mock data to show users what they'd get - more rows for better preview
const MOCK_BUSINESSES = [
  {
    name: 'Example Plumbing Co.',
    searchVisibility: false,
    responseRate: 12,
    daysDormant: 245,
    seoOptimized: false,
    claimed: true,
    signals: ['Not ranking in search', 'No review reply in 245 days'],
    score: 85,
  },
  {
    name: 'City Pro Services',
    searchVisibility: false,
    responseRate: 0,
    daysDormant: 400,
    seoOptimized: false,
    claimed: false,
    signals: ['Not ranking in search', 'Unclaimed profile'],
    score: 92,
  },
  {
    name: 'Quick Fix Solutions',
    searchVisibility: true,
    responseRate: 45,
    daysDormant: 60,
    seoOptimized: false,
    claimed: true,
    signals: ['Low review reply rate', 'No SEO optimization'],
    score: 35,
  },
  {
    name: 'Premier Home Services',
    searchVisibility: false,
    responseRate: 8,
    daysDormant: 180,
    seoOptimized: false,
    claimed: true,
    signals: ['Not ranking', 'Poor response rate'],
    score: 78,
  },
  {
    name: 'Budget Repairs LLC',
    searchVisibility: false,
    responseRate: 0,
    daysDormant: 365,
    seoOptimized: false,
    claimed: false,
    signals: ['No online presence', 'Unclaimed'],
    score: 95,
  },
  {
    name: 'Quality First Inc.',
    searchVisibility: true,
    responseRate: 65,
    daysDormant: 30,
    seoOptimized: true,
    claimed: true,
    signals: ['Active competitor'],
    score: 15,
  },
];

export function PremiumGate({ onUpgradeClick, niche, location }: PremiumGateProps) {
  return (
    <div className="relative min-h-[600px]">
      {/* Preview table - blurred */}
      <div className="overflow-hidden rounded-lg">
        <div className="overflow-x-auto blur-[3px] pointer-events-none select-none opacity-60">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="py-4 px-4 text-sm font-semibold text-foreground">Business</th>
                <th className="py-4 px-4 text-sm font-semibold text-foreground">Search Visibility</th>
                <th className="py-4 px-4 text-sm font-semibold text-foreground">Response Rate</th>
                <th className="py-4 px-4 text-sm font-semibold text-foreground">Last Activity</th>
                <th className="py-4 px-4 text-sm font-semibold text-foreground">GMB Signals</th>
                <th className="py-4 px-4 text-sm font-semibold text-foreground">Opportunity Score</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_BUSINESSES.map((business, index) => (
                <tr key={index} className="border-b border-border">
                  <td className="py-4 px-4 text-sm font-medium text-foreground">{business.name}</td>
                  <td className="py-4 px-4">
                    <StatusTag status={business.searchVisibility ? 'success' : 'error'}>
                      {business.searchVisibility ? 'Ranked' : 'Not Ranked'}
                    </StatusTag>
                  </td>
                  <td className="py-4 px-4 text-sm text-muted-foreground">{business.responseRate}%</td>
                  <td className="py-4 px-4 text-sm text-muted-foreground">{business.daysDormant} days ago</td>
                  <td className="py-4 px-4">
                    <div className="flex flex-wrap gap-1">
                      {business.signals.slice(0, 2).map((signal, i) => (
                        <span key={i} className="inline-flex px-2 py-0.5 text-xs rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
                          {signal}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full ${business.score >= 70 ? 'bg-emerald-500' : business.score >= 40 ? 'bg-amber-500' : 'bg-red-500'}`}
                          style={{ width: `${business.score}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-foreground">{business.score}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Overlay with upgrade CTA */}
        <div className="absolute inset-0 flex items-center justify-center">
          {/* Gradient background */}
          <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/80 to-background" />

          {/* Content card */}
          <div className="relative z-10 w-full max-w-xl mx-auto px-6">
            <div className="bg-zinc-900/95 backdrop-blur-sm border border-zinc-800 rounded-2xl p-8 shadow-2xl">
              {/* Lock icon */}
              <div className="flex justify-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-violet-500/10 border border-violet-500/20">
                  <svg className="w-8 h-8 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
              </div>

              {/* Title */}
              <h3 className="text-2xl font-bold text-white text-center mb-3">
                Unlock SEO Signals Pro
              </h3>

              {/* Description */}
              <p className="text-zinc-400 text-center mb-6 leading-relaxed">
                Subscribe to a paid plan to analyze{' '}
                <span className="text-white font-medium">{niche || 'businesses'}</span> in{' '}
                <span className="text-white font-medium">{location || 'your area'}</span>.
              </p>

              {/* Divider */}
              <div className="border-t border-zinc-800 my-6" />

              {/* Feature list - 2 columns */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-3 mb-8">
                <div className="flex items-center gap-2.5">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <svg className="w-3 h-3 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-sm text-zinc-300">Search visibility check</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <svg className="w-3 h-3 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-sm text-zinc-300">Review response analysis</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <svg className="w-3 h-3 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-sm text-zinc-300">Owner activity tracking</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <svg className="w-3 h-3 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-sm text-zinc-300">Website & SEO analysis</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <svg className="w-3 h-3 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-sm text-zinc-300">Opportunity scoring</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <svg className="w-3 h-3 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-sm text-zinc-300">Actionable lead signals</span>
                </div>
              </div>

              {/* CTA Button */}
              <button
                onClick={onUpgradeClick}
                className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-violet-500/20"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
                View Subscription Plans
              </button>

              {/* Subtext */}
              <p className="text-xs text-zinc-500 text-center mt-4">
                Starting at $29/month · Cancel anytime
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
