'use client';

import Link from 'next/link';

export default function Result() {
  return (
    <div className="min-h-screen bg-[#e8e9eb] text-[#1a1c1e] font-body-md antialiased flex flex-col">
      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center py-16 px-6 relative overflow-hidden">
        {/* Decorative Background */}
        <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-gray-200/50 to-transparent -z-10"></div>
        
        <div className="w-full max-w-2xl mx-auto flex flex-col items-center text-center">
          {/* Success Icon & Message */}
          <div className="mb-12 flex flex-col items-center">
            {/* Success Icon */}
            <div className="w-20 h-20 rounded-full bg-white border-4 border-gray-200 flex items-center justify-center mb-6 relative shadow-sm">
              <svg className="w-10 h-10 text-[#5b8ba8]" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            
            {/* Success Message */}
            <h1 className="text-4xl font-bold text-[#1a1c1e] mb-4 tracking-tight">
              File converted successfully!
            </h1>
            <p className="text-base text-gray-600 max-w-md mx-auto leading-relaxed">
              Your document is ready. You can download it now<br />
              or save it directly to your preferred cloud storage.
            </p>
          </div>

          {/* Download Action Card */}
          <div className="w-full bg-white rounded-xl border border-gray-200 p-8 shadow-sm mb-8 flex flex-col items-center">
            {/* File Details */}
            <div className="flex items-center gap-3 mb-6 px-6 py-3 bg-gray-50 rounded-lg border border-gray-200">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <span className="text-sm text-gray-700">quarterly_report_final.pdf</span>
              <span className="text-sm text-gray-500 pl-3 border-l border-gray-300">2.4 MB</span>
            </div>
            
            {/* Download Button */}
            <button className="w-full max-w-sm bg-[#5b8ba8] text-white font-semibold text-base py-3.5 rounded-lg flex items-center justify-center gap-2 transition-colors hover:bg-[#4a7a94] focus:outline-none focus:ring-2 focus:ring-[#5b8ba8] focus:ring-offset-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download PDF
            </button>
          </div>

          {/* Secondary Actions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-3xl">
            {/* Convert Another */}
            <Link 
              className="group bg-white rounded-lg border border-gray-200 p-6 flex flex-col items-center justify-center text-center hover:border-[#5b8ba8] transition-all hover:shadow-md cursor-pointer" 
              href="#"
            >
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3 group-hover:bg-[#5b8ba8]/10 transition-colors">
                <svg className="w-6 h-6 text-gray-600 group-hover:text-[#5b8ba8] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <span className="text-sm font-medium text-[#1a1c1e]">Convert another file</span>
            </Link>

            {/* Save to Drive */}
            <Link 
              className="group bg-white rounded-lg border border-gray-200 p-6 flex flex-col items-center justify-center text-center hover:border-[#5b8ba8] transition-all hover:shadow-md cursor-pointer" 
              href="#"
            >
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3 group-hover:bg-[#5b8ba8]/10 transition-colors">
                <svg className="w-6 h-6 text-gray-600 group-hover:text-[#5b8ba8] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3 3m0 0l-3-3m3 3V8" />
                </svg>
              </div>
              <span className="text-sm font-medium text-[#1a1c1e]">Save to Google Drive</span>
            </Link>

            {/* Share Link */}
            <Link 
              className="group bg-white rounded-lg border border-gray-200 p-6 flex flex-col items-center justify-center text-center hover:border-[#5b8ba8] transition-all hover:shadow-md cursor-pointer" 
              href="#"
            >
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3 group-hover:bg-[#5b8ba8]/10 transition-colors">
                <svg className="w-6 h-6 text-gray-600 group-hover:text-[#5b8ba8] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <span className="text-sm font-medium text-[#1a1c1e]">Share Link</span>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 w-full">
        <div className="max-w-7xl mx-auto py-8 px-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-base font-semibold text-[#1a1c1e]">
            FileRefine
          </div>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-600">
            <Link className="hover:text-gray-900 transition-colors" href="#">
              Tools
            </Link>
            <Link className="hover:text-gray-900 transition-colors" href="#">
              Developer API
            </Link>
            <Link className="hover:text-gray-900 transition-colors" href="#">
              Pricing
            </Link>
            <Link className="hover:text-gray-900 transition-colors" href="#">
              Privacy Policy
            </Link>
            <Link className="hover:text-gray-900 transition-colors" href="#">
              Terms of Service
            </Link>
            <Link className="hover:text-gray-900 transition-colors" href="#">
              Help Center
            </Link>
          </div>
          <div className="text-sm text-gray-600">
            © 2024 FileRefine. Precise tools for creative professionals.
          </div>
        </div>
      </footer>
    </div>
  );
}
