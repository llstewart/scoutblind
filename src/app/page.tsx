'use client';

import { useState } from 'react';
import { SearchForm } from '@/components/SearchForm';
import { GeneralListTable } from '@/components/GeneralListTable';
import { UpgradedListTable } from '@/components/UpgradedListTable';
import { LoadingState } from '@/components/LoadingState';
import { Business, EnrichedBusiness } from '@/lib/types';

type TabType = 'general' | 'upgraded';

export default function Home() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [enrichedBusinesses, setEnrichedBusinesses] = useState<EnrichedBusiness[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [error, setError] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useState<{ niche: string; location: string } | null>(null);

  const handleSearch = async (niche: string, location: string) => {
    setIsSearching(true);
    setError(null);
    setBusinesses([]);
    setEnrichedBusinesses([]);
    setSearchParams({ niche, location });

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ niche, location }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Search failed');
      }

      const data = await response.json();
      setBusinesses(data.businesses);
      setActiveTab('general');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsSearching(false);
    }
  };

  const handleAnalyze = async () => {
    if (!searchParams || businesses.length === 0) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businesses,
          niche: searchParams.niche,
          location: searchParams.location,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Analysis failed');
      }

      const data = await response.json();
      setEnrichedBusinesses(data.enrichedBusinesses);
      setActiveTab('upgraded');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight text-black mb-3">
          Locus
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Market intelligence for SEO agencies. Find businesses with high propensity to buy through Hidden Signals analysis.
        </p>
      </div>

      {/* Search Form */}
      <div className="mb-12">
        <SearchForm onSearch={handleSearch} isLoading={isSearching} />
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-center">
          {error}
        </div>
      )}

      {/* Loading States */}
      {isSearching && (
        <LoadingState message="Searching Google Maps for businesses..." />
      )}

      {isAnalyzing && (
        <LoadingState message="Analyzing businesses for Hidden Signals..." />
      )}

      {/* Results */}
      {!isSearching && !isAnalyzing && businesses.length > 0 && (
        <div>
          {/* Tab Navigation */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
              <button
                onClick={() => setActiveTab('general')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  activeTab === 'general'
                    ? 'bg-white text-black shadow-sm'
                    : 'text-gray-600 hover:text-black'
                }`}
              >
                General List ({businesses.length})
              </button>
              <button
                onClick={() => setActiveTab('upgraded')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  activeTab === 'upgraded'
                    ? 'bg-white text-black shadow-sm'
                    : 'text-gray-600 hover:text-black'
                }`}
              >
                Upgraded List ({enrichedBusinesses.length})
              </button>
            </div>

            {/* Analyze Button */}
            {activeTab === 'general' && businesses.length > 0 && (
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="px-4 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Analyze for Hidden Signals
              </button>
            )}
          </div>

          {/* Table Container */}
          <div className="bg-white border border-gray-200 rounded-lg">
            {activeTab === 'general' ? (
              <GeneralListTable businesses={businesses} />
            ) : (
              <UpgradedListTable
                businesses={enrichedBusinesses}
                niche={searchParams?.niche}
                location={searchParams?.location}
              />
            )}
          </div>

          {/* Results Summary */}
          <div className="mt-4 text-center text-sm text-gray-500">
            {activeTab === 'general' ? (
              <span>
                Found {businesses.length} businesses for &quot;{searchParams?.niche}&quot; in {searchParams?.location}
              </span>
            ) : (
              <span>
                Analyzed {enrichedBusinesses.length} businesses with Hidden Signals
              </span>
            )}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isSearching && !isAnalyzing && businesses.length === 0 && !error && (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Start Your Search
          </h3>
          <p className="text-gray-500 max-w-sm mx-auto">
            Enter a business niche and location to find leads with high propensity to buy SEO services.
          </p>
        </div>
      )}
    </div>
  );
}
