'use client';

import { createContext, useContext, useState, useRef, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSearch } from '@/contexts/SearchContext';
import { useUI } from '@/contexts/UIContext';
import { EnrichedBusiness, LeadStatus, isPendingBusiness, isEnrichedBusiness } from '@/lib/types';

interface PipelineContextValue {
  allLeads: EnrichedBusiness[];
  isLoadingLeads: boolean;
  leadsError: string | null;
  statusFilter: LeadStatus | null;
  setStatusFilter: (filter: LeadStatus | null) => void;

  // Functions
  fetchAllLeads: () => Promise<void>;
  updateLeadDirect: (leadId: string, updates: { status?: LeadStatus; notes?: string }) => Promise<void>;
  deleteLeadsDirect: (leadIds: string[]) => Promise<boolean>;
  updateLeadStatus: (businessId: string, status: LeadStatus) => void;
  updateLeadNotes: (businessId: string, notes: string) => void;
}

const PipelineContext = createContext<PipelineContextValue | null>(null);

export function usePipeline() {
  const context = useContext(PipelineContext);
  if (!context) {
    throw new Error('usePipeline must be used within PipelineProvider');
  }
  return context;
}

interface PipelineProviderProps {
  children: ReactNode;
}

export function PipelineProvider({ children }: PipelineProviderProps) {
  const { user, isPremium } = useAuth();
  const { setTableBusinesses, searchParams } = useSearch();
  const { setToastMessage } = useUI();

  // Leads DB state
  const [allLeads, setAllLeads] = useState<EnrichedBusiness[]>([]);
  const [isLoadingLeads, setIsLoadingLeads] = useState(false);
  const [leadsError, setLeadsError] = useState<string | null>(null);
  const [hasLeadsLoaded, setHasLeadsLoaded] = useState(false);
  const backfillAttemptedRef = useRef(false);

  // Lead status filter (for ResultsView inline status filtering)
  const [statusFilter, setStatusFilter] = useState<LeadStatus | null>(null);

  // Lead save timer ref for debounced saves
  const leadSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // We need savedSearchesList.length for backfill check, but we can't import LibraryContext
  // (would create circular dep). Instead we fetch it inline in fetchAllLeads.
  const savedSearchesCountRef = useRef(0);

  // Fetch all leads from persistent DB
  const fetchAllLeads = useCallback(async () => {
    if (!user || !isPremium) return;
    setIsLoadingLeads(true);
    setLeadsError(null);
    try {
      const response = await fetch('/api/leads');
      if (response.ok) {
        const data = await response.json();
        setAllLeads(data.leads || []);
        setHasLeadsLoaded(true);

        // Auto-backfill: if no leads but user has saved searches, migrate once
        // Check saved searches count via API to avoid circular dependency
        if ((data.leads || []).length === 0 && !backfillAttemptedRef.current) {
          backfillAttemptedRef.current = true;
          try {
            const sessionRes = await fetch('/api/session');
            if (sessionRes.ok) {
              const sessionData = await sessionRes.json();
              const analyses = sessionData.analyses || {};
              if (Object.keys(analyses).length > 0) {
                const backfillRes = await fetch('/api/leads/backfill', { method: 'POST' });
                if (backfillRes.ok) {
                  const backfillData = await backfillRes.json();
                  if (backfillData.migrated > 0) {
                    // Re-fetch leads after backfill
                    const refreshRes = await fetch('/api/leads');
                    if (refreshRes.ok) {
                      const refreshData = await refreshRes.json();
                      setAllLeads(refreshData.leads || []);
                    }
                  }
                }
              }
            }
          } catch (err) {
            console.error('[Leads] Backfill failed:', err);
          }
        }
      } else {
        setLeadsError('Failed to load leads. Please try again.');
      }
    } catch (err) {
      console.error('[Leads] Failed to fetch:', err);
      setLeadsError('Could not connect to server. Check your connection and try again.');
    } finally {
      setIsLoadingLeads(false);
    }
  }, [user, isPremium]);

  // Debounced save after lead status/notes change
  const saveToLibrary = useCallback(async (
    enrichedBusinesses: EnrichedBusiness[],
    niche: string,
    location: string
  ) => {
    try {
      await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          niche,
          location,
          businesses: enrichedBusinesses,
        }),
      });
    } catch (error) {
      console.error('[Session] Failed to save to library:', error);
    }
  }, []);

  const debouncedLeadSave = useCallback(() => {
    if (leadSaveTimerRef.current) clearTimeout(leadSaveTimerRef.current);
    leadSaveTimerRef.current = setTimeout(() => {
      if (!searchParams) return;
      setTableBusinesses(current => {
        const enrichedOnly = current.filter((b): b is EnrichedBusiness =>
          !isPendingBusiness(b) && isEnrichedBusiness(b)
        );
        if (enrichedOnly.length > 0) {
          saveToLibrary(enrichedOnly, searchParams.niche, searchParams.location);
        }
        return current;
      });
    }, 2000);
  }, [searchParams, saveToLibrary, setTableBusinesses]);

  // Update lead status for a business (updates both SearchContext tableBusinesses and persists)
  const updateLeadStatus = useCallback((businessId: string, status: LeadStatus) => {
    setTableBusinesses(prev => prev.map(b => {
      if ((b.placeId || b.name) === businessId && !isPendingBusiness(b) && isEnrichedBusiness(b)) {
        return { ...b, leadStatus: status };
      }
      return b;
    }));
    debouncedLeadSave();
  }, [debouncedLeadSave, setTableBusinesses]);

  // Update lead notes for a business (updates both SearchContext tableBusinesses and persists)
  const updateLeadNotes = useCallback((businessId: string, notes: string) => {
    setTableBusinesses(prev => prev.map(b => {
      if ((b.placeId || b.name) === businessId && !isPendingBusiness(b) && isEnrichedBusiness(b)) {
        return { ...b, leadNotes: notes };
      }
      return b;
    }));
    debouncedLeadSave();
  }, [debouncedLeadSave, setTableBusinesses]);

  // Update a lead directly in the persistent DB (optimistic)
  const updateLeadDirect = useCallback(async (leadId: string, updates: { status?: LeadStatus; notes?: string }) => {
    const previousLeads = allLeads;
    setAllLeads(prev => prev.map(lead => {
      if (lead.leadId === leadId) {
        return {
          ...lead,
          ...(updates.status !== undefined ? { leadStatus: updates.status } : {}),
          ...(updates.notes !== undefined ? { leadNotes: updates.notes } : {}),
        };
      }
      return lead;
    }));

    try {
      const response = await fetch('/api/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId, ...updates }),
      });

      if (!response.ok) {
        setAllLeads(previousLeads);
        setToastMessage('Failed to update lead. Change reverted.');
      }
    } catch (err) {
      console.error('[Leads] Failed to update lead:', err);
      setAllLeads(previousLeads);
      setToastMessage('Failed to update lead. Change reverted.');
    }
  }, [allLeads, setToastMessage]);

  // Delete leads from persistent DB (optimistic)
  const deleteLeadsDirect = useCallback(async (leadIds: string[]): Promise<boolean> => {
    if (leadIds.length === 0) return false;

    const previousLeads = allLeads;
    setAllLeads(prev => prev.filter(lead => !leadIds.includes(lead.leadId || '')));

    try {
      const response = await fetch('/api/leads', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadIds }),
      });

      if (!response.ok) {
        setAllLeads(previousLeads);
        setToastMessage('Failed to delete leads. Changes reverted.');
        return false;
      }
      return true;
    } catch (err) {
      console.error('[Leads] Failed to delete leads:', err);
      setAllLeads(previousLeads);
      setToastMessage('Failed to delete leads. Changes reverted.');
      return false;
    }
  }, [allLeads, setToastMessage]);

  // Multi-tab sync for leads: re-fetch when tab becomes visible after being hidden
  useEffect(() => {
    if (!user || !isPremium) return;
    let hiddenAt = 0;
    const STALE_THRESHOLD = 30_000;

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        hiddenAt = Date.now();
      } else if (document.visibilityState === 'visible' && hiddenAt > 0) {
        const elapsed = Date.now() - hiddenAt;
        if (elapsed >= STALE_THRESHOLD && hasLeadsLoaded) {
          fetchAllLeads();
        }
        hiddenAt = 0;
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [user, isPremium, hasLeadsLoaded, fetchAllLeads]);

  // Reset state on sign out (user becomes null)
  useEffect(() => {
    if (!user) {
      setAllLeads([]);
      setHasLeadsLoaded(false);
      backfillAttemptedRef.current = false;
    }
  }, [user]);

  const value: PipelineContextValue = {
    allLeads,
    isLoadingLeads,
    leadsError,
    statusFilter,
    setStatusFilter,
    fetchAllLeads,
    updateLeadDirect,
    deleteLeadsDirect,
    updateLeadStatus,
    updateLeadNotes,
  };

  return (
    <PipelineContext.Provider value={value}>
      {children}
    </PipelineContext.Provider>
  );
}
