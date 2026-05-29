'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

interface MobileNavProps {
  userEmail: string | null;
  isLoading: boolean;
}

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/word-to-pdf', label: 'Word to PDF' },
  { href: '/jpg-to-pdf', label: 'JPG to PDF' },
  { href: '/pdf-to-word', label: 'PDF to Word' },
  { href: '/pdf-to-jpg', label: 'PDF to JPG' },
  { href: '/merge-pdf', label: 'Merge PDF' },
  { href: '/split-pdf', label: 'Split PDF' },
];

export default function MobileNav({ userEmail, isLoading }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Close on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Close on escape key
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') setIsOpen(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleKeyDown]);

  return (
    <div className="md:hidden">
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors z-[60]"
        aria-label={isOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={isOpen}
      >
        <div className="w-5 h-4 flex flex-col justify-between">
          <span
            className={`block h-0.5 w-5 bg-[#1a1c1e] rounded-full transition-all duration-300 origin-center ${
              isOpen ? 'rotate-45 translate-y-[7px]' : ''
            }`}
          />
          <span
            className={`block h-0.5 w-5 bg-[#1a1c1e] rounded-full transition-all duration-300 ${
              isOpen ? 'opacity-0 scale-0' : 'opacity-100'
            }`}
          />
          <span
            className={`block h-0.5 w-5 bg-[#1a1c1e] rounded-full transition-all duration-300 origin-center ${
              isOpen ? '-rotate-45 -translate-y-[7px]' : ''
            }`}
          />
        </div>
      </button>

      {/* Overlay + Drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 mobile-menu-overlay z-50"
              onClick={() => setIsOpen(false)}
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 h-full w-[280px] bg-white shadow-2xl z-50 flex flex-col"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
                <span className="text-lg font-semibold text-[#1a1c1e]">Menu</span>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
                  aria-label="Close menu"
                >
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Navigation Links */}
              <nav className="flex-1 overflow-y-auto py-3 px-3">
                {userEmail && (
                  <Link
                    href="/dashboard"
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all mb-1 ${
                      pathname === '/dashboard'
                        ? 'bg-[#5b8ba8]/10 text-[#5b8ba8]'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                    Dashboard
                  </Link>
                )}

                <div className="px-4 py-2 mt-1">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Tools</span>
                </div>

                {navLinks.map((link, index) => {
                  if (link.href === '/') return null;
                  const isActive = pathname === link.href;
                  return (
                    <motion.div
                      key={link.href}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.2 }}
                    >
                      <Link
                        href={link.href}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all mb-0.5 ${
                          isActive
                            ? 'bg-[#5b8ba8]/10 text-[#5b8ba8]'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        {link.label}
                      </Link>
                    </motion.div>
                  );
                })}
              </nav>

              {/* Auth Section at Bottom */}
              <div className="border-t border-gray-100 px-5 py-4">
                {isLoading ? (
                  <div className="h-10 bg-gray-100 rounded-lg animate-pulse" />
                ) : userEmail ? (
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#5b8ba8] text-white flex items-center justify-center text-sm font-semibold flex-shrink-0">
                      {userEmail.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[#1a1c1e] truncate">{userEmail.split('@')[0]}</p>
                      <p className="text-xs text-gray-500 truncate">{userEmail}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <Link
                      href="/login"
                      className="w-full text-center px-4 py-2.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Login
                    </Link>
                    <Link
                      href="/register"
                      className="w-full text-center px-4 py-2.5 text-sm font-medium text-white bg-[#5b8ba8] rounded-lg hover:bg-[#4a7a94] transition-colors"
                    >
                      Sign Up
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
