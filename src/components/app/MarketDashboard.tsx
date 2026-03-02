'use client';

import { useMemo, ReactNode } from 'react';
import { Lock, BarChart3 } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from 'recharts';
import { useAuth } from '@/contexts/AuthContext';
import { useUI } from '@/contexts/UIContext';
import { useSearch } from '@/contexts/SearchContext';
import { useLibrary } from '@/contexts/LibraryContext';
import { calculateBasicOpportunityScore, getOpportunityLevel, calculateSeoNeedScore } from '@/lib/signals';
import { isEnrichedBusiness, isPendingBusiness, EnrichedBusiness } from '@/lib/types';

// ─── Theme constants ────────────────────────────────────────────────
const COLORS = {
  high: '#10b981',    // emerald-500
  medium: '#f59e0b',  // amber-500
  low: '#ef4444',     // red-500
  primary: '#0d7c7b', // packleads teal-600
  neutral: '#71717a', // zinc-500
  neutralDark: '#d1d5db', // gray-300
  claimed: '#10b981',
  unclaimed: '#ef4444',
};

const TOOLTIP_STYLE = {
  contentStyle: {
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    color: '#374151',
    fontSize: '13px',
  },
  cursor: { fill: 'rgba(13, 124, 123, 0.05)' },
};

const GRID_STROKE = '#e5e7eb';

// ─── Sub-components ─────────────────────────────────────────────────

