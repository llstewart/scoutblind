import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'FAQ',
  description: 'Frequently asked questions about Scoutblind. Learn about credits, GBP signals, pricing, data accuracy, and more.',
  alternates: { canonical: '/faq' },
};

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is Scoutblind?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Scoutblind is a prospecting tool for agencies and freelancers who sell digital services to local businesses. It scans Google Business Profiles in any market and analyzes key signals — like review response rates, owner activity, profile completeness, and local pack rankings — to help you find businesses that actually need your services.',
      },
    },
    {
      '@type': 'Question',
      name: 'How do credits work?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Each search costs 1 credit. A search scans all GBP profiles for a given niche + location combination and returns a prioritized prospect list with signal analysis. You get 5 free credits when you sign up, and can purchase additional credits or subscribe to a monthly plan.',
      },
    },
    {
      '@type': 'Question',
      name: 'What GBP signals are analyzed?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'We analyze 10+ signals including: local pack ranking, review count and average rating, review response rate, last owner activity date, profile claim status, website presence and tech stack, business category optimization, photo count, and more. These signals are combined into an overall Need Score.',
      },
    },
    {
      '@type': 'Question',
      name: 'Where does the data come from?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'All business data comes from publicly available Google Maps and Google Business Profile listings. We retrieve this data in real-time when you run a search, so results reflect current public information.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is the data accurate?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Scoutblind employs high-performance algorithms that integrate real-time GBP data with the same analytical methodologies used by industry experts. Our system processes complex signals—like review trends and response metrics—through a technical lens to provide consistent, actionable intelligence.',
      },
    },
    {
      '@type': 'Question',
      name: 'How does pricing work?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Scoutblind offers a free tier (5 credits), a Starter plan ($29/mo for 50 credits), and a Pro plan ($79/mo for 200 credits). All plans include full signal analysis, CSV export, and search history. Subscriptions are billed monthly via Stripe and can be canceled anytime.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I export my data?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. Every search result can be exported as a CSV file containing all prospect data, signal scores, and contact information. The export is ready for import into your CRM or outreach tools.',
      },
    },
    {
      '@type': 'Question',
      name: 'How do I delete my account?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'You can delete your account from the Account settings page. This will permanently remove your personal data, search history, and saved searches. If you have an active subscription, please cancel it before deleting your account.',
      },
    },
    {
      '@type': 'Question',
      name: 'What payment methods are accepted?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'We accept all major credit and debit cards (Visa, Mastercard, American Express) through Stripe. We do not store your card details — all payment processing is handled securely by Stripe.',
      },
    },
  ],
};

export default function FaqLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      {children}
    </>
  );
}
