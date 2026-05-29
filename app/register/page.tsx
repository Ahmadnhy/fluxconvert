import RegisterForm from '@/src/components/auth/RegisterForm';
import Link from 'next/link';

export const metadata = {
  title: 'Sign Up - FluxConvert',
  description: 'Create your FluxConvert account',
};

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col">
      {/* Header */}
      <nav className="bg-white border-b border-gray-200 w-full">
        <div className="flex justify-between items-center w-full px-4 sm:px-8 py-4 max-w-7xl mx-auto relative">
          {/* Back Button - Left */}
          <Link 
            href="/" 
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors font-medium text-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="hidden sm:inline">Kembali</span>
          </Link>
          
          {/* Brand - Center */}
          <Link className="text-[#1a1c1e] font-semibold text-lg hover:opacity-80 transition-opacity absolute left-1/2 transform -translate-x-1/2" href="/">
            FluxConvert
          </Link>
          
          {/* Switch Button - Right */}
          <Link 
            href="/login" 
            className="bg-[#5b8ba8]/10 text-[#5b8ba8] hover:bg-[#5b8ba8]/20 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors btn-lift"
          >
            Masuk Sesi
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <RegisterForm />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16 w-full">
        <div className="max-w-7xl mx-auto py-8 px-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-base font-semibold text-[#1a1c1e]">
            FluxConvert
          </div>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-600">
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
