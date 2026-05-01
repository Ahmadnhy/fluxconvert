'use client';

import ConversionHistory from '@/src/components/dashboard/ConversionHistory';
import Link from 'next/link';

interface DashboardClientProps {
  userEmail: string;
}

export default function DashboardClient({ userEmail }: DashboardClientProps) {
  return (
    <>
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#1a1c1e] mb-2">
          Welcome back!
        </h1>
        <p className="text-gray-600">
          {userEmail}
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <Link
          href="/word-to-pdf"
          className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-all group"
        >
          <div className="w-12 h-12 bg-[#5b8ba8]/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-[#5b8ba8]/20 transition-colors">
            <svg className="w-6 h-6 text-[#5b8ba8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="font-semibold text-[#1a1c1e] mb-1">Word to PDF</h3>
          <p className="text-sm text-gray-600">Convert Word documents to PDF</p>
        </Link>

        <Link
          href="/pdf-to-word"
          className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-all group"
        >
          <div className="w-12 h-12 bg-[#5b8ba8]/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-[#5b8ba8]/20 transition-colors">
            <svg className="w-6 h-6 text-[#5b8ba8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="font-semibold text-[#1a1c1e] mb-1">PDF to Word</h3>
          <p className="text-sm text-gray-600">Convert PDF files to Word documents</p>
        </Link>

        <Link
          href="/jpg-to-pdf"
          className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-all group"
        >
          <div className="w-12 h-12 bg-[#5b8ba8]/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-[#5b8ba8]/20 transition-colors">
            <svg className="w-6 h-6 text-[#5b8ba8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="font-semibold text-[#1a1c1e] mb-1">JPG to PDF</h3>
          <p className="text-sm text-gray-600">Convert images to PDF</p>
        </Link>
      </div>

      {/* Conversion History */}
      <ConversionHistory />
    </>
  );
}
