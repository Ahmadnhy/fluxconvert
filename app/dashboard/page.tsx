import { redirect } from 'next/navigation';
import { createClient } from '@/src/lib/supabase/server';
import ConversionHistory from '@/src/components/dashboard/ConversionHistory';
import Link from 'next/link';

export const metadata = {
  title: 'Dashboard - FluxConvert',
  description: 'Your conversion history and account dashboard',
};

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const handleSignOut = async () => {
    'use server';
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect('/');
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col">
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
              <Link className="text-gray-600 hover:text-gray-900 transition-colors" href="/jpg-to-pdf">
                JPG to PDF
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-[#5b8ba8] text-sm font-medium hover:text-[#4a7a94] transition-colors"
            >
              Dashboard
            </Link>
            <form action={handleSignOut}>
              <button
                type="submit"
                className="text-gray-700 text-sm font-medium hover:text-gray-900 transition-colors"
              >
                Logout
              </button>
            </form>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-6 w-full py-12">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#1a1c1e] mb-2">
            Welcome back!
          </h1>
          <p className="text-gray-600">
            {user.email}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Link
            href="/word-to-pdf"
            className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-all group"
          >
            <div className="w-12 h-12 bg-[#5b8ba8]/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-[#5b8ba8]/20 transition-colors">
              <svg className="w-6 h-6 text-[#5b8ba8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="font-semibold text-[#1a1c1e] mb-1">Word to PDF</h3>
            <p className="text-sm text-gray-600">Convert Word documents to PDF</p>
          </Link>

          <Link
            href="/jpg-to-pdf"
            className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-all group"
          >
            <div className="w-12 h-12 bg-[#5b8ba8]/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-[#5b8ba8]/20 transition-colors">
              <svg className="w-6 h-6 text-[#5b8ba8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="font-semibold text-[#1a1c1e] mb-1">JPG to PDF</h3>
            <p className="text-sm text-gray-600">Convert images to PDF</p>
          </Link>

          <Link
            href="/merge-pdf"
            className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-all group"
          >
            <div className="w-12 h-12 bg-[#5b8ba8]/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-[#5b8ba8]/20 transition-colors">
              <svg className="w-6 h-6 text-[#5b8ba8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
            <h3 className="font-semibold text-[#1a1c1e] mb-1">Merge PDF</h3>
            <p className="text-sm text-gray-600">Combine multiple PDFs</p>
          </Link>
        </div>

        {/* Conversion History */}
        <ConversionHistory />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16 w-full">
        <div className="max-w-7xl mx-auto py-8 px-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-base font-semibold text-[#1a1c1e]">
            FluxConvert
          </div>
          <div className="text-sm text-gray-600">
            © 2024 FluxConvert. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
