'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { EnrichedBusiness, TableBusiness, isPendingBusiness, isEnrichedBusiness, LeadStatus } from '@/lib/types';
import { calculateSeoNeedScore, getSeoNeedSummary } from '@/lib/signals';
import { ALL_LEAD_STATUSES, LEAD_STATUS_CONFIG } from './UpgradedListTable';

interface PipelineViewProps {
  businesses: TableBusiness[];
  onStatusChange: (businessId: string, status: LeadStatus) => void;
  onNotesChange: (businessId: string, notes: string) => void;
  onOutreachClick?: (business: EnrichedBusiness) => void;
  onReportClick?: (business: EnrichedBusiness) => void;
}

const STATUS_LABELS: Record<LeadStatus, string> = {
  new: 'New',
  contacted: 'Contacted',
  pitched: 'Pitched',
  won: 'Won',
  lost: 'Lost',
};

// Status move dropdown
function MoveToDropdown({
  currentStatus,
  onChange,
}: {
  currentStatus: LeadStatus;
  onChange: (status: LeadStatus) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const options = ALL_LEAD_STATUSES.filter(s => s !== currentStatus);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
      >
        <span>Move to</span>
        <svg className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1 min-w-[140px]">
          {options.map(s => (
            <button
              key={s}
              onClick={() => { onChange(s); setOpen(false); }}
              className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Inline notes editor
function InlineNotes({
  value,
  onSave,
}: {
  value: string;
  onSave: (notes: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const handleSave = () => {
    if (draft !== value) onSave(draft);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="mt-2">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={handleSave}
          onKeyDown={(e) => { if (e.key === 'Escape') { setDraft(value); setEditing(false); } }}
          placeholder="Add a note..."
          className="w-full h-16 text-xs text-gray-700 border border-gray-200 rounded-md p-2 resize-none focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500"
          autoFocus
        />
      </div>
    );
  }

  if (value) {
    return (
      <p
        className="mt-1.5 text-xs text-gray-400 italic truncate cursor-pointer hover:text-gray-600 transition-colors"
        onClick={() => { setDraft(value); setEditing(true); }}
      >
        {value}
      </p>
    );
  }

  return null;
}

// Single lead row
function LeadRow({
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
  const [showNoteEditor, setShowNoteEditor] = useState(false);
  const score = calculateSeoNeedScore(business);
  const signals = getSeoNeedSummary(business);
  const topSignal = signals.groups[0]?.signals[0] || null;
  const status = business.leadStatus || 'new';

  return (
    <div className="group">
      <div className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50/50 transition-colors">
        {/* Business name + signal */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-900 truncate">{business.name}</span>
          </div>
          {topSignal && (
            <p className="text-xs text-gray-400 mt-0.5 truncate">{topSignal}</p>
          )}
          <InlineNotes
            value={business.leadNotes || ''}
            onSave={onNotesChange}
          />
        </div>

        {/* Score */}
        <div className="flex-shrink-0 w-16 text-right">
          <span className="text-sm font-semibold text-gray-900">{score}</span>
          <span className="text-xs text-gray-400">/100</span>
        </div>

        {/* Rating + Reviews */}
        <div className="flex-shrink-0 w-24 text-right hidden sm:block">
          <span className="text-sm text-gray-700">
            {business.rating > 0 ? `${business.rating}` : '--'}
          </span>
          <span className="text-xs text-gray-400 ml-1">
            ({business.reviewCount})
          </span>
        </div>

        {/* Rank */}
        <div className="flex-shrink-0 w-16 text-right hidden md:block">
          <span className="text-xs text-gray-500">
            {business.searchVisibility !== null ? `#${business.searchVisibility}` : '--'}
          </span>
        </div>

        {/* Actions — visible on hover */}
        <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onOutreachClick && (
            <button
              onClick={onOutreachClick}
              className="px-2 py-1 text-xs text-gray-500 hover:text-violet-600 hover:bg-violet-50 rounded transition-colors"
            >
              Outreach
            </button>
          )}
          {onReportClick && (
            <button
              onClick={onReportClick}
              className="px-2 py-1 text-xs text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
            >
              Report
            </button>
          )}
          <button
            onClick={() => setShowNoteEditor(prev => !prev)}
            className={`px-2 py-1 text-xs rounded transition-colors ${
              business.leadNotes
                ? 'text-violet-500 hover:text-violet-700 hover:bg-violet-50'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            Note
          </button>
        </div>

        {/* Move to dropdown */}
        <div className="flex-shrink-0">
          <MoveToDropdown currentStatus={status} onChange={onStatusChange} />
        </div>
      </div>

      {/* Expanded note editor triggered from action button */}
      {showNoteEditor && !business.leadNotes && (
        <div className="px-4 pb-3">
          <InlineNotes
            value=""
            onSave={(notes) => { onNotesChange(notes); setShowNoteEditor(false); }}
          />
        </div>
      )}
    </div>
  );
}

// Collapsible status section
function StatusSection({
  status,
  businesses,
  onStatusChange,
  onNotesChange,
  onOutreachClick,
  onReportClick,
  defaultOpen,
}: {
  status: LeadStatus;
  businesses: EnrichedBusiness[];
  onStatusChange: (businessId: string, status: LeadStatus) => void;
  onNotesChange: (businessId: string, notes: string) => void;
  onOutreachClick?: (business: EnrichedBusiness) => void;
  onReportClick?: (business: EnrichedBusiness) => void;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-gray-100 last:border-b-0">
      {/* Section header */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50/50 transition-colors text-left"
      >
        <svg
          className={`w-3.5 h-3.5 text-gray-400 transition-transform flex-shrink-0 ${open ? 'rotate-90' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-sm font-semibold text-gray-900">{STATUS_LABELS[status]}</span>
        <span className="text-xs text-gray-400">{businesses.length}</span>
      </button>

      {/* Rows */}
      {open && businesses.length > 0 && (
        <div className="border-t border-gray-100">
          {/* Column labels */}
          <div className="flex items-center gap-4 px-4 py-1.5 text-[10px] font-medium text-gray-400 uppercase tracking-wider">
            <div className="flex-1">Business</div>
            <div className="w-16 text-right">Score</div>
            <div className="w-24 text-right hidden sm:block">Rating</div>
            <div className="w-16 text-right hidden md:block">Rank</div>
            <div className="w-[200px]"></div>
          </div>
          {businesses.map(business => (
            <LeadRow
              key={business.placeId || business.name}
              business={business}
              onStatusChange={(s) => onStatusChange(business.placeId || business.name, s)}
              onNotesChange={(n) => onNotesChange(business.placeId || business.name, n)}
              onOutreachClick={onOutreachClick ? () => onOutreachClick(business) : undefined}
              onReportClick={onReportClick ? () => onReportClick(business) : undefined}
            />
          ))}
        </div>
      )}

      {open && businesses.length === 0 && (
        <div className="px-4 py-6 text-center border-t border-gray-100">
          <p className="text-xs text-gray-400">No leads in this stage</p>
        </div>
      )}
    </div>
  );
}

export function PipelineView({ businesses, onStatusChange, onNotesChange, onOutreachClick, onReportClick }: PipelineViewProps) {
  const enrichedBusinesses = useMemo(() =>
    businesses.filter((b): b is EnrichedBusiness => !isPendingBusiness(b) && isEnrichedBusiness(b)),
    [businesses]
  );

  const grouped = useMemo(() => {
    const result: Record<LeadStatus, EnrichedBusiness[]> = {
      new: [], contacted: [], pitched: [], won: [], lost: [],
    };
    enrichedBusinesses.forEach(b => {
      const status = b.leadStatus || 'new';
      result[status].push(b);
    });
    return result;
  }, [enrichedBusinesses]);

  if (enrichedBusinesses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <svg className="w-10 h-10 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <h3 className="text-sm font-medium text-gray-900 mb-1">No leads in pipeline</h3>
        <p className="text-xs text-gray-500 max-w-xs">
          Analyze businesses in the Lead Intel tab first, then track your outreach progress here.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-gray-900">Pipeline</h3>
          <span className="text-xs text-gray-400">{enrichedBusinesses.length} leads</span>
        </div>
        {/* Summary counts */}
        <div className="flex items-center gap-4 text-xs text-gray-400">
          {ALL_LEAD_STATUSES.map(s => (
            grouped[s].length > 0 ? (
              <span key={s}>
                <span className="text-gray-500 font-medium">{grouped[s].length}</span> {STATUS_LABELS[s].toLowerCase()}
              </span>
            ) : null
          ))}
        </div>
      </div>

      {/* Sections */}
      <div className="flex-1 overflow-y-auto">
        {ALL_LEAD_STATUSES.map(status => (
          <StatusSection
            key={status}
            status={status}
            businesses={grouped[status]}
            onStatusChange={onStatusChange}
            onNotesChange={onNotesChange}
            onOutreachClick={onOutreachClick}
            onReportClick={onReportClick}
            defaultOpen={grouped[status].length > 0}
          />
        ))}
      </div>
    </div>
  );
}
