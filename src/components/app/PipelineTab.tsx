'use client';

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { EnrichedBusiness, LeadStatus } from '@/lib/types';
import { LEAD_STATUS_CONFIG, ALL_LEAD_STATUSES } from '@/lib/lead-constants';
import { calculateSeoNeedScore } from '@/lib/signals';
import { useAppContext } from '@/contexts/AppContext';
import { OutreachTemplatesModal } from '@/components/OutreachTemplatesModal';
import { PitchReportModal } from '@/components/PitchReportModal';
import { TabContent } from '@/components/app/AppShell';

const PAGE_SIZE = 25;

type SortKey = 'score' | 'name' | 'status' | 'rating' | 'updated';
type SortDir = 'asc' | 'desc';

const STATUS_ORDER: Record<LeadStatus, number> = { new: 0, contacted: 1, pitched: 2, won: 3, lost: 4 };

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
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border transition-colors cursor-pointer ${config.bg} ${config.color} ${config.border} hover:opacity-80`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
        {config.label}
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-30 py-1 min-w-[140px]">
          {ALL_LEAD_STATUSES.filter(s => s !== status).map(s => {
            const c = LEAD_STATUS_CONFIG[s];
            return (
              <button
                key={s}
                onClick={() => { onChange(s); setOpen(false); }}
                className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
                {c.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Notes inline editor ────────────────────────────────────────

function NotesEditor({ notes, onSave }: { notes: string; onSave: (n: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(notes);

  const save = () => {
    if (draft !== notes) onSave(draft);
    setEditing(false);
  };

  if (editing) {
    return (
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === 'Escape') { setDraft(notes); setEditing(false); }
          if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); save(); }
        }}
        placeholder="Add a note..."
        className="w-full max-w-xs h-16 text-xs text-gray-700 border border-gray-200 rounded-md p-2 resize-none focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500"
        autoFocus
      />
    );
  }

  return (
    <button
      onClick={() => { setDraft(notes); setEditing(true); }}
      className="px-2 py-1 text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
      title={notes || 'Add note'}
    >
      {notes ? (
        <span className="flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Note
        </span>
      ) : (
        <span className="flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Note
        </span>
      )}
    </button>
  );
}

// ── Main PipelineTab ───────────────────────────────────────────

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

  useEffect(() => {
    return () => { if (moveTimerRef.current) clearTimeout(moveTimerRef.current); };
  }, []);

  // Reset page when filters change
  useEffect(() => { setCurrentPage(1); }, [statusFilter, sourceFilter, searchQuery, sortKey, sortDir]);

  // Unique sources for filter dropdown
  const uniqueSources = useMemo(() => {
    const seen = new Set<string>();
    allLeads.forEach(l => {
      if (l.sourceNiche && l.sourceLocation) {
        seen.add(`${l.sourceNiche}|${l.sourceLocation}`);
      }
    });
    return Array.from(seen).sort();
  }, [allLeads]);

  // Status counts (unfiltered, for summary chips)
  const statusCounts = useMemo(() => {
    const c: Record<LeadStatus, number> = { new: 0, contacted: 0, pitched: 0, won: 0, lost: 0 };
    allLeads.forEach(b => { c[b.leadStatus || 'new']++; });
    return c;
  }, [allLeads]);

  // Compute scores once
  const leadsWithScores = useMemo(() => {
    return allLeads.map(l => ({ lead: l, score: calculateSeoNeedScore(l) }));
  }, [allLeads]);

  // Filter
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

  // Sort
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

  // Paginate
  const totalPages = Math.max(1, Math.ceil(sortedLeads.length / PAGE_SIZE));
  const paginatedLeads = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return sortedLeads.slice(start, start + PAGE_SIZE);
  }, [sortedLeads, currentPage]);

  // Handlers
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

  const SortArrow = ({ column }: { column: SortKey }) => {
    if (sortKey !== column) return null;
    return (
      <svg className="w-3 h-3 ml-0.5 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={sortDir === 'asc' ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'} />
      </svg>
    );
  };

  // ── Loading state ──────────────────────────────────────────────

  if (isLoadingLeads) {
    return (
      <TabContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse" />
            <div className="h-8 w-32 bg-gray-200 rounded-lg animate-pulse" />
          </div>
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-gray-100">
                <div className="h-6 w-20 bg-gray-100 rounded-full animate-pulse" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-4 w-48 bg-gray-100 rounded animate-pulse" />
                  <div className="h-3 w-64 bg-gray-50 rounded animate-pulse" />
                </div>
                <div className="h-4 w-12 bg-gray-100 rounded animate-pulse" />
                <div className="h-4 w-16 bg-gray-100 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </TabContent>
    );
  }

  // ── Empty state ────────────────────────────────────────────────

  if (allLeads.length === 0) {
    return (
      <TabContent>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-5">
            <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-1.5">No leads in pipeline</h3>
          <p className="text-sm text-gray-500 max-w-sm">
            Run a search and analyze businesses in the Lead Intel tab. Every analyzed business automatically appears here.
          </p>
        </div>
      </TabContent>
    );
  }

  // ── Main table view ────────────────────────────────────────────

  return (
    <TabContent>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pipeline</h1>
          <p className="text-sm text-gray-500 mt-0.5">{allLeads.length} total leads across all searches</p>
        </div>
        {/* Status summary chips */}
        <div className="hidden md:flex items-center gap-1.5">
          {ALL_LEAD_STATUSES.map(s => {
            const count = statusCounts[s];
            if (count === 0) return null;
            const c = LEAD_STATUS_CONFIG[s];
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(statusFilter === s ? 'all' : s)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border transition-all ${
                  statusFilter === s
                    ? `${c.bg} ${c.color} ${c.border} ring-1 ring-offset-1 ${c.border}`
                    : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${statusFilter === s ? c.dot : 'bg-gray-400'}`} />
                {c.label}
                <span className="font-bold">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4">
        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search leads..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-300 transition-colors"
          />
        </div>

        {/* Status filter (mobile-friendly) */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as LeadStatus | 'all')}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-300 md:hidden"
        >
          <option value="all">All Statuses</option>
          {ALL_LEAD_STATUSES.map(s => (
            <option key={s} value={s}>{LEAD_STATUS_CONFIG[s].label} ({statusCounts[s]})</option>
          ))}
        </select>

        {/* Source filter */}
        {uniqueSources.length > 1 && (
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-300"
          >
            <option value="all">All Sources</option>
            {uniqueSources.map(src => {
              const [niche, loc] = src.split('|');
              return <option key={src} value={src}>{niche} in {loc}</option>;
            })}
          </select>
        )}

        {/* Sort */}
        <select
          value={`${sortKey}-${sortDir}`}
          onChange={(e) => {
            const [k, d] = e.target.value.split('-') as [SortKey, SortDir];
            setSortKey(k);
            setSortDir(d);
          }}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-300 sm:hidden"
        >
          <option value="score-desc">Score (High)</option>
          <option value="score-asc">Score (Low)</option>
          <option value="name-asc">Name (A-Z)</option>
          <option value="name-desc">Name (Z-A)</option>
          <option value="rating-desc">Rating (High)</option>
          <option value="status-asc">Status</option>
        </select>
      </div>

      {/* Move notification */}
      {moveNotice && (
        <div className="mb-3 px-4 py-2.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-sm text-emerald-700 animate-in slide-in-from-top-2 fade-in duration-200">
          <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Moved <span className="font-medium">{moveNotice.name}</span> to <span className="font-medium">{LEAD_STATUS_CONFIG[moveNotice.to].label}</span>
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        {/* Sticky header */}
        <div className="flex items-center px-4 py-2.5 bg-gray-50 border-b border-gray-200 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
          <div className="w-24 flex-shrink-0">Status</div>
          <div className="flex-1 min-w-0 cursor-pointer select-none" onClick={() => handleSort('name')}>
            Business <SortArrow column="name" />
          </div>
          <div className="hidden md:block w-36 flex-shrink-0">Source</div>
          <div className="w-16 flex-shrink-0 text-right cursor-pointer select-none" onClick={() => handleSort('score')}>
            Score <SortArrow column="score" />
          </div>
          <div className="w-20 flex-shrink-0 text-right cursor-pointer select-none" onClick={() => handleSort('rating')}>
            Rating <SortArrow column="rating" />
          </div>
          <div className="w-28 flex-shrink-0 hidden md:block">Phone</div>
          <div className="hidden lg:block w-28 flex-shrink-0">Website</div>
          <div className="hidden lg:block w-20 flex-shrink-0 text-right cursor-pointer select-none" onClick={() => handleSort('updated')}>
            Activity <SortArrow column="updated" />
          </div>
          <div className="w-32 flex-shrink-0 text-right">Actions</div>
        </div>

        {/* Body rows */}
        {filteredLeads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <svg className="w-8 h-8 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p className="text-sm text-gray-500">No leads match your filters</p>
            <button
              onClick={() => { setStatusFilter('all'); setSourceFilter('all'); setSearchQuery(''); }}
              className="mt-2 text-xs text-violet-600 hover:text-violet-500 font-medium"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div>
            {paginatedLeads.map(({ lead, score }) => {
              const status = lead.leadStatus || 'new';
              return (
                <div
                  key={lead.leadId || lead.placeId || lead.name}
                  className="group flex items-center px-4 py-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50/60 transition-colors"
                >
                  {/* Status pill */}
                  <div className="w-24 flex-shrink-0">
                    <StatusPill status={status} onChange={(s) => handleStatusChange(lead, s)} />
                  </div>

                  {/* Business name + address */}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">{lead.name}</div>
                    <div className="text-xs text-gray-400 truncate">{lead.address}</div>
                  </div>

                  {/* Source chips */}
                  <div className="hidden md:flex w-36 flex-shrink-0 gap-1 flex-wrap">
                    {lead.sourceNiche && (
                      <span className="inline-block px-2 py-0.5 text-[10px] font-medium bg-gray-100 text-gray-600 rounded-full truncate max-w-[130px]">
                        {lead.sourceNiche}
                      </span>
                    )}
                  </div>

                  {/* Score */}
                  <div className="w-16 flex-shrink-0 text-right">
                    <span className={`text-sm font-semibold ${
                      score >= 70 ? 'text-emerald-600'
                      : score >= 40 ? 'text-amber-600'
                      : 'text-gray-400'
                    }`}>
                      {score}
                    </span>
                  </div>

                  {/* Rating */}
                  <div className="w-20 flex-shrink-0 text-right">
                    <span className="text-sm text-gray-700">{lead.rating > 0 ? lead.rating.toFixed(1) : '--'}</span>
                    <span className="text-xs text-gray-400 ml-0.5">({lead.reviewCount})</span>
                  </div>

                  {/* Phone */}
                  <div className="w-28 flex-shrink-0 hidden md:block">
                    {lead.phone ? (
                      <a href={`tel:${lead.phone}`} className="text-xs text-violet-600 hover:text-violet-500 truncate block">
                        {lead.phone}
                      </a>
                    ) : (
                      <span className="text-xs text-gray-300">--</span>
                    )}
                  </div>

                  {/* Website */}
                  <div className="hidden lg:block w-28 flex-shrink-0">
                    {lead.website ? (
                      <a
                        href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-violet-600 hover:text-violet-500 truncate block"
                      >
                        {lead.website.replace(/^https?:\/\/(www\.)?/, '').slice(0, 20)}
                      </a>
                    ) : (
                      <span className="text-xs text-gray-300">--</span>
                    )}
                  </div>

                  {/* Activity (days dormant) */}
                  <div className="hidden lg:block w-20 flex-shrink-0 text-right">
                    {lead.daysDormant !== null && lead.daysDormant !== undefined ? (
                      <span className={`text-xs ${
                        lead.daysDormant > 90 ? 'text-red-500'
                        : lead.daysDormant > 30 ? 'text-amber-500'
                        : 'text-gray-500'
                      }`}>
                        {lead.daysDormant}d
                      </span>
                    ) : (
                      <span className="text-xs text-gray-300">--</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="w-32 flex-shrink-0 flex items-center justify-end gap-0.5">
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setOutreachBusiness(lead)}
                        className="px-2 py-1 text-xs text-gray-500 hover:text-violet-600 hover:bg-violet-50 rounded transition-colors"
                      >
                        Outreach
                      </button>
                      <button
                        onClick={() => setReportBusiness(lead)}
                        className="px-2 py-1 text-xs text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
                      >
                        Report
                      </button>
                    </div>
                    <NotesEditor
                      notes={lead.leadNotes || ''}
                      onSave={(n) => handleNotesChange(lead, n)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-sm text-gray-500">
            Showing {((currentPage - 1) * PAGE_SIZE) + 1}–{Math.min(currentPage * PAGE_SIZE, sortedLeads.length)} of {sortedLeads.length}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
                  className={`w-8 h-8 text-sm rounded-lg transition-colors ${
                    currentPage === page
                      ? 'bg-violet-600 text-white'
                      : 'text-gray-600 hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  {page}
                </button>
              );
            })}
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
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
    </TabContent>
  );
}
