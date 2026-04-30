'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { createClient } from '@/src/lib/supabase/client';
import UserProfile from '@/src/components/UserProfile';

export default function Result() {
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
        <div className="text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-[#1a1c1e] mb-4">Conversion Complete!</h1>
          <p className="text-lg text-gray-600 mb-8">
            Your file has been successfully converted.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/"
              className="bg-[#5b8ba8] text-white px-6 py-3 rounded-lg text-base font-medium hover:bg-[#4a7a94] transition-colors"
            >
              Convert Another File
            </Link>
            {userEmail && (
              <Link
                href="/dashboard"
                className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg text-base font-medium hover:bg-gray-50 transition-colors"
              >
                View Dashboard
              </Link>
            )}
          </div>
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
