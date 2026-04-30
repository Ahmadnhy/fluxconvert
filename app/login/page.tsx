import LoginForm from '@/src/components/auth/LoginForm';
import Link from 'next/link';

export const metadata = {
  title: 'Login - FluxConvert',
  description: 'Login to your FluxConvert account',
};

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col">
      {/* Header */}
      <nav className="bg-white border-b border-gray-200 w-full">
        <div className="flex justify-between items-center w-full px-8 py-4 max-w-7xl mx-auto">
          <Link className="text-[#1a1c1e] font-semibold text-lg" href="/">
            FluxConvert
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <LoginForm />
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
          <div className="text-sm text-gray-600">
            © {new Date().getFullYear()} FluxConvert. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
