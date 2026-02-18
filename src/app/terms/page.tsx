import { MarketingLayout } from '@/components/marketing/MarketingLayout';

export const metadata = {
  title: 'Terms of Service',
  description: 'Terms and conditions for using Packleads. Read our acceptable use policy, billing terms, and data disclaimers.',
  alternates: { canonical: '/terms' },
};

export default function TermsPage() {
  return (
    <MarketingLayout>
      <div className="max-w-3xl mx-auto px-4 py-12 md:py-16">
        <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-2">Terms of Service</h1>
        <p className="text-sm text-gray-500 mb-10">Last updated: February 2026</p>

        <div className="space-y-8 text-sm text-gray-600 leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">1. Acceptance of Terms</h2>
            <p>
              By creating an account or using Packleads (&quot;the Service&quot;), operated by Packleads LLC, you agree to be bound by these Terms of Service. If you do not agree to these terms, do not use the Service. We may update these terms from time to time, and continued use constitutes acceptance of any changes.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">2. Account Registration</h2>
            <p className="mb-3">To use Packleads, you must create an account. You agree to:</p>
            <ul className="list-disc list-inside space-y-1.5 text-gray-500">
              <li>Provide accurate and complete registration information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Be responsible for all activity under your account</li>
              <li>Notify us immediately of any unauthorized access</li>
            </ul>
            <p className="mt-3">You must be at least 18 years old to create an account.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">3. Credits &amp; Billing</h2>
            <p className="mb-3">Packleads operates on a credit-based system:</p>
            <ul className="list-disc list-inside space-y-1.5 text-gray-500">
              <li>New accounts receive 5 free credits</li>
              <li>Additional credits can be purchased or obtained through subscription plans</li>
              <li>Each search consumes 1 credit, regardless of the number of results returned</li>
              <li><span className="text-gray-600">Credits are non-refundable</span> once used</li>
              <li>Unused subscription credits do not roll over to the next billing period</li>
            </ul>
            <p className="mt-3">
              Payments are processed securely through Stripe. Subscription plans are billed monthly and can be canceled at any time. Upon cancellation, you retain access until the end of your current billing period.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">4. Acceptable Use</h2>
            <p className="mb-3">You agree not to:</p>
            <ul className="list-disc list-inside space-y-1.5 text-gray-500">
              <li>Use automated scripts or bots to access the Service</li>
              <li>Resell, redistribute, or commercially share raw data obtained from Packleads</li>
              <li>Attempt to circumvent rate limits, credit restrictions, or access controls</li>
              <li>Use the Service for any unlawful purpose, including spam or harassment</li>
              <li>Reverse engineer, decompile, or disassemble any part of the Service</li>
              <li>Impersonate any person or entity when using the Service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">5. Intellectual Property</h2>
            <p>
              Packleads, its logo, design, features, and all related content are the intellectual property of Packleads and are protected by copyright, trademark, and other laws. You may use search results for your own business purposes (e.g., outreach, analysis) but may not claim ownership of the Service itself or its underlying technology.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">6. Data &amp; Disclaimers</h2>
            <p className="mb-3">
              Packleads provides data sourced from publicly available Google Business Profiles. While we strive for accuracy:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-gray-500">
              <li>We do not guarantee the completeness or accuracy of any business data</li>
              <li>Business information may change between the time of retrieval and your use</li>
              <li>Rankings and signal scores are algorithmic estimates, not guarantees</li>
              <li>The Service is provided &quot;as-is&quot; without warranties of any kind</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">7. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, Packleads and its operators shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the Service. Our total liability for any claims shall not exceed the amount you paid to us in the 12 months preceding the claim.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">8. Termination</h2>
            <p>
              We reserve the right to suspend or terminate your account at any time if you violate these Terms. You may delete your account at any time from the Account settings page. Upon termination, your right to use the Service ceases immediately. Provisions that by their nature should survive termination (such as limitations of liability) will remain in effect.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">9. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the State of Maryland, United States, without regard to its conflict of law provisions. Any disputes arising under these Terms shall be resolved in the state or federal courts located in Maryland.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">10. Contact Us</h2>
            <p>
              If you have questions about these Terms, please contact us at{' '}
              <a href="mailto:support@packleads.io" className="text-violet-400 hover:text-violet-300">
                support@packleads.io
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
