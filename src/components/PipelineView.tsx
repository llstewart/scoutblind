'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { EnrichedBusiness, TableBusiness, isPendingBusiness, isEnrichedBusiness, LeadStatus } from '@/lib/types';
import { calculateSeoNeedScore, getSeoNeedSummary } from '@/lib/signals';
import { ALL_LEAD_STATUSES } from './UpgradedListTable';

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

const NEXT_STATUS: Partial<Record<LeadStatus, LeadStatus>> = {
  new: 'contacted',
  contacted: 'pitched',
  pitched: 'won',
};

const PROGRESSION: LeadStatus[] = ['new', 'contacted', 'pitched', 'won'];

// ── Stage flow bar ──────────────────────────────────────────────

function StageFlowBar({ counts }: { counts: Record<LeadStatus, number> }) {
  return (
    <div className="flex items-center">
      {PROGRESSION.map((status, i) => {
        const count = counts[status];
        const hasLeads = count > 0;
        return (
          <div key={status} className="flex items-center">
            <div className={`px-3 py-1 text-xs rounded-md border ${
              hasLeads
                ? 'bg-violet-50 text-violet-700 font-medium border-violet-200'
                : 'text-gray-400 border-transparent'
            }`}>
              {STATUS_LABELS[status]}{hasLeads ? ` (${count})` : ''}
            </div>
            {i < PROGRESSION.length - 1 && (
              <svg className="w-3.5 h-3.5 text-gray-300 mx-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
              </svg>
            )}
          </div>
        );
      })}
      {counts.lost > 0 && (
        <>
          <span className="text-gray-200 mx-2">|</span>
          <span className="text-xs text-gray-500 font-medium">Lost ({counts.lost})</span>
        </>
      )}
    </div>
  );
}

// ── Next-step action button ─────────────────────────────────────

