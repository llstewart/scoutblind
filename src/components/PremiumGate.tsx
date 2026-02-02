'use client';

import { StatusTag } from './StatusTag';

interface PremiumGateProps {
  onUpgradeClick: () => void;
  niche?: string;
  location?: string;
}

// Mock data to show users what they'd get
const MOCK_BUSINESSES = [
  {
    name: 'Example Plumbing Co.',
    searchVisibility: false,
    responseRate: 12,
    daysDormant: 245,
    seoOptimized: false,
    claimed: true,
    signals: ['Not ranking in search', 'No review reply in 245 days', 'Rarely replies to reviews (12%)'],
    score: 85,
  },
  {
    name: 'City Pro Services',
    searchVisibility: false,
    responseRate: 0,
    daysDormant: 400,
    seoOptimized: false,
    claimed: false,
    signals: ['Not ranking in search', 'No review reply in 1+ year', 'Unclaimed profile'],
    score: 92,
  },
  {
    name: 'Quick Fix Solutions',
    searchVisibility: true,
    responseRate: 45,
    daysDormant: 60,
    seoOptimized: false,
    claimed: true,
    signals: ['Low review reply rate (45%)', 'No SEO optimization'],
    score: 35,
  },
];

export function PremiumGate({ onUpgradeClick, niche, location }: PremiumGateProps) {
  return (
    <div className="relative">
      {/* Preview table - blurred */}
      <div className="overflow-hidden rounded-lg">
        <div className="overflow-x-auto blur-[2px] pointer-events-none select-none">
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
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-background/60 via-background/80 to-background/95">
          <div className="text-center max-w-lg mx-auto px-6">
            {/* Lock icon */}
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>

            <h3 className="text-2xl font-bold text-foreground mb-3">
              Unlock SEO Signals Pro
            </h3>
            <p className="text-muted-foreground mb-6">
              Subscribe to a paid plan to analyze {niche || 'businesses'} in {location || 'your area'}.
              See response rates, activity gaps, SEO weaknesses, and get a lead score for each prospect.
            </p>

            {/* Feature list */}
            <div className="grid grid-cols-2 gap-3 mb-8 text-left">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm text-foreground">Search visibility check</span>
              </div>
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm text-foreground">Review response analysis</span>
              </div>
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm text-foreground">Owner activity tracking</span>
              </div>
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm text-foreground">Website & SEO analysis</span>
              </div>
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm text-foreground">Opportunity scoring</span>
              </div>
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm text-foreground">Actionable lead signals</span>
              </div>
            </div>

            <button
              onClick={onUpgradeClick}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              View Subscription Plans
            </button>

            <p className="text-xs text-muted-foreground mt-4">
              Choose a plan to unlock SEO Signals analysis
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
