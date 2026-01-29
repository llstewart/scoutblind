'use client';

export function CellSpinner() {
  return (
    <div className="flex items-center gap-2">
      <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      <span className="text-xs text-muted-foreground">Loading...</span>
    </div>
  );
}

export function CellSpinnerCompact() {
  return (
    <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
  );
}
