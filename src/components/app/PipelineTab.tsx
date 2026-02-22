'use client';

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { EnrichedBusiness, LeadStatus } from '@/lib/types';
import { LEAD_STATUS_CONFIG, ALL_LEAD_STATUSES } from '@/lib/lead-constants';
import { calculateSeoNeedScore } from '@/lib/signals';
import { useAppContext } from '@/contexts/AppContext';
import { OutreachTemplatesModal } from '@/components/OutreachTemplatesModal';
import { PitchReportModal } from '@/components/PitchReportModal';

const PAGE_SIZE = 25;

type SortKey = 'score' | 'name' | 'status' | 'rating' | 'updated';
type SortDir = 'asc' | 'desc';

const STATUS_ORDER: Record<LeadStatus, number> = { new: 0, contacted: 1, pitched: 2, won: 3, lost: 4 };

// ── Score ring — tiny donut to visualize the 0-100 score ─────

function ScoreRing({ score }: { score: number }) {
  const r = 14;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#9ca3af';

  return (
    <div className="relative inline-flex items-center justify-center w-9 h-9">
      <svg className="w-9 h-9 -rotate-90" viewBox="0 0 36 36">
        <circle cx="18" cy="18" r={r} fill="none" stroke="#f3f4f6" strokeWidth="3" />
        <circle
          cx="18" cy="18" r={r} fill="none"
          stroke={color} strokeWidth="3"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" className="transition-all duration-500"
        />
      </svg>
      <span className="absolute text-[10px] font-bold text-gray-700">{score}</span>
    </div>
  );
}

// ── Status pill (clickable to change) ──────────────────────────

