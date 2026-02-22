import { LeadStatus } from './types';

export const LEAD_STATUS_CONFIG: Record<LeadStatus, { label: string; color: string; bg: string; border: string; dot: string }> = {
  new:       { label: 'New',       color: 'text-gray-500',    bg: 'bg-gray-100',       border: 'border-gray-200',   dot: 'bg-gray-400' },
  contacted: { label: 'Contacted', color: 'text-blue-600',    bg: 'bg-blue-50',        border: 'border-blue-200',   dot: 'bg-blue-500' },
  pitched:   { label: 'Pitched',   color: 'text-amber-600',   bg: 'bg-amber-50',       border: 'border-amber-200',  dot: 'bg-amber-500' },
  won:       { label: 'Won',       color: 'text-emerald-600', bg: 'bg-emerald-50',     border: 'border-emerald-200', dot: 'bg-emerald-500' },
  lost:      { label: 'Lost',      color: 'text-red-600',     bg: 'bg-red-50',         border: 'border-red-200',    dot: 'bg-red-500' },
};

export const ALL_LEAD_STATUSES: LeadStatus[] = ['new', 'contacted', 'pitched', 'won', 'lost'];
