'use client';

import { StatusType } from '@/lib/types';

interface StatusTagProps {
  status: StatusType;
  children: React.ReactNode;
  className?: string;
}

const statusStyles: Record<StatusType, string> = {
  success: 'bg-green-100 text-green-800 border-green-200',
  warning: 'bg-orange-100 text-orange-800 border-orange-200',
  error: 'bg-red-100 text-red-800 border-red-200',
  neutral: 'bg-gray-100 text-gray-800 border-gray-200',
};

export function StatusTag({ status, children, className = '' }: StatusTagProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusStyles[status]} ${className}`}
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
    success: 'bg-green-500',
    warning: 'bg-orange-500',
    error: 'bg-red-500',
    neutral: 'bg-gray-500',
  };

  return (
    <span className={`inline-block w-2 h-2 rounded-full ${dotColors[status]}`} />
  );
}