function StatusPill({ status, onChange }: { status: LeadStatus; onChange: (s: LeadStatus) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const config = LEAD_STATUS_CONFIG[status];

  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded-md border transition-all cursor-pointer whitespace-nowrap ${config.bg} ${config.color} ${config.border} hover:shadow-sm`}
      >
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${config.dot}`} />
        {config.label}
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl shadow-black/8 z-50 py-1 min-w-[130px]">
          {ALL_LEAD_STATUSES.filter(s => s !== status).map(s => {
            const c = LEAD_STATUS_CONFIG[s];
            return (
              <button
                key={s}
                onClick={() => { onChange(s); setOpen(false); }}
                className="w-full text-left px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${c.dot}`} />
                {c.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Row action bar (appears on hover) ─────────────────────────

function RowActions({
  lead,
  notes,
  onOutreach,
  onReport,
  onNotesSave,
}: {
  lead: EnrichedBusiness;
  notes: string;
  onOutreach: () => void;
  onReport: () => void;
  onNotesSave: (n: string) => void;
}) {
  const [editingNote, setEditingNote] = useState(false);
  const [draft, setDraft] = useState(notes);

  const save = () => {
    if (draft !== notes) onNotesSave(draft);
    setEditingNote(false);
  };

  if (editingNote) {
    return (
      <div className="flex items-start gap-2" onClick={(e) => e.stopPropagation()}>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={save}
          onKeyDown={(e) => {
            if (e.key === 'Escape') { setDraft(notes); setEditingNote(false); }
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); save(); }
          }}
          placeholder="Add a note..."
          className="w-52 h-14 text-xs text-gray-700 border border-gray-300 rounded-lg p-2 resize-none focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400"
          autoFocus
        />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={onOutreach}
        className="px-2.5 py-1 text-[11px] font-medium text-violet-600 bg-violet-50 hover:bg-violet-100 rounded-md transition-colors whitespace-nowrap"
      >
        Outreach
      </button>
      <button
        onClick={onReport}
        className="px-2.5 py-1 text-[11px] font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors whitespace-nowrap"
      >
        Report
      </button>
      <button
        onClick={() => { setDraft(notes); setEditingNote(true); }}
        className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
        title={notes || 'Add note'}
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      </button>
    </div>
  );
}

// ── Mobile lead card ──────────────────────────────────────────

function MobileLeadCard({
  lead,
  score,
  onStatusChange,
  onOutreach,
  onReport,
  onNotesSave,
}: {
  lead: EnrichedBusiness;
  score: number;
  onStatusChange: (s: LeadStatus) => void;
  onOutreach: () => void;
  onReport: () => void;
  onNotesSave: (n: string) => void;
}) {
  const status = lead.leadStatus || 'new';

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
      {/* Top row: status + score */}
      <div className="flex items-center justify-between">
        <StatusPill status={status} onChange={onStatusChange} />
        <ScoreRing score={score} />
      </div>

      {/* Business info */}
      <div className="min-w-0">
        <h3 className="text-sm font-semibold text-gray-900 truncate">{lead.name}</h3>
        <p className="text-xs text-gray-400 truncate mt-0.5">{lead.address}</p>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-4 text-xs">
        <div>
          <span className="text-gray-400">Rating</span>
          <span className="ml-1.5 font-medium text-gray-700">
            {lead.rating > 0 ? lead.rating.toFixed(1) : '--'}
            <span className="text-gray-400 font-normal ml-0.5">({lead.reviewCount})</span>
          </span>
        </div>
        {lead.daysDormant != null && (
          <div>
            <span className="text-gray-400">Dormant</span>
            <span className={`ml-1.5 font-medium ${lead.daysDormant > 90 ? 'text-red-500' : lead.daysDormant > 30 ? 'text-amber-500' : 'text-gray-600'}`}>
              {lead.daysDormant}d
            </span>
          </div>
        )}
        {lead.sourceNiche && (
          <span className="px-2 py-0.5 text-[10px] font-medium bg-gray-100 text-gray-500 rounded-full truncate max-w-[120px]">
            {lead.sourceNiche}
          </span>
        )}
      </div>

      {/* Contact row */}
      <div className="flex items-center gap-3 text-xs">
        {lead.phone && (
          <a href={`tel:${lead.phone}`} className="text-violet-600 hover:text-violet-500 flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            {lead.phone}
          </a>
        )}
        {lead.website && (
          <a
            href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
            target="_blank" rel="noopener noreferrer"
            className="text-violet-600 hover:text-violet-500 flex items-center gap-1 truncate"
          >
            <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            <span className="truncate">{lead.website.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}</span>
          </a>
        )}
      </div>

      {/* Note indicator */}
      {lead.leadNotes && (
        <p className="text-[11px] text-gray-400 italic truncate border-t border-gray-100 pt-2">
          {lead.leadNotes}
        </p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
        <RowActions lead={lead} notes={lead.leadNotes || ''} onOutreach={onOutreach} onReport={onReport} onNotesSave={onNotesSave} />
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// ── Main PipelineTab ─────────────────────────────────────────
// ══════════════════════════════════════════════════════════════

export function PipelineTab() {
  const { allLeads, isLoadingLeads, updateLeadDirect, searchParams: contextSearchParams } = useAppContext();

  // Filters
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Sort
  const [sortKey, setSortKey] = useState<SortKey>('score');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // Modals
  const [outreachBusiness, setOutreachBusiness] = useState<EnrichedBusiness | null>(null);
  const [reportBusiness, setReportBusiness] = useState<EnrichedBusiness | null>(null);

  // Move notification
  const [moveNotice, setMoveNotice] = useState<{ name: string; to: LeadStatus } | null>(null);
  const moveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Scroll tracking for table shadow
  const scrollRef = useRef<HTMLDivElement>(null);
  const [hasScrolled, setHasScrolled] = useState(false);

  useEffect(() => {
    return () => { if (moveTimerRef.current) clearTimeout(moveTimerRef.current); };
  }, []);

  useEffect(() => { setCurrentPage(1); }, [statusFilter, sourceFilter, searchQuery, sortKey, sortDir]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => setHasScrolled(el.scrollTop > 0);
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  // ── Derived data ─────────────────────────────────────────────

  const uniqueSources = useMemo(() => {
    const seen = new Set<string>();
    allLeads.forEach(l => {
      if (l.sourceNiche && l.sourceLocation) {
        seen.add(`${l.sourceNiche}|${l.sourceLocation}`);
      }
    });
    return Array.from(seen).sort();
  }, [allLeads]);

  const statusCounts = useMemo(() => {
    const c: Record<LeadStatus, number> = { new: 0, contacted: 0, pitched: 0, won: 0, lost: 0 };
    allLeads.forEach(b => { c[b.leadStatus || 'new']++; });
    return c;
  }, [allLeads]);

  const leadsWithScores = useMemo(() => {
    return allLeads.map(l => ({ lead: l, score: calculateSeoNeedScore(l) }));
  }, [allLeads]);

  const filteredLeads = useMemo(() => {
    return leadsWithScores.filter(({ lead }) => {
      if (statusFilter !== 'all' && (lead.leadStatus || 'new') !== statusFilter) return false;
      if (sourceFilter !== 'all') {
        const src = `${lead.sourceNiche || ''}|${lead.sourceLocation || ''}`;
        if (src !== sourceFilter) return false;
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!lead.name.toLowerCase().includes(q) && !lead.address.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [leadsWithScores, statusFilter, sourceFilter, searchQuery]);

  const sortedLeads = useMemo(() => {
    const arr = [...filteredLeads];
    const dir = sortDir === 'asc' ? 1 : -1;
    arr.sort((a, b) => {
      switch (sortKey) {
        case 'score': return (a.score - b.score) * dir;
        case 'name': return a.lead.name.localeCompare(b.lead.name) * dir;
        case 'status': return (STATUS_ORDER[a.lead.leadStatus || 'new'] - STATUS_ORDER[b.lead.leadStatus || 'new']) * dir;
        case 'rating': return ((a.lead.rating || 0) - (b.lead.rating || 0)) * dir;
        case 'updated': return ((a.lead.daysDormant ?? 999) - (b.lead.daysDormant ?? 999)) * dir;
        default: return 0;
      }
    });
    return arr;
  }, [filteredLeads, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sortedLeads.length / PAGE_SIZE));
  const paginatedLeads = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return sortedLeads.slice(start, start + PAGE_SIZE);
  }, [sortedLeads, currentPage]);

  // Pipeline metrics
  const activeLeads = statusCounts.new + statusCounts.contacted + statusCounts.pitched;
  const wonRate = allLeads.length > 0 ? Math.round((statusCounts.won / allLeads.length) * 100) : 0;

  // ── Handlers ─────────────────────────────────────────────────

  const handleStatusChange = useCallback((lead: EnrichedBusiness, newStatus: LeadStatus) => {
    if (!lead.leadId) return;
    updateLeadDirect(lead.leadId, { status: newStatus });
    setMoveNotice({ name: lead.name, to: newStatus });
    if (moveTimerRef.current) clearTimeout(moveTimerRef.current);
    moveTimerRef.current = setTimeout(() => setMoveNotice(null), 2500);
  }, [updateLeadDirect]);

  const handleNotesChange = useCallback((lead: EnrichedBusiness, notes: string) => {
    if (!lead.leadId) return;
    updateLeadDirect(lead.leadId, { notes });
  }, [updateLeadDirect]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir(key === 'name' ? 'asc' : 'desc');
    }
  };

  const SortIndicator = ({ column }: { column: SortKey }) => (
    <span className={`inline-flex ml-1 ${sortKey === column ? 'text-violet-500' : 'text-gray-300'}`}>
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        {sortKey === column
          ? <path strokeLinecap="round" strokeLinejoin="round" d={sortDir === 'asc' ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'} />
          : <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        }
      </svg>
    </span>
  );

  // ── Loading ──────────────────────────────────────────────────

  if (isLoadingLeads) {
    return (
      <div className="p-4 md:p-6 space-y-5">
        {/* Skeleton KPI */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-white border border-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
        {/* Skeleton toolbar */}
        <div className="flex gap-3">
          <div className="h-10 flex-1 max-w-xs bg-gray-100 rounded-lg animate-pulse" />
          <div className="h-10 w-32 bg-gray-100 rounded-lg animate-pulse" />
        </div>
        {/* Skeleton table */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="h-10 bg-gray-50 border-b border-gray-200" />
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-3.5 border-b border-gray-100">
              <div className="h-6 w-20 bg-gray-100 rounded-md animate-pulse" />
              <div className="flex-1 space-y-1.5">
                <div className="h-4 w-44 bg-gray-100 rounded animate-pulse" />
                <div className="h-3 w-56 bg-gray-50 rounded animate-pulse" />
              </div>
              <div className="h-9 w-9 bg-gray-100 rounded-full animate-pulse" />
              <div className="h-4 w-14 bg-gray-50 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Empty ────────────────────────────────────────────────────

  if (allLeads.length === 0) {
    return (
      <div className="p-4 md:p-6">
        <div className="flex flex-col items-center justify-center py-28 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-100 to-violet-50 flex items-center justify-center mb-6 shadow-sm">
            <svg className="w-8 h-8 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Your pipeline is empty</h3>
          <p className="text-sm text-gray-500 max-w-md leading-relaxed">
            Every business you analyze through Lead Intel automatically becomes a lead here.
            Run a search and get intel on businesses to start building your pipeline.
          </p>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════
  // ── Main view ──────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════

  return (
    <div className="p-4 md:p-6 space-y-5">

      {/* ── KPI strip ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border border-gray-200 rounded-xl px-4 py-3.5">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Total Leads</p>
          <p className="text-2xl font-extrabold text-gray-900 mt-1">{allLeads.length}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl px-4 py-3.5">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Active</p>
          <p className="text-2xl font-extrabold text-gray-900 mt-1">{activeLeads}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl px-4 py-3.5">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Won</p>
          <p className="text-2xl font-extrabold text-emerald-600 mt-1">{statusCounts.won}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl px-4 py-3.5">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Win Rate</p>
          <p className="text-2xl font-extrabold text-gray-900 mt-1">{wonRate}<span className="text-base font-semibold text-gray-400">%</span></p>
        </div>
      </div>

      {/* ── Toolbar ────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        {/* Status filter chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 -mb-1 scrollbar-none">
          <button
            onClick={() => setStatusFilter('all')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all whitespace-nowrap ${
              statusFilter === 'all'
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            All
            <span className={`text-[10px] font-bold ${statusFilter === 'all' ? 'text-gray-400' : 'text-gray-400'}`}>{allLeads.length}</span>
          </button>
          {ALL_LEAD_STATUSES.map(s => {
            const count = statusCounts[s];
            const c = LEAD_STATUS_CONFIG[s];
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(statusFilter === s ? 'all' : s)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all whitespace-nowrap ${
                  statusFilter === s
                    ? `${c.bg} ${c.color} ${c.border}`
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${statusFilter === s ? c.dot : 'bg-gray-300'}`} />
                {c.label}
                <span className="text-[10px] font-bold opacity-60">{count}</span>
              </button>
            );
          })}
        </div>

        {/* Search + dropdowns row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or address..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-300 transition-all"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            )}
          </div>

          {uniqueSources.length > 1 && (
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-300"
            >
              <option value="all">All sources</option>
              {uniqueSources.map(src => {
                const [niche, loc] = src.split('|');
                return <option key={src} value={src}>{niche} in {loc}</option>;
              })}
            </select>
          )}

          {/* Sort dropdown for mobile */}
          <select
            value={`${sortKey}-${sortDir}`}
            onChange={(e) => {
              const [k, d] = e.target.value.split('-') as [SortKey, SortDir];
              setSortKey(k); setSortDir(d);
            }}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-300 sm:hidden"
          >
            <option value="score-desc">Score (High to Low)</option>
            <option value="score-asc">Score (Low to High)</option>
            <option value="name-asc">Name (A-Z)</option>
            <option value="rating-desc">Rating (High to Low)</option>
            <option value="status-asc">Status</option>
          </select>

          {/* Result count */}
          <span className="hidden sm:inline-flex text-xs text-gray-400 self-center whitespace-nowrap ml-auto">
            {filteredLeads.length === allLeads.length
              ? `${allLeads.length} leads`
              : `${filteredLeads.length} of ${allLeads.length}`
            }
          </span>
        </div>
      </div>

      {/* ── Move notification ──────────────────────────────────── */}
      {moveNotice && (
        <div className="px-4 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-sm text-emerald-700 animate-in slide-in-from-top-2 fade-in duration-200">
          <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Moved <span className="font-semibold">{moveNotice.name}</span> to <span className="font-semibold">{LEAD_STATUS_CONFIG[moveNotice.to].label}</span>
        </div>
      )}

      {/* ── No results ─────────────────────────────────────────── */}
      {filteredLeads.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl">
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <svg className="w-10 h-10 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p className="text-sm font-medium text-gray-600 mb-1">No leads match your filters</p>
            <p className="text-xs text-gray-400 mb-4">Try adjusting your search or filter criteria</p>
            <button
              onClick={() => { setStatusFilter('all'); setSourceFilter('all'); setSearchQuery(''); }}
              className="px-4 py-2 text-xs font-semibold text-violet-600 bg-violet-50 hover:bg-violet-100 rounded-lg transition-colors"
            >
              Clear all filters
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* ── Desktop table ────────────────────────────────────── */}
          <div className="hidden md:block bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div
              ref={scrollRef}
              className="overflow-auto max-h-[calc(100vh-380px)] min-h-[300px]"
            >
              {/* Scroll shadow */}
              {hasScrolled && (
                <div className="sticky top-10 left-0 right-0 h-3 bg-gradient-to-b from-black/[0.04] to-transparent z-[5] -mt-3 pointer-events-none" />
              )}

              <table className="w-full min-w-full">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-gray-50/95 backdrop-blur-sm border-b border-gray-200">
                    <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-5 py-2.5 w-28">
                      Status
                    </th>
                    <th
                      className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-3 py-2.5 cursor-pointer select-none hover:text-gray-700 transition-colors"
                      style={{ minWidth: '200px' }}
                      onClick={() => handleSort('name')}
                    >
                      <span className="inline-flex items-center">Business <SortIndicator column="name" /></span>
                    </th>
                    <th
                      className="text-center text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-3 py-2.5 cursor-pointer select-none hover:text-gray-700 transition-colors w-16"
                      onClick={() => handleSort('score')}
                    >
                      <span className="inline-flex items-center">Score <SortIndicator column="score" /></span>
                    </th>
                    <th
                      className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-3 py-2.5 cursor-pointer select-none hover:text-gray-700 transition-colors w-24"
                      onClick={() => handleSort('rating')}
                    >
                      <span className="inline-flex items-center">Rating <SortIndicator column="rating" /></span>
                    </th>
                    <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-3 py-2.5" style={{ minWidth: '120px' }}>
                      Contact
                    </th>
                    <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-3 py-2.5 w-28">
                      Source
                    </th>
                    <th
                      className="text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-3 py-2.5 cursor-pointer select-none hover:text-gray-700 transition-colors w-20"
                      onClick={() => handleSort('updated')}
                    >
                      <span className="inline-flex items-center justify-end">Activity <SortIndicator column="updated" /></span>
                    </th>
                    <th className="text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-5 py-2.5 w-36">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedLeads.map(({ lead, score }) => {
                    const status = lead.leadStatus || 'new';
                    return (
                      <tr
                        key={lead.leadId || lead.placeId || lead.name}
                        className="group hover:bg-violet-50/30 transition-colors"
                      >
                        {/* Status */}
                        <td className="px-5 py-3 align-middle">
                          <StatusPill status={status} onChange={(s) => handleStatusChange(lead, s)} />
                        </td>

                        {/* Business */}
                        <td className="px-3 py-3 align-middle" style={{ minWidth: '200px' }}>
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate max-w-[280px]">{lead.name}</div>
                            <div className="text-[11px] text-gray-400 truncate max-w-[280px] mt-0.5">{lead.address}</div>
                            {lead.leadNotes && (
                              <div className="text-[10px] text-gray-400 italic truncate max-w-[280px] mt-1 flex items-center gap-1">
                                <svg className="w-2.5 h-2.5 flex-shrink-0 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                                </svg>
                                {lead.leadNotes}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Score */}
                        <td className="px-3 py-3 align-middle text-center w-16">
                          <ScoreRing score={score} />
                        </td>

                        {/* Rating */}
                        <td className="px-3 py-3 align-middle w-24">
                          <div className="flex items-baseline gap-1">
                            <span className="text-sm font-medium text-gray-800">
                              {lead.rating > 0 ? lead.rating.toFixed(1) : '--'}
                            </span>
                            <span className="text-[11px] text-gray-400">({lead.reviewCount})</span>
                          </div>
                        </td>

                        {/* Contact (phone + website stacked) */}
                        <td className="px-3 py-3 align-middle" style={{ minWidth: '120px' }}>
                          <div className="space-y-1">
                            {lead.phone ? (
                              <a href={`tel:${lead.phone}`} className="text-xs text-gray-700 hover:text-violet-600 transition-colors flex items-center gap-1.5 group/link">
                                <svg className="w-3 h-3 text-gray-400 group-hover/link:text-violet-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                                <span className="truncate max-w-[140px]">{lead.phone}</span>
                              </a>
                            ) : (
                              <span className="text-xs text-gray-300 flex items-center gap-1.5">
                                <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                --
                              </span>
                            )}
                            {lead.website ? (
                              <a
                                href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                                target="_blank" rel="noopener noreferrer"
                                className="text-xs text-gray-700 hover:text-violet-600 transition-colors flex items-center gap-1.5 group/link"
                              >
                                <svg className="w-3 h-3 text-gray-400 group-hover/link:text-violet-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                                <span className="truncate max-w-[140px]">{lead.website.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}</span>
                              </a>
                            ) : (
                              <span className="text-xs text-gray-300 flex items-center gap-1.5">
                                <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                --
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Source */}
                        <td className="px-3 py-3 align-middle w-28">
                          {lead.sourceNiche ? (
                            <span className="inline-block px-2 py-0.5 text-[10px] font-medium bg-gray-100 text-gray-500 rounded-md truncate max-w-[100px]">
                              {lead.sourceNiche}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-300">--</span>
                          )}
                        </td>

                        {/* Activity */}
                        <td className="px-3 py-3 align-middle text-right w-20">
                          {lead.daysDormant != null ? (
                            <span className={`inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded-md ${
                              lead.daysDormant > 90
                                ? 'bg-red-50 text-red-600'
                                : lead.daysDormant > 30
                                  ? 'bg-amber-50 text-amber-600'
                                  : 'bg-gray-50 text-gray-500'
                            }`}>
                              {lead.daysDormant}d
                            </span>
                          ) : (
                            <span className="text-xs text-gray-300">--</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-3 align-middle text-right w-36">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                            <RowActions
                              lead={lead}
                              notes={lead.leadNotes || ''}
                              onOutreach={() => setOutreachBusiness(lead)}
                              onReport={() => setReportBusiness(lead)}
                              onNotesSave={(n) => handleNotesChange(lead, n)}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Mobile cards ─────────────────────────────────────── */}
          <div className="md:hidden space-y-3">
            {paginatedLeads.map(({ lead, score }) => (
              <MobileLeadCard
                key={lead.leadId || lead.placeId || lead.name}
                lead={lead}
                score={score}
                onStatusChange={(s) => handleStatusChange(lead, s)}
                onOutreach={() => setOutreachBusiness(lead)}
                onReport={() => setReportBusiness(lead)}
                onNotesSave={(n) => handleNotesChange(lead, n)}
              />
            ))}
          </div>
        </>
      )}

      {/* ── Pagination ─────────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-sm text-gray-500">
            {((currentPage - 1) * PAGE_SIZE) + 1}&ndash;{Math.min(currentPage * PAGE_SIZE, sortedLeads.length)} of {sortedLeads.length}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 text-sm font-medium border border-gray-200 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Prev
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let page: number;
              if (totalPages <= 5) {
                page = i + 1;
              } else if (currentPage <= 3) {
                page = i + 1;
              } else if (currentPage >= totalPages - 2) {
                page = totalPages - 4 + i;
              } else {
                page = currentPage - 2 + i;
              }
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-9 h-9 text-sm font-medium rounded-lg transition-colors ${
                    currentPage === page
                      ? 'bg-violet-600 text-white shadow-sm'
                      : 'text-gray-600 hover:bg-gray-50 border border-gray-200 bg-white'
                  }`}
                >
                  {page}
                </button>
              );
            })}
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 text-sm font-medium border border-gray-200 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* ── Modals ─────────────────────────────────────────────── */}
      {outreachBusiness && (
        <OutreachTemplatesModal
          business={outreachBusiness}
          niche={outreachBusiness.sourceNiche || contextSearchParams?.niche || ''}
          onClose={() => setOutreachBusiness(null)}
        />
      )}
      {reportBusiness && (
        <PitchReportModal
          business={reportBusiness}
          niche={reportBusiness.sourceNiche}
          location={reportBusiness.sourceLocation}
          onClose={() => setReportBusiness(null)}
        />
      )}
    </div>
  );
}
