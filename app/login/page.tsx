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
    </div>
  );
}
