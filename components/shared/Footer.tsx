/**
 * Footer Component
 * Site-wide footer with links and copyright
 */

import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="col-span-1">
            <h3 className="text-sm font-semibold text-gray-900">Cindy from Cinder</h3>
            <p className="mt-2 text-sm text-gray-600">
              AI-powered interview coaching to help you ace your next job interview.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-900">Product</h4>
            <ul className="mt-4 space-y-2">
              <li>
                <Link href="/practice" className="text-sm text-gray-600 hover:text-gray-900">
                  Practice Sessions
                </Link>
              </li>
              <li>
                <Link href="/features" className="text-sm text-gray-600 hover:text-gray-900">
                  Features
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-900">Company</h4>
            <ul className="mt-4 space-y-2">
              <li>
                <Link href="/about" className="text-sm text-gray-600 hover:text-gray-900">
                  About
                </Link>
              </li>
              <li>
                <a
                  href="https://teamcinder.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Cinder AI
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-900">Legal</h4>
            <ul className="mt-4 space-y-2">
              <li>
                <Link href="/terms" className="text-sm text-gray-600 hover:text-gray-900">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-sm text-gray-600 hover:text-gray-900">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-gray-200 pt-8">
          <p className="text-sm text-gray-600">
            &copy; {new Date().getFullYear()} Cinder AI. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
