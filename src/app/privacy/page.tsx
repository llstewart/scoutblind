import { MarketingLayout } from '@/components/marketing/MarketingLayout';

export const metadata = {
  title: 'Privacy Policy',
  description: 'How Scoutblind collects, uses, and protects your data. Learn about our third-party services, cookies, and your data rights.',
};

export default function PrivacyPage() {
  return (
    <MarketingLayout>
      <div className="max-w-3xl mx-auto px-4 py-12 md:py-16">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Privacy Policy</h1>
        <p className="text-sm text-zinc-500 mb-10">Last updated: February 2026</p>

        <div className="space-y-8 text-sm text-zinc-400 leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">1. Information We Collect</h2>
            <p className="mb-3">When you use Scoutblind, we collect the following information:</p>
            <ul className="list-disc list-inside space-y-1.5 text-zinc-500">
              <li><span className="text-zinc-400">Account information:</span> email address, full name, and password (or Google OAuth credentials)</li>
              <li><span className="text-zinc-400">Search queries:</span> the niche and location parameters you submit when running searches</li>
              <li><span className="text-zinc-400">Business data:</span> publicly available Google Business Profile data retrieved through your searches</li>
              <li><span className="text-zinc-400">Usage data:</span> credit usage, search history, and feature interactions</li>
              <li><span className="text-zinc-400">Payment information:</span> processed securely by Stripe — we do not store your card details</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">2. How We Use Your Data</h2>
            <ul className="list-disc list-inside space-y-1.5 text-zinc-500">
              <li>Providing and operating the Scoutblind service</li>
              <li>Processing your searches and delivering results</li>
              <li>Managing your account, credits, and subscriptions</li>
              <li>Sending transactional emails (account verification, password resets)</li>
              <li>Improving our service through aggregated, anonymized analytics</li>
              <li>Responding to support requests and contact form submissions</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">3. Third-Party Services</h2>
            <p className="mb-3">We use the following third-party services to operate Scoutblind:</p>
            <ul className="list-disc list-inside space-y-1.5 text-zinc-500">
              <li><span className="text-zinc-400">Supabase:</span> authentication, database storage, and user management</li>
              <li><span className="text-zinc-400">Stripe:</span> payment processing and subscription management</li>
              <li><span className="text-zinc-400">Google / Outscraper:</span> retrieving publicly available Google Business Profile data</li>
              <li><span className="text-zinc-400">Vercel:</span> application hosting and edge functions</li>
              <li><span className="text-zinc-400">Upstash:</span> rate limiting via Redis</li>
            </ul>
            <p className="mt-3">Each of these services has their own privacy policy governing their handling of data.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">4. Cookies &amp; Local Storage</h2>
            <p>
              We use essential cookies for authentication and session management. We use local storage to persist your preferences and UI state. We do not use third-party tracking cookies or advertising pixels.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">5. Data Retention &amp; Deletion</h2>
            <p className="mb-3">
              Your account data and search history are retained as long as your account is active. Cached search results may be retained for up to 24 hours to improve performance.
            </p>
            <p>
              You can delete your account at any time from the Account settings page. Upon deletion, we will remove your personal data, search history, and saved searches. Some anonymized, aggregated data may be retained for analytics purposes.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">6. Your Rights</h2>
            <ul className="list-disc list-inside space-y-1.5 text-zinc-500">
              <li>Access the personal data we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Delete your account and associated data</li>
              <li>Export your search results (via CSV export)</li>
              <li>Object to processing of your data for specific purposes</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">7. Data Security</h2>
            <p>
              We implement appropriate technical and organizational measures to protect your data, including encrypted connections (HTTPS/TLS), secure authentication via Supabase, and PCI-compliant payment processing via Stripe. However, no method of transmission over the Internet is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">8. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of significant changes by posting a notice on the website or sending an email. Continued use of Scoutblind after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">9. Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy or your data, please contact us at{' '}
              <a href="mailto:support@scoutblind.com" className="text-violet-400 hover:text-violet-300">
                support@scoutblind.com
              </a>{' '}
              or through our{' '}
              <a href="/contact" className="text-violet-400 hover:text-violet-300">
                contact page
              </a>.
            </p>
          </section>
        </div>
      </div>
    </MarketingLayout>
  );
}
