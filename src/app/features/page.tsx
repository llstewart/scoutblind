import { Metadata } from 'next';
import { FeaturesContent } from '@/components/marketing/FeaturesContent';

export const metadata: Metadata = {
  title: 'Features — Packleads',
  description: 'Find businesses that need your services. Get scored leads, personalized audit reports, and ready-to-send outreach — all from a single search.',
};

export default function FeaturesPage() {
  return <FeaturesContent />;
}
