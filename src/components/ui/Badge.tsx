'use client';

import { ReactNode } from 'react';

type BadgeVariant = 'neutral' | 'success' | 'warning' | 'error' | 'brand' | 'info';
type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  children: ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  neutral: 'bg-gray-100 text-gray-600',
  success: 'bg-emerald-500/10 text-emerald-500',
  warning: 'bg-amber-500/10 text-amber-500',
  error: 'bg-rose-500/10 text-rose-500',
  brand: 'bg-violet-500/10 text-violet-500',
  info: 'bg-blue-500/10 text-blue-500',
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'text-[11px] px-1.5 py-0.5',
  md: 'text-xs px-2 py-0.5',
};

export function Badge({ variant = 'neutral', size = 'md', children, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {children}
    </span>
  );
}
