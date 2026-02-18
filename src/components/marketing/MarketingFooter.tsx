import Link from 'next/link';

export function MarketingFooter() {
  return (
    <footer className="py-10 bg-gray-50 border-t border-gray-200">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <img src="/icon.svg" alt="" className="w-6 h-6" />
              <span className="text-base font-semibold text-gray-900">
                Packleads<span className="text-violet-500">.</span>
              </span>
            </Link>
            <p className="mt-2 text-xs text-gray-600 leading-relaxed">
              GBP signal analysis for agencies and freelancers. Find prospects who need your help.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">Product</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/features" className="text-xs text-gray-600 hover:text-gray-900 transition-colors">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-xs text-gray-600 hover:text-gray-900 transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-xs text-gray-600 hover:text-gray-900 transition-colors">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">Legal</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/privacy" className="text-xs text-gray-600 hover:text-gray-900 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-xs text-gray-600 hover:text-gray-900 transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">Support</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/contact" className="text-xs text-gray-600 hover:text-gray-900 transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-xs text-gray-600 hover:text-gray-900 transition-colors">
                  Help Center
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-gray-200 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="text-xs text-gray-500">
            &copy; {new Date().getFullYear()} Packleads. All rights reserved.
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-600">
            <Link href="/privacy" className="hover:text-gray-900 transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-gray-900 transition-colors">Terms</Link>
            <Link href="/contact" className="hover:text-gray-900 transition-colors">Contact</Link>
          </div>
        </div>

        <p className="mt-4 text-[10px] text-gray-400 text-center">
          Google and Google Business Profile are trademarks of Google LLC. Packleads is not affiliated with or endorsed by Google.
        </p>
      </div>
    </footer>
  );
}
