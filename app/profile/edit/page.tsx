import { redirect } from 'next/navigation';
import { createClient } from '@/src/lib/supabase/server';
import EditProfileClient from '@/src/components/profile/EditProfileClient';
import Link from 'next/link';
import UserProfile from '@/src/components/UserProfile';
import MobileNav from '@/src/components/MobileNav';

export const metadata = {
  title: 'Edit Profile - FluxConvert',
  description: 'Edit your profile information',
};

export default async function EditProfilePage() {
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
      <nav className="nav-glass w-full sticky top-0 z-50">
        <div className="flex justify-between items-center w-full px-4 sm:px-6 lg:px-8 py-3 sm:py-4 max-w-7xl mx-auto">
          {/* Logo - Left */}
          <Link className="text-[#1a1c1e] font-semibold text-lg cursor-pointer" href="/">
            <span className="gradient-text">FluxConvert</span>
          </Link>
          
          {/* Menu - Center */}
          <div className="hidden md:flex gap-4 lg:gap-6 text-sm font-medium absolute left-1/2 transform -translate-x-1/2">
            <Link className="text-gray-600 hover:text-gray-900 transition-colors" href="/dashboard">
              Dashboard
            </Link>
            <Link className="text-gray-600 hover:text-gray-900 transition-colors" href="/word-to-pdf">
              Word to PDF
            </Link>
            <Link className="text-gray-600 hover:text-gray-900 transition-colors" href="/pdf-to-word">
              PDF to Word
            </Link>
            <Link className="text-gray-600 hover:text-gray-900 transition-colors" href="/jpg-to-pdf">
              JPG to PDF
            </Link>
            <Link className="text-gray-600 hover:text-gray-900 transition-colors" href="/pdf-to-jpg">
              PDF to JPG
            </Link>
            <Link className="text-gray-600 hover:text-gray-900 transition-colors" href="/merge-pdf">
              Merge PDF
            </Link>
            <Link className="text-gray-600 hover:text-gray-900 transition-colors" href="/split-pdf">
              Split PDF
            </Link>
          </div>
          
          {/* User Profile - Right */}
          <div className="flex items-center gap-2 sm:gap-4">
            <UserProfile userEmail={user.email || ''} />
            <MobileNav userEmail={user.email || ''} isLoading={false} />
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto px-6 w-full py-12">
        <EditProfileClient user={user} />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-10 sm:mt-12 lg:mt-16 w-full">
        <div className="max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-base font-semibold text-[#1a1c1e]">
            <span className="gradient-text">FluxConvert</span>
          </div>
          <div className="flex flex-wrap justify-center gap-x-5 sm:gap-x-6 gap-y-2 text-sm text-gray-600">
            <Link className="hover:text-gray-900 transition-colors" href="/">
              Home
            </Link>
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
          <div className="text-sm text-gray-600" suppressHydrationWarning>
            © {new Date().getFullYear()} FluxConvert. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
