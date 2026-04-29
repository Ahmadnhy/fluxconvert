'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function Processing() {
  const [progress, setProgress] = useState(45);

  return (
    <div className="min-h-screen bg-[#f9f9fc] text-[#1a1c1e] antialiased flex flex-col">
      {/* Header */}
      <header className="bg-white w-full top-0 border-b border-slate-100">
        <div className="flex justify-between items-center w-full px-8 py-4 max-w-7xl mx-auto">
          <div className="text-xl font-bold tracking-tight text-slate-800">
            FileRefine
          </div>
          <nav className="hidden md:flex gap-8 text-sm font-medium tracking-tight">
            <Link 
              className="text-slate-500 hover:text-slate-900 transition-colors" 
              href="#"
            >
              Merge PDF
            </Link>
            <Link 
              className="text-slate-500 hover:text-slate-900 transition-colors" 
              href="#"
            >
              Split PDF
            </Link>
            <Link 
              className="text-slate-500 hover:text-slate-900 transition-colors" 
              href="#"
            >
              Compress PDF
            </Link>
            <Link 
              className="text-slate-900 border-b-2 border-slate-500 pb-1 hover:text-slate-900 transition-colors" 
              href="#"
            >
              Convert
            </Link>
            <Link 
              className="text-slate-500 hover:text-slate-900 transition-colors" 
              href="#"
            >
              Pricing
            </Link>
          </nav>
          <div className="flex items-center gap-4 text-sm font-medium tracking-tight">
            <button className="text-slate-500 hover:text-slate-900 transition-colors">
              Login
            </button>
            <button className="bg-slate-800 text-white px-4 py-2 rounded-md hover:bg-slate-700 transition-colors">
              Sign Up
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow w-full max-w-[1120px] mx-auto px-6 py-20">
        <div className="max-w-2xl mx-auto w-full flex flex-col gap-12">
          {/* Title Section */}
          <div className="flex flex-col gap-6">
            <h1 className="text-[40px] leading-[1.2] font-bold tracking-[-0.02em] text-center text-[#1a1c1e]">
              Process Files
            </h1>
            <p className="text-[18px] leading-[1.6] text-center text-[#42474d] max-w-lg mx-auto">
              Securely upload your documents for high-speed conversion and compression.
            </p>
          </div>

          {/* Upload Zone */}
          <div className="w-full border-2 border-dashed border-[#a5cbe9] bg-white rounded-xl p-12 flex flex-col items-center justify-center gap-6 transition-colors hover:bg-[#f3f3f6] cursor-pointer group">
            {/* Upload Icon */}
            <svg 
              className="w-16 h-16 text-[#547a95] group-hover:scale-110 transition-transform duration-300" 
              fill="currentColor" 
              viewBox="0 0 24 24"
            >
              <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"/>
            </svg>

            <div className="text-center flex flex-col gap-2">
              <h3 className="text-[24px] leading-[1.4] font-semibold text-[#1a1c1e]">
                Drag & drop your files here
              </h3>
              <p className="text-[16px] leading-[1.6] text-[#42474d]">
                Supports PDF, DOCX, JPG, and PNG up to 50MB.
              </p>
            </div>

            <button className="mt-4 px-6 py-3 bg-[#547a95] text-white text-[16px] leading-[1.6] rounded hover:bg-[#3b617b] transition-colors flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/>
              </svg>
              Select File
            </button>
          </div>

          {/* Processing Queue */}
          <div className="flex flex-col gap-4 mt-8">
            <h3 className="text-[18px] leading-[1.6] font-semibold text-[#1a1c1e]">
              Processing Queue
            </h3>
            
            {/* File Item */}
            <div className="bg-white border border-[#e2e2e5] rounded-lg p-6 flex flex-col gap-6 shadow-[0px_4px_20px_rgba(84,122,149,0.08)]">
              {/* File Info */}
              <div className="flex justify-between items-start w-full">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-[#dce4e9] rounded-lg text-[#547a95]">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
                    </svg>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[16px] leading-[1.6] font-medium text-[#1a1c1e]">
                      Report_2024.docx
                    </span>
                    <span className="text-[14px] leading-[1.5] text-[#42474d]">
                      2.4 MB
                    </span>
                  </div>
                </div>
                <button className="text-[#72787d] hover:text-[#ba1a1a] transition-colors p-1">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                  </svg>
                </button>
              </div>

              {/* Progress Bar */}
              <div className="flex flex-col gap-2 w-full">
                <div className="flex justify-between items-center w-full">
                  <span className="text-[12px] leading-[1] tracking-[0.05em] font-semibold text-[#547a95] uppercase">
                    Converting...
                  </span>
                  <span className="text-[12px] leading-[1] tracking-[0.05em] font-semibold text-[#42474d]">
                    {progress}%
                  </span>
                </div>
                <div className="w-full h-1.5 bg-[#dce4e9] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#547a95] rounded-full transition-all duration-300" 
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-50 w-full mt-20 border-t border-slate-200">
        <div className="max-w-7xl mx-auto py-12 px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-lg font-semibold text-slate-800">
            FileRefine
          </div>
          <div className="flex flex-wrap justify-center gap-6 text-xs">
            <Link className="text-slate-500 hover:underline hover:text-slate-800 transition-all duration-300" href="#">
              Tools
            </Link>
            <Link className="text-slate-500 hover:underline hover:text-slate-800 transition-all duration-300" href="#">
              Developer API
            </Link>
            <Link className="text-slate-500 hover:underline hover:text-slate-800 transition-all duration-300" href="#">
              Pricing
            </Link>
            <Link className="text-slate-500 hover:underline hover:text-slate-800 transition-all duration-300" href="#">
              Privacy Policy
            </Link>
            <Link className="text-slate-500 hover:underline hover:text-slate-800 transition-all duration-300" href="#">
              Terms of Service
            </Link>
            <Link className="text-slate-500 hover:underline hover:text-slate-800 transition-all duration-300" href="#">
              Help Center
            </Link>
          </div>
          <div className="text-xs text-slate-600">
            © 2024 FileRefine. Precise tools for creative professionals.
          </div>
        </div>
      </footer>
    </div>
  );
}
