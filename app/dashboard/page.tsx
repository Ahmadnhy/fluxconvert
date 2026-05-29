import { redirect } from 'next/navigation';
import { createClient } from '@/src/lib/supabase/server';
import UserProfile from '@/src/components/UserProfile';
import Link from 'next/link';
import DashboardClient from '@/src/components/dashboard/DashboardClient';

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

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 w-full sticky top-0 z-50">
        <div className="flex justify-between items-center w-full px-8 py-4 max-w-7xl mx-auto">
          {/* Logo - Left */}
          <Link className="text-[#1a1c1e] font-semibold text-lg" href="/">
            FluxConvert
          </Link>
          
          {/* Menu - Center */}
          <div className="hidden md:flex gap-8 text-sm font-medium absolute left-1/2 transform -translate-x-1/2">
            <Link className="text-[#5b8ba8] hover:text-gray-900 transition-colors" href="/dashboard">
              Dashboard
            </Link>
            <Link className="text-gray-600 hover:text-gray-900 transition-colors" href="/word-to-pdf">
              Word to PDF
            </Link>
            <Link className="text-gray-600 hover:text-gray-900 transition-colors" href="/jpg-to-pdf">
              JPG to PDF
            </Link>
            <Link className="text-gray-600 hover:text-gray-900 transition-colors" href="/pdf-to-word">
              PDF to Word
            </Link>
            <Link className="text-gray-600 hover:text-gray-900 transition-colors" href="/merge-pdf">
              Merge PDF
            </Link>
            <Link className="text-gray-600 hover:text-gray-900 transition-colors" href="/split-pdf">
              Split PDF
            </Link>
          </div>
          
          {/* User Profile - Right */}
          <div className="flex items-center gap-4">
            <UserProfile userEmail={user.email || ''} />
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-6 w-full py-12">
        <DashboardClient userEmail={user.email || ''} />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16 w-full">
        <div className="max-w-7xl mx-auto py-8 px-8">
          {/* Footer Content - Copyright left, Links right */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Copyright - Left */}
            <div className="text-sm text-gray-500" suppressHydrationWarning>
              © {new Date().getFullYear()} FluxConvert. All rights reserved.
            </div>
            
            {/* Links - Right */}
            <div className="flex flex-wrap justify-center sm:justify-end gap-x-6 text-sm text-gray-600">
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
        </div>
      </footer>
    </div>
  );
}
