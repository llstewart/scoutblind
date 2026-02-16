'use client';

import { StatusType } from '@/lib/types';

interface StatusTagProps {
  status: StatusType;
  children: React.ReactNode;
  className?: string;
}

const statusStyles: Record<StatusType, string> = {
  success: 'bg-emerald-500/10 text-emerald-400',
  warning: 'bg-amber-500/10 text-amber-400',
  error: 'bg-rose-500/10 text-rose-400',
  neutral: 'bg-gray-100 text-gray-500',
};

export function StatusTag({ status, children, className = '' }: StatusTagProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusStyles[status]} ${className}`}
    >
      {children}
    </span>
  );
}

interface StatusDotProps {
  status: StatusType;
}

export function StatusDot({ status }: StatusDotProps) {
  const dotColors: Record<StatusType, string> = {
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    error: 'bg-rose-500',
    neutral: 'bg-gray-400',
  };

  return (
    <span className={`inline-block w-2 h-2 rounded-full ${dotColors[status]}`} />
  );
}
