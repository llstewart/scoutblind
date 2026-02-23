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
import { Search, Plus, Download, ScanSearch, ArrowUpRight, Lock, AlertTriangle, Check, Info, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

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
    setError,
    handleSearch,
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
    <div className="flex flex-col h-full bg-white dark:bg-card rounded-xl gap-4 elevation-1">
      {/* Search Context Header */}
      {searchParams && !isViewingSavedSearch && (
        <div className="flex items-center gap-2 text-sm text-gray-500 px-4 pt-4">
          <Search size={16} />
          <span>
            Results for <span className="text-gray-900 font-medium">{searchParams.niche}</span> in <span className="text-gray-900 font-medium">{searchParams.location}</span>
          </span>
          {isCached && (
            <Badge variant="neutral">Cached</Badge>
          )}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-3 bg-red-500/10 rounded-lg flex items-center justify-between gap-3 mx-4">
          <span className="text-red-400 text-sm">{error}</span>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setError(null)}
              className="text-xs text-gray-500 hover:text-gray-900 px-2 py-1"
            >
              Dismiss
            </button>
            {searchParams && (
              <button
                onClick={() => handleSearch(searchParams.niche, searchParams.location)}
                className="px-3 py-1 text-xs font-semibold text-red-400 hover:text-red-300 border border-red-400/30 hover:border-red-400/50 rounded-lg transition-colors"
              >
                Retry Search
              </button>
            )}
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 pt-4">
        {/* Tabs */}
        <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl shadow-sm overflow-x-auto">
          <button
            onClick={() => setActiveTab('general')}
            className={`px-3 sm:px-4 py-2 text-sm font-semibold rounded-lg transition-all whitespace-nowrap ${activeTab === 'general'
              ? 'bg-white dark:bg-card text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-900'
              }`}
          >
            All Results
            <span className="ml-1.5 sm:ml-2 text-gray-400">({businesses.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('upgraded')}
            className={`px-3 sm:px-4 py-2 text-sm font-semibold rounded-lg transition-all flex items-center gap-1.5 sm:gap-2 whitespace-nowrap ${activeTab === 'upgraded'
              ? 'bg-white dark:bg-card text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-900'
              }`}
          >
            <span>Lead Intel</span>
            {isPremium ? (
              <Badge variant="success" size="sm">PRO</Badge>
            ) : isPreviewMode ? (
              <Badge variant="warning" size="sm">PREVIEW</Badge>
            ) : previewExhausted ? (
              <Badge variant="neutral" size="sm">USED</Badge>
            ) : (
              <Badge variant="brand" size="sm">UPGRADE</Badge>
            )}
            {tableBusinesses.length > 0 && (
              <span className="text-gray-400">({tableBusinesses.length})</span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('market')}
            className={`px-3 sm:px-4 py-2 text-sm font-semibold rounded-lg transition-all flex items-center gap-1.5 sm:gap-2 whitespace-nowrap ${activeTab === 'market'
              ? 'bg-white dark:bg-card text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-900'
              }`}
          >
            <span>Market</span>
            <Badge variant="success" size="sm">NEW</Badge>
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* New Search - only show when not viewing saved search */}
          {!isViewingSavedSearch && (
            <button
              onClick={handleNewSearch}
              className="px-3 py-2 text-sm font-semibold rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-900 transition-all flex items-center gap-2"
            >
              <Search size={16} />
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
            className="px-3 py-2 text-sm font-semibold rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <Download size={16} />
            <span className="hidden sm:inline">Export</span>
          </button>

          {/* Analyze Button - only show when we have businesses to analyze */}
          {activeTab === 'general' && businesses.length > 0 && (
            isPremium ? (
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="px-3 sm:px-4 py-2 text-sm font-semibold rounded-lg bg-violet-600 text-white hover:bg-violet-500 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <ScanSearch size={16} />
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
                className="px-3 sm:px-4 py-2 text-sm font-semibold rounded-lg bg-violet-600 text-white hover:bg-violet-500 transition-all flex items-center gap-2"
              >
                <Lock size={16} />
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
                    className="px-3 sm:px-4 py-2 text-sm font-semibold rounded-lg bg-violet-600 text-white hover:bg-violet-500 transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    <ScanSearch size={16} />
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
                  className="px-3 sm:px-4 py-2 text-sm font-semibold rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900 transition-all flex items-center gap-2"
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
            <AlertTriangle size={20} className="text-amber-400" />
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
              className="text-xs font-semibold text-amber-400 hover:text-amber-300 px-3 py-1 rounded hover:bg-amber-500/10"
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
                <Info size={24} className="text-gray-400" />
              </div>
              <h3 className="text-sm font-medium text-gray-700 mb-1">Viewing Saved Search</h3>
              <p className="text-xs text-gray-500 max-w-xs mb-4">
                This is your saved analysis data. Run a new search to see all results.
              </p>
              <button
                onClick={handleNewSearch}
                className="px-4 py-2 text-xs font-semibold text-violet-400 hover:text-violet-300 transition-colors"
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
                  <ArrowUpRight size={20} className="text-violet-500" />
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
                  <Loader2 size={12} className="animate-spin" />
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
