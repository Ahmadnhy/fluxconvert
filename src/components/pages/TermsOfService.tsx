'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { createClient } from '@/src/lib/supabase/client';
import UserProfile from '@/src/components/UserProfile';

export default function TermsOfService() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        setUserEmail(user?.email || null);
      } catch (error) {
        console.error('Auth check error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-[#1a1c1e] font-body-md antialiased flex flex-col">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 w-full sticky top-0 z-50">
        <div className="flex justify-between items-center w-full px-8 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-8">
            <Link className="text-[#1a1c1e] font-semibold text-lg" href="/">
              FluxConvert
            </Link>
            <div className="hidden md:flex gap-6 text-sm font-medium">
              <Link className="text-gray-600 hover:text-gray-900 transition-colors" href="/dashboard">
                Dashboard
              </Link>
              <Link className="text-gray-600 hover:text-gray-900 transition-colors" href="/privacy">
                Privacy
              </Link>
              <Link className="text-[#5b8ba8] hover:text-gray-900 transition-colors" href="/terms">
                Terms
              </Link>
              <Link className="text-gray-600 hover:text-gray-900 transition-colors" href="/help-center">
                Help Center
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {isLoading ? (
              <div className="w-9 h-9 rounded-full bg-gray-200 animate-pulse"></div>
            ) : userEmail ? (
              <UserProfile userEmail={userEmail} />
            ) : (
              <>
                <Link className="text-gray-700 text-sm font-medium hover:text-gray-900 transition-colors" href="/login">
                  Login
                </Link>
                <Link className="bg-[#5b8ba8] text-white px-4 py-2 rounded text-sm font-medium hover:bg-[#4a7a94] transition-colors" href="/register">
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto px-6 w-full py-12">
        <h1 className="text-4xl font-bold text-[#1a1c1e] mb-8">Terms of Service</h1>
        
        <div className="prose prose-lg max-w-none">
          <p className="text-gray-600 mb-6">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-[#1a1c1e] mb-4">Agreement to Terms</h2>
            <p className="text-gray-700 leading-relaxed">
              By accessing or using FluxConvert, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using this service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-[#1a1c1e] mb-4">Use License</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Permission is granted to temporarily use FluxConvert for personal or commercial document conversion purposes. This license shall automatically terminate if you violate any of these restrictions.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              You may not:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Use the service for any illegal purpose</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Upload malicious files or content</li>
              <li>Exceed rate limits or abuse the service</li>
              <li>Resell or redistribute our services</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-[#1a1c1e] mb-4">User Content</h2>
            <p className="text-gray-700 leading-relaxed">
              You retain all rights to the files you upload. By uploading files, you grant us a temporary license to process and convert them. We automatically delete all files after 7 days.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-[#1a1c1e] mb-4">Service Availability</h2>
            <p className="text-gray-700 leading-relaxed">
              We strive to maintain high availability but do not guarantee uninterrupted access. We reserve the right to modify or discontinue the service at any time without notice.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-[#1a1c1e] mb-4">Rate Limits</h2>
            <p className="text-gray-700 leading-relaxed">
              To ensure fair usage, we implement rate limits on conversions. Authenticated users can perform up to 10 conversions per hour. Unauthenticated users are limited to 3 conversions per hour per IP address.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-[#1a1c1e] mb-4">Disclaimer</h2>
            <p className="text-gray-700 leading-relaxed">
              The service is provided "as is" without warranties of any kind. We do not guarantee the accuracy, completeness, or quality of converted files. You use the service at your own risk.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-[#1a1c1e] mb-4">Limitation of Liability</h2>
            <p className="text-gray-700 leading-relaxed">
              FluxConvert shall not be liable for any damages arising from the use or inability to use the service, including but not limited to data loss, business interruption, or loss of profits.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-[#1a1c1e] mb-4">Changes to Terms</h2>
            <p className="text-gray-700 leading-relaxed">
              We reserve the right to modify these terms at any time. Continued use of the service after changes constitutes acceptance of the new terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-[#1a1c1e] mb-4">Contact Information</h2>
            <p className="text-gray-700 leading-relaxed">
              If you have any questions about these Terms of Service, please contact us at support@fluxconvert.com
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16 w-full">
        <div className="max-w-7xl mx-auto py-8 px-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[#1a1c1e] font-semibold text-base">FluxConvert</span>
            <span className="text-sm text-gray-600 ml-2">© {new Date().getFullYear()} FluxConvert. Precise tools for creative professionals.</span>
          </div>
          <div className="flex flex-wrap justify-center md:justify-end gap-x-6 gap-y-2 text-sm text-gray-600">
            <Link className="hover:text-gray-900 transition-colors" href="/privacy">
              Privacy Policy
            </Link>
            <Link className="hover:text-gray-900 transition-colors" href="/terms">
              Terms of Service
            </Link>
            <Link className="hover:text-gray-900 transition-colors" href="/help-center">
              Help Center
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
