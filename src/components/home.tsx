'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@/src/lib/supabase/client';
import UserProfile from '@/src/components/UserProfile';
import MobileNav from '@/src/components/MobileNav';

const toolCards = [
  {
    href: '/pdf-to-word',
    title: 'PDF to Word',
    desc: 'Easily convert your PDF files into editable Word documents.',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    ),
  },
  {
    href: '/word-to-pdf',
    title: 'Word to PDF',
    desc: 'Convert DOC and DOCX files into universally readable PDFs.',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    ),
  },
  {
    href: '/jpg-to-pdf',
    title: 'JPG to PDF',
    desc: 'Combine multiple JPG images into a single PDF document.',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    ),
  },
  {
    href: '/pdf-to-jpg',
    title: 'PDF to JPG',
    desc: 'Convert PDF pages into high-quality JPG images.',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    ),
  },
  {
    href: '/merge-pdf',
    title: 'Merge PDF',
    desc: 'Combine multiple PDF files into one single document in seconds.',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
    ),
  },
  {
    href: '/split-pdf',
    title: 'Split PDF',
    desc: 'Extract pages or split a large PDF into multiple smaller files.',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" transform="rotate(90 12 12)" />
    ),
  },
];

export default function Home() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
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
      <nav className="nav-glass w-full sticky top-0 z-50">
        <div className="flex justify-between items-center w-full px-4 sm:px-6 lg:px-8 py-3 sm:py-4 max-w-7xl mx-auto">
          {/* Logo - Left */}
          <Link className="text-[#1a1c1e] font-semibold text-lg" href="/">
            <span className="gradient-text">FluxConvert</span>
          </Link>
          
          {/* Menu - Center (Desktop) */}
          <div className="hidden md:flex gap-4 lg:gap-6 text-sm font-medium absolute left-1/2 transform -translate-x-1/2">
            {userEmail && (
              <Link className="text-gray-600 hover:text-gray-900 transition-colors" href="/dashboard">
                Dashboard
              </Link>
            )}
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
          
          {/* Auth buttons - Right */}
          <div className="flex items-center gap-2 sm:gap-4">
            {isLoading ? (
              <div className="w-9 h-9 rounded-full bg-gray-200 animate-pulse"></div>
            ) : userEmail ? (
              <UserProfile userEmail={userEmail} />
            ) : (
              <div className="hidden sm:flex items-center gap-4">
                <Link className="text-gray-700 text-sm font-medium hover:text-gray-900 transition-colors" href="/login">
                  Login
                </Link>
                <Link className="bg-[#5b8ba8] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#4a7a94] transition-colors btn-lift" href="/register">
                  Sign Up
                </Link>
              </div>
            )}
            {/* Mobile hamburger */}
            <MobileNav userEmail={userEmail} isLoading={isLoading} />
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        {/* Hero Section */}
        <section className="py-12 sm:py-16 lg:py-20 flex flex-col items-center text-center max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-4 sm:space-y-6"
          >
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#1a1c1e] tracking-tight">
              Welcome to <span className="gradient-text">FluxConvert</span>
            </h1>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed px-2"
            >
              Professional-grade tools to merge, split, and convert your documents securely and instantly. Choose from our suite of conversion tools below to get started.
            </motion.p>
          </motion.div>
        </section>

        {/* Tools Grid */}
        <section className="py-10 sm:py-12 lg:py-16 border-t border-gray-200">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mb-8 sm:mb-10 lg:mb-12 text-center"
          >
            <h2 className="text-2xl sm:text-3xl font-semibold text-[#1a1c1e] mb-2">Popular Tools</h2>
            <p className="text-sm sm:text-base text-gray-600">Everything you need to manage your documents</p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6 max-w-6xl mx-auto">
            {toolCards.map((card, index) => (
              <motion.div
                key={card.href}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.35 + index * 0.08, ease: [0.16, 1, 0.3, 1] }}
              >
                <Link
                  className="bg-white border border-gray-200 rounded-xl p-5 sm:p-6 lg:p-8 flex flex-col items-center text-center gap-3 sm:gap-4 tool-card-hover group block"
                  href={card.href}
                >
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-[#5b8ba8]/10 transition-colors icon-hover-float">
                    <svg className="w-6 h-6 sm:w-7 sm:h-7 text-[#5b8ba8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {card.icon}
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-[#1a1c1e] mb-1 sm:mb-2">{card.title}</h3>
                    <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">{card.desc}</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>
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
