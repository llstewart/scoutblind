'use client';

type SpinnerSize = 'sm' | 'md' | 'lg';

interface BrandedSpinnerProps {
  size?: SpinnerSize;
  className?: string;
}

const sizeMap: Record<SpinnerSize, number> = {
  sm: 16,
  md: 24,
  lg: 40,
};

const strokeMap: Record<SpinnerSize, number> = {
  sm: 2.5,
  md: 3,
  lg: 3.5,
};

export function BrandedSpinner({ size = 'md', className = '' }: BrandedSpinnerProps) {
  const px = sizeMap[size];
  const sw = strokeMap[size];
  const r = (px - sw) / 2;
  const circumference = 2 * Math.PI * r;
  const arcLength = circumference * 0.75;

  return (
    <svg
      width={px}
      height={px}
      viewBox={`0 0 ${px} ${px}`}
      className={`animate-spin ${className}`}
      style={{ animationDuration: '0.8s' }}
    >
      <defs>
        <linearGradient id={`spinner-grad-${size}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#0d7c7b" />
          <stop offset="100%" stopColor="#78e3de" />
        </linearGradient>
      </defs>
      <circle
        cx={px / 2}
        cy={px / 2}
        r={r}
        fill="none"
        stroke={`url(#spinner-grad-${size})`}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeDasharray={`${arcLength} ${circumference - arcLength}`}
      />
    </svg>
  );
}
