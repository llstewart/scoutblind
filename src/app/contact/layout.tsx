import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Get in touch with the Scoutblind team. Report bugs, ask billing questions, or request features.',
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
