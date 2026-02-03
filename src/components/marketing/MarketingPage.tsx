'use client';

interface MarketingPageProps {
  onSignIn: () => void;
  onSignUp: () => void;
}

export function MarketingPage({ onSignIn, onSignUp }: MarketingPageProps) {
  return (
    <div className="min-h-screen bg-[#0f0f10] flex flex-col">
      {/* Navigation */}
      <header className="relative z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="text-xl font-bold text-white">
            TrueSignal<span className="text-violet-500">.</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onSignIn}
              className="px-4 py-2 text-sm font-medium text-zinc-300 hover:text-white transition-colors"
            >
              Sign in
            </button>
            <button
              onClick={onSignUp}
              className="px-4 py-2 text-sm font-medium bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition-colors"
            >
              Get Started Free
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 flex items-center justify-center px-4 py-12 md:py-16">
        <div className="max-w-3xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 mb-4 bg-emerald-500/10 rounded-full">
            <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs font-medium text-emerald-400">Start free with 5 credits</span>
          </div>

          {/* Headline */}
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 tracking-tight leading-tight">
            Find businesses that
            <br />
            <span className="text-violet-400">actually need</span> your services
          </h1>

          {/* Subheadline */}
          <p className="text-base md:text-lg text-zinc-400 mb-8 max-w-xl mx-auto leading-relaxed">
            TrueSignal analyzes real business signals to find companies with weak online presence, poor SEO, and low engagement.
          </p>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10">
            <button
              onClick={onSignUp}
              className="w-full sm:w-auto px-6 py-3 text-base font-semibold bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition-all shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30 flex items-center justify-center gap-2"
            >
              <span>Get Started Free</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
            <button
              onClick={onSignIn}
              className="w-full sm:w-auto px-6 py-3 text-base font-medium text-zinc-400 hover:text-white transition-colors"
            >
              Sign in
            </button>
          </div>

          {/* Stats - more compact */}
          <div className="flex items-center justify-center gap-8 text-sm">
            <div className="text-center">
              <div className="text-xl font-bold text-white">5</div>
              <div className="text-xs text-zinc-500">Free Credits</div>
            </div>
            <div className="w-px h-8 bg-zinc-800" />
            <div className="text-center">
              <div className="text-xl font-bold text-white">20+</div>
              <div className="text-xs text-zinc-500">Leads/Search</div>
            </div>
            <div className="w-px h-8 bg-zinc-800" />
            <div className="text-center">
              <div className="text-xl font-bold text-white">10+</div>
              <div className="text-xs text-zinc-500">Data Points</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-10 md:py-14 border-t border-zinc-800/50">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-xl md:text-2xl font-bold text-white text-center mb-2">
            How It Works
          </h2>
          <p className="text-sm text-zinc-500 text-center mb-8">
            Three steps to find businesses that need your services
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Step 1 */}
            <div className="text-center">
              <div className="w-9 h-9 mx-auto mb-3 rounded-lg bg-violet-500/10 flex items-center justify-center">
                <span className="text-base font-bold text-violet-400">1</span>
              </div>
              <h3 className="text-sm font-semibold text-white mb-1">Search Your Niche</h3>
              <p className="text-xs text-zinc-500">
                Enter a business type and location to find relevant businesses.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="w-9 h-9 mx-auto mb-3 rounded-lg bg-violet-500/10 flex items-center justify-center">
                <span className="text-base font-bold text-violet-400">2</span>
              </div>
              <h3 className="text-sm font-semibold text-white mb-1">Analyze Signals</h3>
              <p className="text-xs text-zinc-500">
                Lead Intel scans for SEO weaknesses and engagement gaps.
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="w-9 h-9 mx-auto mb-3 rounded-lg bg-violet-500/10 flex items-center justify-center">
                <span className="text-base font-bold text-violet-400">3</span>
              </div>
              <h3 className="text-sm font-semibold text-white mb-1">Find Opportunities</h3>
              <p className="text-xs text-zinc-500">
                Get a prioritized list of businesses to start outreach.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-10 md:py-14 border-t border-zinc-800/50 bg-zinc-900/30">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-xl md:text-2xl font-bold text-white text-center mb-2">
            What You&apos;ll Discover
          </h2>
          <p className="text-sm text-zinc-500 text-center mb-8">
            Real signals that indicate a business needs help
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                icon: (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                ),
                title: 'Search Visibility',
                description: 'Ranking or invisible to customers',
              },
              {
                icon: (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                ),
                title: 'Review Response',
                description: 'Ignoring reviews = disengaged',
              },
              {
                icon: (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                title: 'Owner Activity',
                description: 'Dormant profiles = opportunity',
              },
              {
                icon: (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                ),
                title: 'Website Analysis',
                description: 'Outdated tech, poor mobile UX',
              },
              {
                icon: (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                title: 'Claim Status',
                description: 'Unclaimed = not managing presence',
              },
              {
                icon: (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                ),
                title: 'Opportunity Score',
                description: 'Prioritized by need level',
              },
            ].map((feature, index) => (
              <div key={index} className="flex gap-3 p-3 rounded-lg bg-zinc-800/30">
                <div className="w-8 h-8 rounded-md bg-violet-500/10 flex items-center justify-center text-violet-400 flex-shrink-0">
                  {feature.icon}
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-medium text-white">{feature.title}</h3>
                  <p className="text-xs text-zinc-500 truncate">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-10 md:py-14 border-t border-zinc-800/50">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-xl md:text-2xl font-bold text-white mb-2">
            Ready to find your next clients?
          </h2>
          <p className="text-sm text-zinc-500 mb-6">
            Start with 5 free credits. No credit card required.
          </p>
          <button
            onClick={onSignUp}
            className="px-6 py-3 text-base font-semibold bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition-all shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30 inline-flex items-center gap-2"
          >
            <span>Create Free Account</span>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 border-t border-zinc-800/50">
        <div className="max-w-4xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="text-xs text-zinc-600">
            © {new Date().getFullYear()} TrueSignal
          </div>
          <div className="flex items-center gap-4 text-xs text-zinc-500">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
