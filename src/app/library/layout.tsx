import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Library',
  description: 'Your saved market research and prospect analyses.',
  robots: { index: false, follow: false },
};

export default function LibraryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
