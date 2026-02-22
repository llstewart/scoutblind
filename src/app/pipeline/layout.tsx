import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pipeline',
  description: 'Track and manage your leads through the sales pipeline.',
  robots: { index: false, follow: false },
};

export default function PipelineLayout({ children }: { children: React.ReactNode }) {
  return children;
}