function ChartCard({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div className="bg-white dark:bg-card border border-gray-200 rounded-xl p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
        {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function LockedChartWrapper({
  locked,
  title,
  message,
  onUpgrade,
  children,
}: {
  locked: boolean;
  title: string;
  message: string;
  onUpgrade: () => void;
  children: ReactNode;
}) {
  if (!locked) return <>{children}</>;

  return (
    <div className="relative">
      <div className="blur-[3px] pointer-events-none select-none opacity-60">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/60 to-white/80 rounded-xl" />
        <div className="relative z-10 text-center px-4">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-violet-500/10 mb-3">
            <Lock size={20} className="text-violet-400" />
          </div>
          <p className="text-sm font-medium text-gray-700 mb-1">{title}</p>
          <p className="text-xs text-gray-500 mb-3 max-w-[220px] mx-auto">{message}</p>
          <button
            onClick={onUpgrade}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-violet-600 hover:bg-violet-500 text-white transition-all shadow-lg shadow-violet-500/20"
          >
            Upgrade to Unlock
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Fake data for locked charts ────────────────────────────────────

const FAKE_TOP_PROSPECTS = Array.from({ length: 10 }, (_, i) => ({
  name: `Business ${i + 1}`,
  score: Math.round(90 - i * 7 + Math.random() * 5),
}));

const FAKE_RADAR = [
  { axis: 'Review Health', value: 35 },
  { axis: 'Response Rate', value: 20 },
  { axis: 'Posting Freq', value: 15 },
  { axis: 'Website Quality', value: 45 },
  { axis: 'Local Pack', value: 10 },
];

const FAKE_HEAT_MAP = [
  { market: 'Market A', total: 42, analyzed: 18 },
  { market: 'Market B', total: 35, analyzed: 12 },
  { market: 'Market C', total: 28, analyzed: 22 },
  { market: 'Market D', total: 51, analyzed: 8 },
];

const FAKE_ACTIVITY = { totalProspects: 156, markets: 4, avgScore: 67 };

// ─── Main component ─────────────────────────────────────────────────

export function MarketDashboard() {
  const { isPremium } = useAuth();
  const { handleUpgradeClick } = useUI();
  const { businesses, tableBusinesses } = useSearch();
  const { savedSearchesList } = useLibrary();

  // Chart 1: Opportunity Distribution
  const opportunityData = useMemo(() => {
    if (businesses.length === 0) return [];
    let high = 0, medium = 0, low = 0;
    for (const b of businesses) {
      const score = calculateBasicOpportunityScore(b);
      const level = getOpportunityLevel(score);
      if (level === 'high') high++;
      else if (level === 'medium') medium++;
      else low++;
    }
    return [
      { level: 'High', count: high, fill: COLORS.high },
      { level: 'Medium', count: medium, fill: COLORS.medium },
      { level: 'Low', count: low, fill: COLORS.low },
    ];
  }, [businesses]);

  // Chart 2: Claim Status
  const claimData = useMemo(() => {
    if (businesses.length === 0) return [];
    let claimed = 0, unclaimed = 0;
    for (const b of businesses) {
      if (b.claimed) claimed++;
      else unclaimed++;
    }
    return [
      { name: 'Claimed', value: claimed, fill: COLORS.claimed },
      { name: 'Unclaimed', value: unclaimed, fill: COLORS.unclaimed },
    ];
  }, [businesses]);

  // Chart 3: Top 10 Prospects (enriched only)
  const topProspects = useMemo(() => {
    if (!isPremium) return FAKE_TOP_PROSPECTS;
    const enriched = tableBusinesses.filter(
      (b): b is EnrichedBusiness => !isPendingBusiness(b) && isEnrichedBusiness(b)
    );
    if (enriched.length === 0) return [];
    return [...enriched]
      .map(b => ({ name: b.name, score: calculateSeoNeedScore(b) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }, [isPremium, tableBusinesses]);

  // Chart 4: Business Health Radar
  const radarData = useMemo(() => {
    if (!isPremium) return FAKE_RADAR;
    const enriched = tableBusinesses.filter(
      (b): b is EnrichedBusiness => !isPendingBusiness(b) && isEnrichedBusiness(b)
    );
    if (enriched.length === 0) return [];
    // Pick the top-scoring enriched business
    const sorted = [...enriched].sort((a, b) => calculateSeoNeedScore(b) - calculateSeoNeedScore(a));
    const top = sorted[0];

    // Normalize to 0-100
    const reviewHealth = Math.min(100, (top.reviewCount / 100) * 50 + (top.rating / 5) * 50);
    const responseRate = top.responseRate;
    const postingFreq = top.daysDormant !== null
      ? Math.max(0, 100 - Math.min(top.daysDormant, 365) / 3.65)
      : 0;
    const websiteQuality = (top.website ? 40 : 0) + (top.seoOptimized ? 60 : 0);
    const localPack = top.searchVisibility !== null
      ? Math.max(0, 100 - (top.searchVisibility - 1) * 10)
      : 0;

    return [
      { axis: 'Review Health', value: Math.round(reviewHealth) },
      { axis: 'Response Rate', value: Math.round(responseRate) },
      { axis: 'Posting Freq', value: Math.round(postingFreq) },
      { axis: 'Website Quality', value: Math.round(websiteQuality) },
      { axis: 'Local Pack', value: Math.round(localPack) },
    ];
  }, [isPremium, tableBusinesses]);

  // Chart 5: Market Heat Map
  const heatMapData = useMemo(() => {
    if (!isPremium) return FAKE_HEAT_MAP;
    if (savedSearchesList.length <= 1) return [];
    return savedSearchesList.slice(0, 8).map(s => ({
      market: `${s.niche} - ${s.location}`.slice(0, 25),
      total: s.totalCount,
      analyzed: s.analyzedCount,
    }));
  }, [isPremium, savedSearchesList]);

  // Chart 6: Prospecting Activity stats
  const activityStats = useMemo(() => {
    if (!isPremium) return FAKE_ACTIVITY;
    const totalProspects = savedSearchesList.reduce((acc, s) => acc + s.totalCount, 0);
    const markets = savedSearchesList.length;
    const totalAnalyzed = savedSearchesList.reduce((acc, s) => acc + s.analyzedCount, 0);
    const avgScore = markets > 0 ? Math.round(totalAnalyzed / markets) : 0;
    return { totalProspects, markets, avgScore };
  }, [isPremium, savedSearchesList]);

  const enrichedCount = tableBusinesses.filter(
    b => !isPendingBusiness(b) && isEnrichedBusiness(b)
  ).length;

  const needsEnrichment = isPremium && enrichedCount === 0;
  const showPortfolio = !isPremium || savedSearchesList.length > 1;

  // ─── Empty state ────────────────────────────────────────────────
  if (businesses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-5">
          <BarChart3 size={28} className="text-gray-500" />
        </div>
        <h3 className="text-sm font-medium text-gray-700 mb-1">No market data yet</h3>
        <p className="text-xs text-gray-500 max-w-xs">
          Run a search to see market opportunity charts and insights.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Row 1: Free charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Chart 1: Opportunity Distribution */}
        <ChartCard title="Opportunity Distribution" subtitle={`${businesses.length} businesses scored`}>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={opportunityData} layout="vertical" margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} horizontal={false} />
                <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="level" tick={{ fill: '#374151', fontSize: 13 }} axisLine={false} tickLine={false} width={60} />
                <Tooltip {...TOOLTIP_STYLE} />
                <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={28}>
                  {opportunityData.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Chart 2: Profile Claim Status */}
        <ChartCard title="Profile Claim Status" subtitle="Google Business claimed vs unclaimed">
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={claimData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {claimData.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip {...TOOLTIP_STYLE} />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  iconSize={8}
                  formatter={(value: string) => <span className="text-xs text-gray-500">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* Row 2: Premium charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Chart 3: Top 10 Prospects */}
        <ChartCard title="Top 10 Prospects" subtitle="Ranked by SEO need score">
          <LockedChartWrapper
            locked={!isPremium}
            title="Top Prospects"
            message="Upgrade to see which businesses need your services most"
            onUpgrade={handleUpgradeClick}
          >
            {needsEnrichment && topProspects.length === 0 ? (
              <div className="h-[260px] flex items-center justify-center">
                <p className="text-xs text-gray-500">Analyze businesses first to see prospect rankings.</p>
              </div>
            ) : (
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topProspects} margin={{ left: 0, right: 10, top: 5, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: '#6b7280', fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      interval={0}
                      angle={-35}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                    <Tooltip {...TOOLTIP_STYLE} />
                    <Bar dataKey="score" fill={COLORS.primary} radius={[4, 4, 0, 0]} barSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </LockedChartWrapper>
        </ChartCard>

        {/* Chart 4: Business Health Radar */}
        <ChartCard title="Business Health Radar" subtitle="Top prospect profile analysis">
          <LockedChartWrapper
            locked={!isPremium}
            title="Health Radar"
            message="Upgrade to see detailed profile health for top prospects"
            onUpgrade={handleUpgradeClick}
          >
            {needsEnrichment && radarData.length === 0 ? (
              <div className="h-[260px] flex items-center justify-center">
                <p className="text-xs text-gray-500">Analyze businesses first to see health radar.</p>
              </div>
            ) : (
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                    <PolarGrid stroke={GRID_STROKE} />
                    <PolarAngleAxis dataKey="axis" tick={{ fill: '#6b7280', fontSize: 11 }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar dataKey="value" stroke={COLORS.primary} fill={COLORS.primary} fillOpacity={0.25} strokeWidth={2} />
                    <Tooltip {...TOOLTIP_STYLE} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            )}
          </LockedChartWrapper>
        </ChartCard>
      </div>

      {/* Portfolio section */}
      {showPortfolio && (
        <>
          <div className="flex items-center gap-3 pt-2">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Portfolio Overview</span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Chart 5: Market Heat Map */}
            <ChartCard title="Market Heat Map" subtitle="Businesses found vs analyzed per market">
              <LockedChartWrapper
                locked={!isPremium}
                title="Market Comparison"
                message="Upgrade to compare opportunity across your saved markets"
                onUpgrade={handleUpgradeClick}
              >
                <div className="h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={heatMapData} margin={{ left: 0, right: 10, top: 5, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
                      <XAxis
                        dataKey="market"
                        tick={{ fill: '#6b7280', fontSize: 10 }}
                        axisLine={false}
                        tickLine={false}
                        interval={0}
                        angle={-20}
                        textAnchor="end"
                        height={50}
                      />
                      <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
                      <Tooltip {...TOOLTIP_STYLE} />
                      <Legend
                        verticalAlign="top"
                        iconType="circle"
                        iconSize={8}
                        formatter={(value: string) => <span className="text-xs text-gray-500">{value}</span>}
                      />
                      <Bar dataKey="total" name="Found" fill={COLORS.neutralDark} radius={[4, 4, 0, 0]} barSize={18} />
                      <Bar dataKey="analyzed" name="Analyzed" fill={COLORS.primary} radius={[4, 4, 0, 0]} barSize={18} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </LockedChartWrapper>
            </ChartCard>

            {/* Chart 6: Prospecting Activity */}
            <ChartCard title="Prospecting Activity" subtitle="Aggregate stats across saved searches">
              <LockedChartWrapper
                locked={!isPremium}
                title="Activity Stats"
                message="Upgrade to track your prospecting activity across markets"
                onUpgrade={handleUpgradeClick}
              >
                <div className="h-[260px] flex items-center justify-center">
                  <div className="grid grid-cols-3 gap-6 w-full max-w-sm">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-gray-900">{activityStats.totalProspects}</p>
                      <p className="text-xs text-gray-500 mt-1">Total Prospects</p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-violet-400">{activityStats.markets}</p>
                      <p className="text-xs text-gray-500 mt-1">Markets</p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-emerald-400">{activityStats.avgScore}</p>
                      <p className="text-xs text-gray-500 mt-1">Avg Analyzed</p>
                    </div>
                  </div>
                </div>
              </LockedChartWrapper>
            </ChartCard>
          </div>
        </>
      )}
    </div>
  );
}
