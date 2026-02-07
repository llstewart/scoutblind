import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Account',
  description: 'Manage your Scoutblind account, subscription, and billing.',
  robots: { index: false, follow: false },
};

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return children;
}
