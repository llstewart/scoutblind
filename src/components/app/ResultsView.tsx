'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useAppContext } from '@/contexts/AppContext';
import { GeneralListTable } from '@/components/GeneralListTable';
import { UpgradedListTable } from '@/components/UpgradedListTable';
import { PremiumGate } from '@/components/PremiumGate';
import { isPendingBusiness, isEnrichedBusiness, EnrichedBusiness } from '@/lib/types';
import { exportGeneralListToCSV, exportEnrichedListToCSV } from '@/lib/export';
import { OutreachTemplatesModal } from '@/components/OutreachTemplatesModal';
import { PitchReportModal } from '@/components/PitchReportModal';

const MarketDashboard = dynamic(() => import('./MarketDashboard').then(m => ({ default: m.MarketDashboard })), { ssr: false });

export function ResultsView() {
  const {
    businesses,
    tableBusinesses,
    searchParams,
    activeTab,
    setActiveTab,
    selectedBusinesses,
    setSelectedBusinesses,
    isCached,
    isViewingSavedSearch,
    isPremium,
    isAnalyzing,
    analyzeProgress,
    wasAnalysisInterrupted,
    setWasAnalysisInterrupted,
    error,
    handleAnalyze,
    handleNewSearch,
    handleUpgradeClick,
    setShowBillingModal,
    updateLeadStatus,
    updateLeadNotes,
    statusFilter,
    setStatusFilter,
    isPreviewMode,
    isPreviewEnriching,
    previewExhausted,
    triggerFreePreview,
  } = useAppContext();

  // Modal state for outreach templates and pitch report
  const [outreachBusiness, setOutreachBusiness] = useState<EnrichedBusiness | null>(null);
  const [reportBusiness, setReportBusiness] = useState<EnrichedBusiness | null>(null);

  return (
    <div className="flex flex-col h-full bg-white border border-gray-200 rounded-xl gap-4"
         style={{ boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)' }}>
      {/* Search Context Header */}
      {searchParams && !isViewingSavedSearch && (
        <div className="flex items-center gap-2 text-sm text-gray-500 px-4 pt-4">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span>
            Results for <span className="text-gray-900 font-medium">{searchParams.niche}</span> in <span className="text-gray-900 font-medium">{searchParams.location}</span>
          </span>
          {isCached && (
            <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-500 rounded">Cached</span>
          )}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-4 bg-red-500/10 rounded-lg text-red-400 text-sm mx-4">
          {error}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 pt-4">
        {/* Tabs */}
        <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl shadow-sm overflow-x-auto">
          <button
            onClick={() => setActiveTab('general')}
            className={`px-3 sm:px-4 py-2 text-sm font-medium rounded-md transition-all whitespace-nowrap ${activeTab === 'general'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-900'
              }`}
          >
            All Results
            <span className="ml-1.5 sm:ml-2 text-gray-400">({businesses.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('upgraded')}
            className={`px-3 sm:px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-1.5 sm:gap-2 whitespace-nowrap ${activeTab === 'upgraded'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-900'
              }`}
          >
            <span>Lead Intel</span>
            {isPremium ? (
              <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-emerald-500/20 text-emerald-400">
                PRO
              </span>
            ) : isPreviewMode ? (
              <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-amber-500/20 text-amber-500">
                PREVIEW
              </span>
            ) : previewExhausted ? (
              <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-gray-500/20 text-gray-400">
                USED
              </span>
            ) : (
              <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-violet-500/20 text-violet-400">
                UPGRADE
              </span>
            )}
            {tableBusinesses.length > 0 && (
              <span className="text-gray-400">({tableBusinesses.length})</span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('market')}
            className={`px-3 sm:px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-1.5 sm:gap-2 whitespace-nowrap ${activeTab === 'market'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-900'
              }`}
          >
            <span>Market</span>
            <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-emerald-500/20 text-emerald-400">
              NEW
            </span>
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* New Search - only show when not viewing saved search */}
          {!isViewingSavedSearch && (
            <button
              onClick={handleNewSearch}
              className="px-3 py-2 text-sm font-medium rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-900 transition-all flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span className="hidden sm:inline">New Search</span>
            </button>
          )}

          {/* Export */}
          <button
            onClick={() => {
              if (activeTab === 'upgraded' && tableBusinesses.length > 0) {
                const hasEnrichedData = tableBusinesses.some(b => !isPendingBusiness(b));
                if (hasEnrichedData) {
                  exportEnrichedListToCSV(tableBusinesses, searchParams?.niche, searchParams?.location);
                }
              } else {
                exportGeneralListToCSV(businesses, searchParams?.niche, searchParams?.location);
              }
            }}
            disabled={activeTab === 'market' || (activeTab === 'upgraded' && tableBusinesses.length > 0 && tableBusinesses.every(b => isPendingBusiness(b)))}
            className="px-3 py-2 text-sm font-medium rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="hidden sm:inline">Export</span>
          </button>

          {/* Analyze Button - only show when we have businesses to analyze */}
          {activeTab === 'general' && businesses.length > 0 && (
            isPremium ? (
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="px-3 sm:px-4 py-2 text-sm font-medium rounded-lg bg-violet-600 text-white hover:bg-violet-500 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <span className="hidden sm:inline">
                  {selectedBusinesses.size > 0
                    ? `Get Intel on ${selectedBusinesses.size}`
                    : 'Get Lead Intel'}
                </span>
                <span className="sm:hidden">Get Intel</span>
              </button>
            ) : isPreviewMode ? null : previewExhausted ? (
              <button
                onClick={() => setShowBillingModal(true)}
                className="px-3 sm:px-4 py-2 text-sm font-medium rounded-lg bg-violet-600 text-white hover:bg-violet-500 transition-all flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span className="hidden sm:inline">Free intel used &mdash; Upgrade</span>
                <span className="sm:hidden">Upgrade</span>
              </button>
            ) : (
              <>
                {selectedBusinesses.size > 0 && selectedBusinesses.size <= 3 ? (
                  <button
                    onClick={() => {
                      if (!searchParams) return;
                      const selected = Array.from(selectedBusinesses).map(i => businesses[i]).filter(Boolean);
                      triggerFreePreview(selected, searchParams.niche, searchParams.location);
                    }}
                    disabled={isPreviewEnriching}
                    className="px-3 sm:px-4 py-2 text-sm font-medium rounded-lg bg-violet-600 text-white hover:bg-violet-500 transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    <span className="hidden sm:inline">
                      {isPreviewEnriching ? 'Analyzing...' : `Get Free Intel (${selectedBusinesses.size}/3)`}
                    </span>
                    <span className="sm:hidden">
                      {isPreviewEnriching ? '...' : `Intel (${selectedBusinesses.size}/3)`}
                    </span>
                  </button>
                ) : (
                  <span className="text-xs text-gray-400 hidden sm:inline">
                    {selectedBusinesses.size > 3
                      ? 'Select up to 3 businesses'
                      : 'Select up to 3 for free analysis'}
                  </span>
                )}
                <button
                  onClick={() => setShowBillingModal(true)}
                  className="px-3 sm:px-4 py-2 text-sm font-medium rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900 transition-all flex items-center gap-2"
                >
                  <span className="hidden sm:inline">Upgrade</span>
                  <span className="sm:hidden">Upgrade</span>
                </button>
              </>
            )
          )}
        </div>
      </div>

      {/* Interrupted Analysis Banner */}
      {wasAnalysisInterrupted && !isAnalyzing && tableBusinesses.length > 0 && (
        <div className="p-3 rounded-lg bg-amber-500/10 flex items-center justify-between mx-4">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="text-sm text-amber-400">
              Analysis was interrupted. {tableBusinesses.filter(b => !isPendingBusiness(b)).length} of {businesses.length} businesses analyzed.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setWasAnalysisInterrupted(false)}
              className="text-xs text-gray-500 hover:text-gray-900 px-2 py-1"
            >
              Dismiss
            </button>
            <button
              onClick={handleAnalyze}
              className="text-xs font-medium text-amber-400 hover:text-amber-300 px-3 py-1 rounded hover:bg-amber-500/10"
            >
              Continue Analysis
            </button>
          </div>
        </div>
      )}

      {/* Progress Bar */}
      {isAnalyzing && analyzeProgress && (
        <div className={`p-3 rounded-lg mx-4 ${analyzeProgress.firstPageComplete
          ? 'bg-emerald-500/5'
          : 'bg-violet-500/5'
          }`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                {[1, 2, 3].map((phase) => (
                  <div
                    key={phase}
                    className={`w-2 h-2 rounded-full transition-all ${phase < (analyzeProgress.phase || 0)
                      ? 'bg-emerald-500'
                      : phase === analyzeProgress.phase
                        ? 'bg-violet-500 animate-pulse'
                        : 'bg-gray-300'
                      }`}
                  />
                ))}
              </div>
              <span className={`text-sm font-medium ${analyzeProgress.firstPageComplete ? 'text-emerald-400' : 'text-violet-400'
                }`}>
                {analyzeProgress.message}
              </span>
            </div>
            <span className={`text-sm ${analyzeProgress.firstPageComplete ? 'text-emerald-400' : 'text-violet-400'
              }`}>
              {analyzeProgress.completed}/{analyzeProgress.total}
            </span>
          </div>
          <div className={`h-1 rounded-full ${analyzeProgress.firstPageComplete ? 'bg-emerald-500/20' : 'bg-violet-500/20'
            }`}>
            <div
              className={`h-full rounded-full transition-all duration-300 ${analyzeProgress.firstPageComplete ? 'bg-emerald-500' : 'bg-violet-500'
                }`}
              style={{ width: `${(analyzeProgress.completed / analyzeProgress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Data Table / Market Dashboard / Pipeline */}
      {activeTab === 'market' ? (
        <div className="flex-1 min-h-0 border-t border-gray-200 p-4 overflow-y-auto">
          <MarketDashboard />
        </div>
      ) : (
      <div className={`overflow-hidden border-t border-gray-200 ${activeTab === 'upgraded' && isPremium
        ? 'ring-1 ring-violet-500/20'
        : ''
        }`}>
        {activeTab === 'general' ? (
          isViewingSavedSearch && businesses.length === 0 ? (
            // Viewing saved search - no general list available
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
              </div>
              <h3 className="text-sm font-medium text-gray-700 mb-1">Viewing Saved Search</h3>
              <p className="text-xs text-gray-500 max-w-xs mb-4">
                This is your saved analysis data. Run a new search to see all results.
              </p>
              <button
                onClick={handleNewSearch}
                className="px-4 py-2 text-xs font-medium text-violet-400 hover:text-violet-300 transition-colors"
              >
                Start New Search
              </button>
            </div>
          ) : (
            <GeneralListTable
              businesses={businesses}
              selectedBusinesses={selectedBusinesses}
              onSelectionChange={setSelectedBusinesses}
              isPremium={isPremium}
              onUpgradeClick={handleUpgradeClick}
              maxSelection={isPremium ? undefined : 3}
            />
          )
        ) : !isPremium ? (
          isPreviewMode ? (
            <div>
              {/* Conversion Banner */}
              <div className="px-4 py-3 bg-gradient-to-r from-violet-500/10 to-purple-500/10 border-b border-violet-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span className="text-sm text-gray-700">
                    You&apos;re seeing <strong className="text-violet-600">3 of {businesses.length}</strong> enriched results.{' '}
                    <button onClick={handleUpgradeClick} className="text-violet-600 font-semibold hover:underline">
                      Upgrade to analyze all {businesses.length} businesses
                    </button>
                  </span>
                </div>
              </div>
              {isPreviewEnriching && (
                <div className="px-4 py-2 bg-violet-50 border-b border-violet-100 flex items-center gap-2 text-xs text-violet-600">
                  <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Enriching preview results...
                </div>
              )}
              <UpgradedListTable
                businesses={tableBusinesses}
                niche={searchParams?.niche}
                location={searchParams?.location}
                onOutreachClick={setOutreachBusiness}
                onReportClick={setReportBusiness}
              />
            </div>
          ) : (
            <PremiumGate
              onUpgradeClick={handleUpgradeClick}
              niche={searchParams?.niche}
              location={searchParams?.location}
              exhausted={previewExhausted}
            />
          )
        ) : (
          <UpgradedListTable
            businesses={tableBusinesses}
            niche={searchParams?.niche}
            location={searchParams?.location}
            isLoadingMore={isAnalyzing}
            expectedTotal={analyzeProgress?.total || businesses.length}
            onStatusChange={updateLeadStatus}
            onNotesChange={updateLeadNotes}
            onOutreachClick={setOutreachBusiness}
            onReportClick={setReportBusiness}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
          />
        )}
      </div>
      )}

      {/* Footer Summary */}
      <div className="text-center text-sm text-gray-500 px-4 pb-4">
        {activeTab === 'market' ? (
          <span>
            Market insights for &quot;{searchParams?.niche}&quot; in {searchParams?.location}
          </span>
        ) : activeTab === 'general' ? (
          <span>
            Showing {businesses.length} businesses for &quot;{searchParams?.niche}&quot; in {searchParams?.location}
          </span>
        ) : isPremium && tableBusinesses.length > 0 ? (
          <span>
            {tableBusinesses.filter(b => !isPendingBusiness(b)).length} of {tableBusinesses.length} analyzed
          </span>
        ) : null}
      </div>

      {/* Outreach Templates Modal */}
      {outreachBusiness && (
        <OutreachTemplatesModal
          business={outreachBusiness}
          niche={searchParams?.niche || ''}
          onClose={() => setOutreachBusiness(null)}
        />
      )}

      {/* Pitch Report Modal */}
      {reportBusiness && (
        <PitchReportModal
          business={reportBusiness}
          niche={searchParams?.niche}
          location={searchParams?.location}
          onClose={() => setReportBusiness(null)}
        />
      )}
    </div>
  );
}
