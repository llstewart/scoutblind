'use client';

import { useState, useEffect, useCallback } from 'react';
import { BarChart3 } from 'lucide-react';

interface UsageLimitsProps {
  sessionId: string;
}

interface UsageData {
  searches: { used: number; limit: number };
  analyses: { used: number; limit: number };
}

export function UsageLimitsBadge({ sessionId }: UsageLimitsProps) {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const fetchUsage = useCallback(async () => {
    if (!sessionId) return;
    try {
      const response = await fetch(`/api/usage?sessionId=${encodeURIComponent(sessionId)}`);
      if (response.ok) {
        const data = await response.json();
        setUsage(data);
      }
    } catch (error) {
      console.error('Failed to fetch usage:', error);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchUsage();
    // Refresh usage every minute
    const interval = setInterval(fetchUsage, 60000);
    return () => clearInterval(interval);
  }, [fetchUsage]);

  if (!usage) return null;

  const searchPercent = (usage.searches.used / usage.searches.limit) * 100;
  const analysisPercent = (usage.analyses.used / usage.analyses.limit) * 100;
  const isNearLimit = searchPercent >= 80 || analysisPercent >= 80;

  return (
    <div className="relative">
      <button
        onClick={() => setShowDetails(!showDetails)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
          isNearLimit
            ? 'bg-amber-500/10 text-amber-400'
            : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
        }`}
      >
        <BarChart3 size={16} />
        <span className="text-xs font-medium">
          {usage.analyses.used}/{usage.analyses.limit}
        </span>
      </button>

      {/* Details dropdown */}
      {showDetails && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowDetails(false)} />
          <div className="absolute top-full right-0 mt-2 w-64 bg-gray-100 rounded-xl shadow-xl shadow-black/10 z-50 p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Usage This Minute</h3>

            {/* Searches */}
            <div className="mb-3">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-gray-500">Searches</span>
                <span className="text-gray-700">{usage.searches.used}/{usage.searches.limit}</span>
              </div>
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    searchPercent >= 80 ? 'bg-amber-500' : 'bg-violet-500'
                  }`}
                  style={{ width: `${Math.min(searchPercent, 100)}%` }}
                />
              </div>
            </div>

            {/* Analyses */}
            <div className="mb-3">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-gray-500">Analyses</span>
                <span className="text-gray-700">{usage.analyses.used}/{usage.analyses.limit}</span>
              </div>
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    analysisPercent >= 80 ? 'bg-amber-500' : 'bg-violet-500'
                  }`}
                  style={{ width: `${Math.min(analysisPercent, 100)}%` }}
                />
              </div>
            </div>

            <p className="text-xs text-gray-500">
              Limits reset every minute. Upgrade for higher limits.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
