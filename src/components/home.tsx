'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { createClient } from '@/src/lib/supabase/client';
import UserProfile from '@/src/components/UserProfile';

export default function Home() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication status
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
      {/* TopNavBar */}
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

      <main className="flex-1 max-w-7xl mx-auto px-6 w-full">
        {/* Hero Section */}
        <section className="py-20 flex flex-col items-center text-center max-w-3xl mx-auto">
          <div className="space-y-6">
            <h1 className="text-5xl font-bold text-[#1a1c1e] tracking-tight">
              Welcome to FluxConvert
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Professional-grade tools to merge, split, and convert your documents securely and instantly. Choose from our suite of conversion tools below to get started.
            </p>
          </div>
        </section>

        {/* Tools Grid */}
        <section className="py-16 border-t border-gray-200">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-semibold text-[#1a1c1e] mb-2">Popular Tools</h2>
            <p className="text-base text-gray-600">Everything you need to manage your documents</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {/* Tool Card 1 - PDF to Word */}
            <Link className="bg-white border border-gray-200 rounded-lg p-8 flex flex-col items-center text-center gap-4 hover:shadow-lg transition-all group" href="#">
              <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-[#5b8ba8]/10 transition-colors">
                <svg className="w-7 h-7 text-[#5b8ba8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[#1a1c1e] mb-2">PDF to Word</h3>
                <p className="text-sm text-gray-600 leading-relaxed">Easily convert your PDF files into editable Word documents.</p>
              </div>
            </Link>

            {/* Tool Card 2 - Word to PDF */}
            <Link className="bg-white border border-gray-200 rounded-lg p-8 flex flex-col items-center text-center gap-4 hover:shadow-lg transition-all group" href="/word-to-pdf">
              <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-[#5b8ba8]/10 transition-colors">
                <svg className="w-7 h-7 text-[#5b8ba8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[#1a1c1e] mb-2">Word to PDF</h3>
                <p className="text-sm text-gray-600 leading-relaxed">Convert DOC and DOCX files into universally readable PDFs.</p>
              </div>
            </Link>

            {/* Tool Card 3 - JPG to PDF */}
            <Link className="bg-white border border-gray-200 rounded-lg p-8 flex flex-col items-center text-center gap-4 hover:shadow-lg transition-all group" href="#">
              <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-[#5b8ba8]/10 transition-colors">
                <svg className="w-7 h-7 text-[#5b8ba8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[#1a1c1e] mb-2">JPG to PDF</h3>
                <p className="text-sm text-gray-600 leading-relaxed">Combine multiple JPG images into a single PDF document.</p>
              </div>
            </Link>

            {/* Tool Card 4 - PNG to PDF */}
            <Link className="bg-white border border-gray-200 rounded-lg p-8 flex flex-col items-center text-center gap-4 hover:shadow-lg transition-all group" href="#">
              <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-[#5b8ba8]/10 transition-colors">
                <svg className="w-7 h-7 text-[#5b8ba8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[#1a1c1e] mb-2">PNG to PDF</h3>
                <p className="text-sm text-gray-600 leading-relaxed">Convert PNG graphics into perfectly formatted PDF files.</p>
              </div>
            </Link>

            {/* Tool Card 5 - Merge PDF */}
            <Link className="bg-white border border-gray-200 rounded-lg p-8 flex flex-col items-center text-center gap-4 hover:shadow-lg transition-all group" href="#">
              <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-[#5b8ba8]/10 transition-colors">
                <svg className="w-7 h-7 text-[#5b8ba8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[#1a1c1e] mb-2">Merge PDF</h3>
                <p className="text-sm text-gray-600 leading-relaxed">Combine multiple PDF files into one single document in seconds.</p>
              </div>
            </Link>

            {/* Tool Card 6 - Split PDF */}
            <Link className="bg-white border border-gray-200 rounded-lg p-8 flex flex-col items-center text-center gap-4 hover:shadow-lg transition-all group" href="#">
              <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-[#5b8ba8]/10 transition-colors">
                <svg className="w-7 h-7 text-[#5b8ba8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" transform="rotate(90 12 12)" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[#1a1c1e] mb-2">Split PDF</h3>
                <p className="text-sm text-gray-600 leading-relaxed">Extract pages or split a large PDF into multiple smaller files.</p>
              </div>
            </Link>
          </div>
        </section>
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
