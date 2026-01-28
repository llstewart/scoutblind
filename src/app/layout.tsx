import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Locus - Market Intelligence for SEO Agencies',
  description: 'Identify high-propensity leads with Hidden Signals analysis',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white">
        <main className="min-h-screen">{children}</main>
      </body>
    </html>
  );
}
