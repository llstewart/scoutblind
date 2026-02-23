'use client';

import { BrandedSpinner } from '@/components/ui/BrandedSpinner';

export function CellSpinner() {
  return (
    <div className="flex items-center gap-2">
      <BrandedSpinner size="sm" />
      <span className="text-xs text-muted-foreground">Loading...</span>
    </div>
  );
}

export function CellSpinnerCompact() {
  return <BrandedSpinner size="sm" />;
}
