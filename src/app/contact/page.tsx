'use client';

import { useState } from 'react';
import { MarketingLayout } from '@/components/marketing/MarketingLayout';

const subjects = [
  'General Inquiry',
  'Bug Report',
  'Billing Question',
  'Feature Request',
];

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState(subjects[0]);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{ success?: boolean; error?: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setResult(null);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, subject, message }),
      });

      const data = await res.json();

      if (res.ok) {
        setResult({ success: true });
        setName('');
        setEmail('');
        setSubject(subjects[0]);
        setMessage('');
      } else {
        setResult({ error: data.error || 'Something went wrong.' });
      }
    } catch {
      setResult({ error: 'Network error. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MarketingLayout>
      <div className="max-w-4xl mx-auto px-4 py-12 md:py-16">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Contact Us</h1>
        <p className="text-sm text-gray-500 mb-10">
          Have a question or need help? We&apos;d love to hear from you.
        </p>

        <div className="grid md:grid-cols-5 gap-10">
          {/* Left: Info */}
          <div className="md:col-span-2 space-y-6">
            <div>
              <h2 className="text-sm font-semibold text-gray-900 mb-2">Email</h2>
              <a
                href="mailto:support@scoutblind.com"
                className="text-sm text-violet-400 hover:text-violet-300 transition-colors"
              >
                support@scoutblind.com
              </a>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900 mb-2">Response Time</h2>
              <p className="text-sm text-gray-500">We typically respond within 24 hours on business days.</p>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900 mb-2">Common Topics</h2>
              <ul className="text-sm text-gray-500 space-y-1">
                <li>
                  <a href="/faq" className="text-violet-400 hover:text-violet-300 transition-colors">
                    Check our FAQ
                  </a>{' '}
                  for quick answers
                </li>
                <li>Billing issues? Include your account email</li>
                <li>Bug reports? Include steps to reproduce</li>
              </ul>
            </div>
          </div>

          {/* Right: Form */}
          <div className="md:col-span-3">
            {result?.success ? (
              <div className="p-6 bg-green-500/10 border border-green-500/20 rounded-xl text-center">
                <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-1">Message Sent</h3>
                <p className="text-sm text-gray-500">
                  Thanks for reaching out! We&apos;ll get back to you soon.
                </p>
                <button
                  onClick={() => setResult(null)}
                  className="mt-4 text-sm text-violet-400 hover:text-violet-300"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {result?.error && (
                  <div role="alert" className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                    {result.error}
                  </div>
                )}

                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-600 mb-1.5">
                    Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    maxLength={200}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-violet-500 transition-colors"
                    placeholder="Your name"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-600 mb-1.5">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    maxLength={200}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-violet-500 transition-colors"
                    placeholder="you@example.com"
                  />
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-600 mb-1.5">
                    Subject
                  </label>
                  <select
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-1 focus:ring-violet-500 transition-colors"
                  >
                    {subjects.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-600 mb-1.5">
                    Message
                  </label>
                  <textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    maxLength={5000}
                    rows={5}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-violet-500 transition-colors resize-none"
                    placeholder="How can we help?"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </MarketingLayout>
  );
}
