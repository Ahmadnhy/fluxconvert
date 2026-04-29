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
        <div className="flex justify-between items-center w-full px-8 py-4 max-w-7xl mx-auto">
          <Link className="text-[#1a1c1e] font-semibold text-lg" href="/">
            FluxConvert
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <RegisterForm />
      </main>
    </div>
  );
}
