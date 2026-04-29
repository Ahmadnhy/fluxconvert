'use client';

import { useState } from 'react';
import { createClient } from '@/src/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <h2 className="text-2xl font-bold text-[#1a1c1e] mb-6 text-center">
          Login to FluxConvert
        </h2>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5b8ba8] focus:border-transparent outline-none transition-all"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5b8ba8] focus:border-transparent outline-none transition-all"
              placeholder="••••••••"
            />
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center">
              <input
                type="checkbox"
                className="w-4 h-4 text-[#5b8ba8] border-gray-300 rounded focus:ring-[#5b8ba8]"
              />
              <span className="ml-2 text-gray-600">Remember me</span>
            </label>
            <Link href="/forgot-password" className="text-[#5b8ba8] hover:text-[#4a7a94]">
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#5b8ba8] text-white py-2.5 rounded-lg font-medium hover:bg-[#4a7a94] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <Link href="/register" className="text-[#5b8ba8] hover:text-[#4a7a94] font-medium">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}
