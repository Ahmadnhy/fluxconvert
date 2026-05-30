'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { createClient } from '@/src/lib/supabase/client';
import UserProfile from '@/src/components/UserProfile';

export default function PrivacyPolicy() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
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
              <Link className="text-gray-600 hover:text-gray-900 transition-colors" href="/word-to-pdf">
                Word to PDF
              </Link>
              <Link className="text-gray-600 hover:text-gray-900 transition-colors" href="/pdf-to-word">
                PDF to Word
              </Link>
              <Link className="text-gray-600 hover:text-gray-900 transition-colors" href="/dashboard">
                Dashboard
              </Link>
              <Link className="text-[#5b8ba8] hover:text-gray-900 transition-colors" href="/privacy">
                Privacy
              </Link>
              <Link className="text-gray-600 hover:text-gray-900 transition-colors" href="/terms">
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
        <h1 className="text-4xl font-bold text-[#1a1c1e] mb-8">Privacy Policy</h1>
        
        <div className="prose prose-lg max-w-none">
          <p className="text-gray-600 mb-6">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-[#1a1c1e] mb-4">Introduction</h2>
            <p className="text-gray-700 leading-relaxed">
              FluxConvert ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our document conversion services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-[#1a1c1e] mb-4">Information We Collect</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We collect information that you provide directly to us, including:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Account information (email address, password)</li>
              <li>Files you upload for conversion</li>
              <li>Usage data and conversion history</li>
              <li>Device and browser information</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-[#1a1c1e] mb-4">How We Use Your Information</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We use the information we collect to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Provide, maintain, and improve our services</li>
              <li>Process your document conversions</li>
              <li>Send you technical notices and support messages</li>
              <li>Monitor and analyze usage patterns</li>
              <li>Detect and prevent fraud and abuse</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-[#1a1c1e] mb-4">Data Security</h2>
            <p className="text-gray-700 leading-relaxed">
              We implement appropriate technical and organizational measures to protect your personal information. Your files are encrypted during transmission and storage. Converted files are automatically deleted after 7 days.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-[#1a1c1e] mb-4">Data Retention</h2>
            <p className="text-gray-700 leading-relaxed">
              We retain your personal information for as long as necessary to provide our services and comply with legal obligations. Uploaded and converted files are automatically deleted after 7 days.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-[#1a1c1e] mb-4">Your Rights</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              You have the right to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Access your personal information</li>
              <li>Correct inaccurate information</li>
              <li>Request deletion of your information</li>
              <li>Object to processing of your information</li>
              <li>Export your data</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-[#1a1c1e] mb-4">Contact Us</h2>
            <p className="text-gray-700 leading-relaxed">
              If you have any questions about this Privacy Policy, please contact us at privacy@fluxconvert.com
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16 w-full">
        <div className="max-w-7xl mx-auto py-8 px-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-2 text-center sm:text-left">
            <span className="text-[#1a1c1e] font-semibold text-base">FluxConvert</span>
            <span className="text-sm text-gray-600 sm:ml-2" suppressHydrationWarning>© {new Date().getFullYear()} FluxConvert. Precise tools for creative professionals.</span>
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
