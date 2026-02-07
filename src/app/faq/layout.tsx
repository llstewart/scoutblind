import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'FAQ',
  description: 'Frequently asked questions about Scoutblind. Learn about credits, GMB signals, pricing, data accuracy, and more.',
};

export default function FaqLayout({ children }: { children: React.ReactNode }) {
  return children;
}
