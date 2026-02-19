'use client';

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
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

// ── Status dropdown ─────────────────────────────────────────────

function StatusDropdown({
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
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-md hover:border-gray-300 hover:bg-gray-50 transition-colors"
      >
        Move to
        <svg className={`w-3 h-3 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-30 py-1 min-w-[140px]">
          {ALL_LEAD_STATUSES.filter(s => s !== currentStatus).map(s => (
            <button
              key={s}
              onClick={() => { onChange(s); setOpen(false); }}
              className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
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
        {/* Business info — flex-1 */}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-gray-900 truncate">{business.name}</div>
          {topSignal && (
            <p className="text-xs text-gray-500 mt-0.5 truncate">{topSignal}</p>
          )}
        </div>

        {/* Right panel — fixed width, shared with column headers */}
        <div className="flex-shrink-0 flex items-center w-[480px]">
          <div className="w-16 text-right">
            <span className="text-sm font-semibold text-gray-900">{score}</span>
          </div>
          <div className="w-28 text-right">
            <span className="text-sm text-gray-700">{business.rating > 0 ? business.rating : '--'}</span>
            <span className="text-xs text-gray-400 ml-0.5">({business.reviewCount})</span>
          </div>
          <div className="w-16 text-right">
            <span className="text-xs text-gray-500">
              {business.searchVisibility !== null ? `#${business.searchVisibility}` : '--'}
            </span>
          </div>

          {/* Actions — fixed right portion */}
          <div className="flex-1 flex items-center justify-end gap-1">
            {/* Hover actions */}
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
                className="px-2 py-1 text-xs text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
              >
                Note
              </button>
            </div>

            {/* Status dropdown — always visible */}
            <StatusDropdown currentStatus={status} onChange={onStatusChange} />
          </div>
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

  // Move notification
  const [moveNotice, setMoveNotice] = useState<{ name: string; to: LeadStatus } | null>(null);
  const moveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleStatusChange = useCallback((businessId: string, status: LeadStatus) => {
    const biz = enrichedBusinesses.find(b => (b.placeId || b.name) === businessId);
    onStatusChange(businessId, status);
    if (biz) {
      setMoveNotice({ name: biz.name, to: status });
      if (moveTimerRef.current) clearTimeout(moveTimerRef.current);
      moveTimerRef.current = setTimeout(() => setMoveNotice(null), 2500);
    }
  }, [enrichedBusinesses, onStatusChange]);

  useEffect(() => {
    return () => { if (moveTimerRef.current) clearTimeout(moveTimerRef.current); };
  }, []);

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

      {/* Column headers — same w-[480px] right panel as rows */}
      <div className="flex items-center px-5 py-2 border-b border-gray-200 bg-white flex-shrink-0">
        <div className="flex-1 text-[10px] font-medium text-gray-400 uppercase tracking-wider">Business</div>
        <div className="flex-shrink-0 flex items-center w-[480px]">
          <div className="w-16 text-right text-[10px] font-medium text-gray-400 uppercase tracking-wider">Score</div>
          <div className="w-28 text-right text-[10px] font-medium text-gray-400 uppercase tracking-wider">Rating</div>
          <div className="w-16 text-right text-[10px] font-medium text-gray-400 uppercase tracking-wider">Rank</div>
          <div className="flex-1"></div>
        </div>
      </div>

      {/* Move notification */}
      {moveNotice && (
        <div className="px-5 py-2 bg-gray-50 border-b border-gray-200 flex items-center gap-2 text-xs text-gray-600 flex-shrink-0">
          <svg className="w-3.5 h-3.5 text-violet-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>
            Moved <span className="font-medium text-gray-900">{moveNotice.name}</span> to <span className="font-medium text-gray-900">{STATUS_LABELS[moveNotice.to]}</span>
          </span>
        </div>
      )}

      {/* Sections */}
      <div className="flex-1 overflow-y-auto">
        {populatedStatuses.map(status => (
          <StatusSection
            key={status}
            status={status}
            businesses={grouped[status]}
            onStatusChange={handleStatusChange}
            onNotesChange={onNotesChange}
            onOutreachClick={onOutreachClick}
            onReportClick={onReportClick}
          />
        ))}
      </div>
    </div>
  );
}