function NextStepAction({
  currentStatus,
  onChange,
}: {
  currentStatus: LeadStatus;
  onChange: (status: LeadStatus) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const nextStatus = NEXT_STATUS[currentStatus];

  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  const otherStatuses = ALL_LEAD_STATUSES.filter(s => s !== currentStatus && s !== nextStatus);

  // Won / Lost — no natural next step, just a dropdown
  if (!nextStatus) {
    return (
      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
        >
          Move to
          <svg className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {open && (
          <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-30 py-1 min-w-[140px]">
            {ALL_LEAD_STATUSES.filter(s => s !== currentStatus).map(s => (
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

  return (
    <div className="relative flex items-center" ref={ref}>
      {/* Primary: advance to next stage */}
      <button
        onClick={() => onChange(nextStatus)}
        className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-violet-600 bg-violet-50 hover:bg-violet-100 rounded-l-md border border-violet-200 transition-colors"
      >
        {STATUS_LABELS[nextStatus]}
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
      {/* Dropdown for other options */}
      <button
        onClick={() => setOpen(!open)}
        className="px-1.5 py-1.5 text-violet-500 bg-violet-50 hover:bg-violet-100 rounded-r-md border border-l-0 border-violet-200 transition-colors"
      >
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-30 py-1 min-w-[140px]">
          {otherStatuses.map(s => (
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

// ── Lead row ────────────────────────────────────────────────────

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
  const [editingNote, setEditingNote] = useState(false);
  const [noteDraft, setNoteDraft] = useState(business.leadNotes || '');
  const score = calculateSeoNeedScore(business);
  const signals = getSeoNeedSummary(business);
  const topSignal = signals.groups[0]?.signals[0] || null;
  const status = business.leadStatus || 'new';

  const saveNote = () => {
    if (noteDraft !== (business.leadNotes || '')) onNotesChange(noteDraft);
    setEditingNote(false);
  };

  return (
    <div className="group border-b border-gray-100 last:border-b-0">
      <div className="flex items-center px-5 py-3 hover:bg-gray-50/60 transition-colors">
        {/* Business info */}
        <div className="flex-1 min-w-0 pr-6">
          <div className="text-sm font-medium text-gray-900 truncate">{business.name}</div>
          {topSignal && (
            <p className="text-xs text-gray-500 mt-0.5 truncate">{topSignal}</p>
          )}
        </div>

        {/* Data columns — grouped tight */}
        <div className="flex items-center flex-shrink-0">
          <div className="w-14 text-right pr-4">
            <span className="text-sm font-semibold text-gray-900">{score}</span>
          </div>
          <div className="w-24 text-right pr-4">
            <span className="text-sm text-gray-700">{business.rating > 0 ? business.rating : '--'}</span>
            <span className="text-xs text-gray-400 ml-0.5">({business.reviewCount})</span>
          </div>
          <div className="w-12 text-right pr-6">
            <span className="text-xs text-gray-500">
              {business.searchVisibility !== null ? `#${business.searchVisibility}` : '--'}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Secondary actions — appear on hover */}
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
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
                className="px-2 py-1 text-xs text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
              >
                Report
              </button>
            )}
            <button
              onClick={() => { setNoteDraft(business.leadNotes || ''); setEditingNote(true); }}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                business.leadNotes
                  ? 'text-violet-500 hover:text-violet-700 hover:bg-violet-50'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
              }`}
            >
              Note
            </button>
          </div>

          {/* Primary action — always visible */}
          <NextStepAction currentStatus={status} onChange={onStatusChange} />
        </div>
      </div>

      {/* Notes area */}
      {business.leadNotes && !editingNote && (
        <div
          className="px-5 pb-2.5 -mt-1 cursor-pointer"
          onClick={() => { setNoteDraft(business.leadNotes || ''); setEditingNote(true); }}
        >
          <p className="text-xs text-gray-400 italic truncate hover:text-gray-600 transition-colors pl-0.5">
            {business.leadNotes}
          </p>
        </div>
      )}

      {editingNote && (
        <div className="px-5 pb-3 -mt-1">
          <textarea
            value={noteDraft}
            onChange={(e) => setNoteDraft(e.target.value)}
            onBlur={saveNote}
            onKeyDown={(e) => { if (e.key === 'Escape') { setNoteDraft(business.leadNotes || ''); setEditingNote(false); } }}
            placeholder="Add a note..."
            className="w-full max-w-md h-16 text-xs text-gray-700 border border-gray-200 rounded-md p-2 resize-none focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500"
            autoFocus
          />
        </div>
      )}
    </div>
  );
}

// ── Status section ──────────────────────────────────────────────

function StatusSection({
  status,
  businesses,
  onStatusChange,
  onNotesChange,
  onOutreachClick,
  onReportClick,
}: {
  status: LeadStatus;
  businesses: EnrichedBusiness[];
  onStatusChange: (businessId: string, status: LeadStatus) => void;
  onNotesChange: (businessId: string, notes: string) => void;
  onOutreachClick?: (business: EnrichedBusiness) => void;
  onReportClick?: (business: EnrichedBusiness) => void;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div>
      {/* Section header */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2.5 px-5 py-2.5 bg-gray-50 border-b border-gray-200 hover:bg-gray-100/60 transition-colors text-left"
      >
        <svg
          className={`w-3 h-3 text-gray-400 transition-transform flex-shrink-0 ${open ? 'rotate-90' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">{STATUS_LABELS[status]}</span>
        <span className="text-xs text-gray-400 font-medium">{businesses.length}</span>
      </button>

      {/* Rows */}
      {open && (
        <div>
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
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────

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
      result[b.leadStatus || 'new'].push(b);
    });
    return result;
  }, [enrichedBusinesses]);

  const counts = useMemo(() => {
    const c: Record<LeadStatus, number> = { new: 0, contacted: 0, pitched: 0, won: 0, lost: 0 };
    ALL_LEAD_STATUSES.forEach(s => { c[s] = grouped[s].length; });
    return c;
  }, [grouped]);

  // Only render sections that have leads
  const populatedStatuses = ALL_LEAD_STATUSES.filter(s => grouped[s].length > 0);

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
      {/* Header + stage flow */}
      <div className="px-5 py-3.5 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-gray-900">Pipeline</h3>
          <span className="text-xs text-gray-400">{enrichedBusinesses.length} leads</span>
        </div>
        <StageFlowBar counts={counts} />
      </div>

      {/* Column headers */}
      <div className="flex items-center px-5 py-2 border-b border-gray-200 bg-white flex-shrink-0">
        <div className="flex-1 text-[10px] font-medium text-gray-400 uppercase tracking-wider">Business</div>
        <div className="flex items-center flex-shrink-0">
          <div className="w-14 text-right pr-4 text-[10px] font-medium text-gray-400 uppercase tracking-wider">Score</div>
          <div className="w-24 text-right pr-4 text-[10px] font-medium text-gray-400 uppercase tracking-wider">Rating</div>
          <div className="w-12 text-right pr-6 text-[10px] font-medium text-gray-400 uppercase tracking-wider">Rank</div>
        </div>
        <div className="w-[220px] flex-shrink-0"></div>
      </div>

      {/* Sections — only populated stages */}
      <div className="flex-1 overflow-y-auto">
        {populatedStatuses.map(status => (
          <StatusSection
            key={status}
            status={status}
            businesses={grouped[status]}
            onStatusChange={onStatusChange}
            onNotesChange={onNotesChange}
            onOutreachClick={onOutreachClick}
            onReportClick={onReportClick}
          />
        ))}
      </div>
    </div>
  );
}
