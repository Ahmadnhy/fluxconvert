'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { createClient } from '@/src/lib/supabase/client';
import UserProfile from '@/src/components/UserProfile';
import MobileNav from '@/src/components/MobileNav';

export default function HelpCenter() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(2);

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

  const faqs = [
    {
      question: 'Is my data secure when using FluxConvert?',
      answer: 'Yes, absolutely. All files are encrypted during transfer and storage. We use industry-standard security measures including TLS 1.3 for data in transit and AES-256 encryption for data at rest. Your files are automatically deleted after 24 hours.'
    },
    {
      question: 'What is the maximum file size I can upload?',
      answer: 'For free accounts, the maximum file size is 50MB per file. Pro users can upload files up to 2GB in size. If you need to process larger files, consider upgrading your plan or using our desktop application.'
    },
    {
      question: 'How do I cancel my subscription?',
      answer: 'You can cancel your subscription at any time from your account dashboard. Go to Settings > Subscription > Cancel Subscription. Your access will continue until the end of your current billing period.'
    },
    {
      question: 'Are the converted files deleted from your servers?',
      answer: 'Yes, all uploaded and converted files are automatically and permanently deleted from our servers after 24 hours. You can also manually delete files immediately after download from your conversion history.'
    }
  ];

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-[#1a1c1e] font-body-md antialiased flex flex-col">
      {/* Navigation */}
      <nav className="nav-glass w-full sticky top-0 z-50">
        <div className="flex justify-between items-center w-full px-4 sm:px-6 lg:px-8 py-3 sm:py-4 max-w-7xl mx-auto">
          {/* Logo - Left */}
          <Link className="text-[#1a1c1e] font-semibold text-lg cursor-pointer" href="/">
            <span className="gradient-text">FluxConvert</span>
          </Link>
          
          {/* Menu - Center */}
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
          
          {/* User Profile - Right */}
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
            <MobileNav userEmail={userEmail} isLoading={isLoading} />
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-[1120px] mx-auto px-6 w-full py-20">
        {/* Hero Section */}
        <section className="text-center max-w-2xl mx-auto mb-16">
          <h1 className="text-4xl font-bold text-[#1a1c1e] mb-4 tracking-tight">
            How can we help?
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Search our knowledge base or browse categories below to find answers to your questions.
          </p>
          <div className="relative w-full max-w-lg mx-auto">
            <svg className="w-6 h-6 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              className="w-full pl-12 pr-4 py-4 bg-white border border-gray-300 rounded-lg text-base focus:border-[#5b8ba8] focus:ring-1 focus:ring-[#5b8ba8] outline-none transition-colors shadow-sm"
              placeholder="Search for articles, guides, or troubleshooting..."
              type="text"
            />
          </div>
        </section>

        {/* Categories Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <div className="bg-white border border-gray-200 rounded-lg p-8 hover:shadow-lg transition-shadow cursor-pointer group">
            <div className="w-12 h-12 rounded-full bg-[#5b8ba8]/10 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-[#5b8ba8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-[#1a1c1e] mb-2 group-hover:text-[#5b8ba8] transition-colors">
              Getting Started
            </h3>
            <p className="text-sm text-gray-600">
              Basic guides on how to use FluxConvert tools effectively.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-8 hover:shadow-lg transition-shadow cursor-pointer group">
            <div className="w-12 h-12 rounded-full bg-[#5b8ba8]/10 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-[#5b8ba8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-[#1a1c1e] mb-2 group-hover:text-[#5b8ba8] transition-colors">
              Troubleshooting
            </h3>
            <p className="text-sm text-gray-600">
              Solutions for common errors and file processing issues.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-8 hover:shadow-lg transition-shadow cursor-pointer group">
            <div className="w-12 h-12 rounded-full bg-[#5b8ba8]/10 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-[#5b8ba8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-[#1a1c1e] mb-2 group-hover:text-[#5b8ba8] transition-colors">
              Security & Privacy
            </h3>
            <p className="text-sm text-gray-600">
              Information on how we handle and protect your data.
            </p>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-semibold text-[#1a1c1e] mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className={`bg-white border rounded-lg overflow-hidden transition-all ${
                  expandedFaq === index
                    ? 'shadow-lg border-l-4 border-l-[#5b8ba8]'
                    : 'border-gray-200'
                }`}
              >
                <div
                  className={`p-6 flex justify-between items-center cursor-pointer transition-colors ${
                    expandedFaq === index ? 'bg-gray-50' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                >
                  <h3 className="text-lg font-medium text-[#1a1c1e]">
                    {faq.question}
                  </h3>
                  <svg
                    className={`w-6 h-6 transition-transform ${
                      expandedFaq === index ? 'rotate-180 text-[#5b8ba8]' : 'text-gray-400'
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                {expandedFaq === index && (
                  <div className="px-6 pb-6 pt-2">
                    <p className="text-base text-gray-600 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Contact Support Banner */}
        <section className="bg-[#5b8ba8] rounded-xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-white">
            <h2 className="text-3xl font-semibold mb-2">Still need help?</h2>
            <p className="text-lg opacity-90">
              Our support team is ready to assist you with any technical issues.
            </p>
          </div>
          <a
            href="https://ahmadnh.is-a.dev/#contact"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white text-[#5b8ba8] font-semibold px-8 py-3 rounded-lg hover:bg-gray-100 transition-colors whitespace-nowrap text-center inline-block shadow-sm hover:shadow btn-lift"
          >
            Contact Support
          </a>
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
