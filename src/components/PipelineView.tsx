'use client';

import { useState, useMemo } from 'react';
import { EnrichedBusiness, TableBusiness, isPendingBusiness, isEnrichedBusiness, LeadStatus } from '@/lib/types';
import { calculateSeoNeedScore, getSeoNeedSummary, SIGNAL_CATEGORY_COLORS, SIGNAL_CATEGORY_LABELS } from '@/lib/signals';
import { LEAD_STATUS_CONFIG, ALL_LEAD_STATUSES } from './UpgradedListTable';

interface PipelineViewProps {
  businesses: TableBusiness[];
  onStatusChange: (businessId: string, status: LeadStatus) => void;
  onNotesChange: (businessId: string, notes: string) => void;
  onOutreachClick?: (business: EnrichedBusiness) => void;
  onReportClick?: (business: EnrichedBusiness) => void;
}

function PipelineCard({
  business,
  onStatusChange,
  onNotesChange,
  onOutreachClick,
  onReportClick,
}: {
  business: EnrichedBusiness;
  onStatusChange: (status: LeadStatus) => void;
  onNotesChange: (notes: string) => void;
  onOutreachClick?: () => void;
  onReportClick?: () => void;
}) {
  const [showNotes, setShowNotes] = useState(false);
  const [noteValue, setNoteValue] = useState(business.leadNotes || '');
  const score = calculateSeoNeedScore(business);
  const signals = getSeoNeedSummary(business);
  const status = business.leadStatus || 'new';

  // Get the top signal to show as the "why"
  const topSignal = signals.groups[0]?.signals[0] || null;
  const topSignalCategory = signals.groups[0]?.category;

  // Calculate days since status was presumably set (use daysDormant as proxy for now)
  const statusConfig = LEAD_STATUS_CONFIG[status];

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      {/* Card Header */}
      <div className="p-3 pb-2">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <h4 className="text-sm font-semibold text-gray-900 leading-tight truncate">{business.name}</h4>
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${
            score >= 60 ? 'bg-red-50 text-red-600' : score >= 35 ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
          }`}>
            {score}
          </span>
        </div>

        {/* Key signal — the "why this is a lead" */}
        {topSignal && topSignalCategory && (
          <div className="mb-2">
            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] rounded ${SIGNAL_CATEGORY_COLORS[topSignalCategory].bg}`}>
              <span className={`font-semibold ${SIGNAL_CATEGORY_COLORS[topSignalCategory].text}`}>{SIGNAL_CATEGORY_LABELS[topSignalCategory]}</span>
              <span className={SIGNAL_CATEGORY_COLORS[topSignalCategory].text}>{topSignal}</span>
            </span>
          </div>
        )}

        {/* Quick stats */}
        <div className="flex items-center gap-3 text-[11px] text-gray-500">
          <span className="flex items-center gap-1">
            <svg className="w-3 h-3 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            {business.rating > 0 ? business.rating : '—'}
          </span>
          <span>{business.reviewCount} reviews</span>
          {business.searchVisibility !== null && <span>#{business.searchVisibility}</span>}
        </div>
      </div>

      {/* Notes snippet */}
      {business.leadNotes && !showNotes && (
        <div
          className="px-3 pb-2 text-[11px] text-gray-500 italic truncate cursor-pointer hover:text-gray-700"
          onClick={() => setShowNotes(true)}
        >
          {business.leadNotes}
        </div>
      )}

      {/* Notes editor */}
      {showNotes && (
        <div className="px-3 pb-2">
          <textarea
            value={noteValue}
            onChange={(e) => setNoteValue(e.target.value)}
            onBlur={() => { if (noteValue !== (business.leadNotes || '')) onNotesChange(noteValue); setShowNotes(false); }}
            placeholder="Add notes..."
            className="w-full h-16 text-[11px] border border-gray-200 rounded p-1.5 resize-none focus:outline-none focus:ring-1 focus:ring-violet-500"
            autoFocus
          />
        </div>
      )}

      {/* Card Footer — actions + move */}
      <div className="px-3 py-2 border-t border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowNotes(!showNotes)}
            className={`p-1 rounded hover:bg-gray-100 transition-colors ${business.leadNotes ? 'text-violet-500' : 'text-gray-400'}`}
            title="Notes"
          >
            <svg className="w-3.5 h-3.5" fill={business.leadNotes ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
          </button>
          {onOutreachClick && (
            <button
              onClick={onOutreachClick}
              className="p-1 rounded hover:bg-violet-50 text-gray-400 hover:text-violet-600 transition-colors"
              title="Outreach"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </button>
          )}
          {onReportClick && (
            <button
              onClick={onReportClick}
              className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
              title="Report"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </button>
          )}
        </div>

        {/* Move to next/prev status */}
        <div className="flex items-center gap-1">
          {ALL_LEAD_STATUSES.map(s => {
            if (s === status) return null;
            const c = LEAD_STATUS_CONFIG[s];
            return (
              <button
                key={s}
                onClick={() => onStatusChange(s)}
                className={`w-5 h-5 rounded-full ${c.dot} opacity-30 hover:opacity-100 transition-opacity`}
                title={`Move to ${c.label}`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function PipelineView({ businesses, onStatusChange, onNotesChange, onOutreachClick, onReportClick }: PipelineViewProps) {
  const enrichedBusinesses = useMemo(() =>
    businesses.filter((b): b is EnrichedBusiness => !isPendingBusiness(b) && isEnrichedBusiness(b)),
    [businesses]
  );

  const columns = useMemo(() => {
    const grouped: Record<LeadStatus, EnrichedBusiness[]> = {
      new: [], contacted: [], pitched: [], won: [], lost: [],
    };
    enrichedBusinesses.forEach(b => {
      const status = b.leadStatus || 'new';
      grouped[status].push(b);
    });
    return grouped;
  }, [enrichedBusinesses]);

  if (enrichedBusinesses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <h3 className="text-base font-medium text-gray-900 mb-1">No leads in pipeline</h3>
        <p className="text-sm text-gray-500 max-w-sm">
          Analyze businesses in the Lead Intel tab first, then track your outreach progress here.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Pipeline header */}
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-gray-900">Pipeline</h3>
          <span className="text-xs text-gray-500">{enrichedBusinesses.length} leads</span>
        </div>
      </div>

      {/* Kanban columns */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex gap-3 p-4 h-full min-w-min">
          {ALL_LEAD_STATUSES.map(status => {
            const config = LEAD_STATUS_CONFIG[status];
            const items = columns[status];
            return (
              <div
                key={status}
                className="flex flex-col w-64 flex-shrink-0 bg-gray-50 rounded-xl border border-gray-200"
              >
                {/* Column header */}
                <div className="px-3 py-2.5 flex items-center justify-between border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${config.dot}`} />
                    <span className={`text-xs font-semibold ${config.color}`}>{config.label}</span>
                  </div>
                  <span className="text-[10px] font-medium text-gray-400 bg-gray-200 rounded-full w-5 h-5 flex items-center justify-center">
                    {items.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                  {items.length === 0 ? (
                    <div className="text-center py-8 text-xs text-gray-400">
                      No leads
                    </div>
                  ) : (
                    items.map(business => (
                      <PipelineCard
                        key={business.placeId || business.name}
                        business={business}
                        onStatusChange={(s) => onStatusChange(business.placeId || business.name, s)}
                        onNotesChange={(n) => onNotesChange(business.placeId || business.name, n)}
                        onOutreachClick={onOutreachClick ? () => onOutreachClick(business) : undefined}
                        onReportClick={onReportClick ? () => onReportClick(business) : undefined}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
