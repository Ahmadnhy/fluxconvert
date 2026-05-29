'use client';

import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/src/lib/supabase/client';
import UserProfile from '@/src/components/UserProfile';
import MobileNav from '@/src/components/MobileNav';

interface UploadedFile {
  file: File;
  preview?: string;
  id: string;
}

interface ConversionStatus {
  status: 'idle' | 'uploading' | 'converting' | 'completed' | 'error';
  progress: number;
  message: string;
  downloadUrl?: string;
  convertedFileName?: string;
  convertedFileSize?: string;
  extractedPages?: number;
  totalPages?: number;
}

export default function SplitPdfConverter() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [pageRanges, setPageRanges] = useState<string>('');
  const [conversionStatus, setConversionStatus] = useState<ConversionStatus>({
    status: 'idle',
    progress: 0,
    message: '',
  });
  const [error, setError] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        setUserEmail(user?.email || null);
      } catch (error) {
        console.error('Auth check error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    setError('');
    
    if (rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0];
      if (rejection.errors[0]?.code === 'file-too-large') {
        setError('File size exceeds 50 MB limit');
      } else if (rejection.errors[0]?.code === 'file-invalid-type') {
        setError('Only .pdf files are supported');
      } else {
        setError('Invalid file. Please upload a valid PDF document.');
      }
      return;
    }

    const newFiles: UploadedFile[] = acceptedFiles.map((file) => ({
      file,
      id: `${file.name}-${Date.now()}`,
    }));

    setUploadedFiles(newFiles);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
    },
    maxSize: 50 * 1024 * 1024,
    multiple: false,
  });

  const handleConvert = async () => {
    if (uploadedFiles.length === 0) {
      setError('Please upload a file first');
      return;
    }

    if (!pageRanges.trim()) {
      setError('Please specify page ranges (e.g., "1-3, 5, 7-10")');
      return;
    }

    const file = uploadedFiles[0].file;
    
    setConversionStatus({
      status: 'uploading',
      progress: 0,
      message: 'Uploading file...',
    });

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('pageRanges', pageRanges.trim());

      setConversionStatus({
        status: 'uploading',
        progress: 30,
        message: 'Uploading file...',
      });

      const response = await fetch('/api/convert/split-pdf', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Split failed');
      }

      setConversionStatus({
        status: 'converting',
        progress: 60,
        message: 'Splitting PDF...',
      });

      const result = await response.json();

      setConversionStatus({
        status: 'completed',
        progress: 100,
        message: 'Split completed!',
        downloadUrl: result.downloadUrl,
        convertedFileName: result.fileName,
        convertedFileSize: result.fileSize,
        extractedPages: result.extractedPages,
        totalPages: result.totalPages,
      });
    } catch (err: any) {
      setConversionStatus({
        status: 'error',
        progress: 0,
        message: err.message || 'Split failed',
      });
      setError(err.message || 'An error occurred during split');
    }
  };

  const handleRemoveFile = () => {
    setUploadedFiles([]);
    setPageRanges('');
    setConversionStatus({
      status: 'idle',
      progress: 0,
      message: '',
    });
    setError('');
  };

  const handleDownload = () => {
    if (conversionStatus.downloadUrl && conversionStatus.convertedFileName) {
      const url = conversionStatus.downloadUrl;
      // Convert base64 data URI to blob for accurate binary download
      if (url.startsWith('data:')) {
        const parts = url.split(',');
        const mimeMatch = parts[0].match(/:(.*?);/);
        const mime = mimeMatch ? mimeMatch[1] : 'application/pdf';
        const binaryStr = atob(parts[1]);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
          bytes[i] = binaryStr.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: mime });
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = conversionStatus.convertedFileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
      } else {
        const link = document.createElement('a');
        link.href = url;
        link.download = conversionStatus.convertedFileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-[#1a1c1e] font-body-md antialiased flex flex-col">
      {/* Navigation Bar */}
      <nav className="nav-glass w-full sticky top-0 z-50 animate-fade-in-down">
        <div className="flex justify-between items-center w-full px-4 sm:px-6 lg:px-8 py-3 sm:py-4 max-w-7xl mx-auto">
          <Link className="text-[#1a1c1e] font-semibold text-lg" href="/">
            <span className="gradient-text">FluxConvert</span>
          </Link>
          
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
            <Link className="text-[#5b8ba8] hover:text-gray-900 transition-colors" href="/split-pdf">
              Split PDF
            </Link>
          </div>
          
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
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 w-full py-8 sm:py-10 lg:py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-8 sm:mb-10 lg:mb-12"
        >
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#1a1c1e] mb-3 sm:mb-4 tracking-tight">
            Split PDF
          </h1>
          <p className="text-sm sm:text-base lg:text-lg text-gray-600 max-w-2xl mx-auto px-2">
            Extract specific pages from your PDF document. 
            Specify the pages you want and get a new PDF with only those pages.
          </p>
        </motion.div>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 sm:mb-6 bg-red-50 border border-red-200 text-red-700 px-3 sm:px-4 py-3 rounded-lg flex items-center gap-2 text-sm"
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Upload Area or File Preview */}
        {uploadedFiles.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          >
            <div
              {...getRootProps()}
              className={`w-full bg-white border-2 border-dashed rounded-xl p-8 sm:p-12 lg:p-16 flex flex-col items-center justify-center gap-3 sm:gap-4 cursor-pointer transition-all ${
                isDragActive
                  ? 'border-[#5b8ba8] bg-[#5b8ba8]/5 shadow-lg'
                  : 'border-gray-300 hover:border-[#5b8ba8] hover:bg-gray-50'
              }`}
            >
              <input {...getInputProps()} />
              <div className="w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center">
                <svg className="w-12 h-12 sm:w-16 sm:h-16 text-[#5b8ba8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <div className="space-y-1.5 sm:space-y-2 text-center">
                <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-[#1a1c1e]">
                  {isDragActive ? 'Drop your PDF file here' : 'Drag & Drop your PDF file here'}
                </h3>
                <p className="text-xs sm:text-sm text-gray-500">or click to browse your device</p>
              </div>
              <button className="mt-2 sm:mt-4 bg-[#5b8ba8] text-white px-5 sm:px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-[#4a7a94] transition-colors flex items-center gap-2 btn-lift">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                </svg>
                Select PDF File
              </button>
              <p className="text-xs text-gray-500 mt-2 sm:mt-4">Supports .pdf files up to 50MB</p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-4 sm:space-y-6"
          >
            {/* File Preview */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-medium text-[#1a1c1e] text-sm sm:text-base truncate">{uploadedFiles[0].file.name}</h4>
                    <p className="text-xs sm:text-sm text-gray-500">{formatFileSize(uploadedFiles[0].file.size)}</p>
                  </div>
                </div>
                {conversionStatus.status === 'idle' && (
                  <button
                    onClick={handleRemoveFile}
                    className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0 p-1"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Page Ranges Input */}
              {conversionStatus.status === 'idle' && (
                <div className="mt-6">
                  <label className="block text-xs sm:text-sm font-medium text-[#1a1c1e] mb-2">
                    Page Ranges
                  </label>
                  <input
                    type="text"
                    value={pageRanges}
                    onChange={(e) => setPageRanges(e.target.value)}
                    placeholder="e.g., 1-3, 5, 7-10"
                    className="w-full px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg text-sm sm:text-base text-[#1a1c1e] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5b8ba8] focus:border-transparent transition-all"
                  />
                  <p className="mt-2 text-[10px] sm:text-xs text-gray-500 leading-normal">
                    Enter page numbers or ranges separated by commas. Example: &quot;1-3, 5, 7-10&quot; will extract pages 1, 2, 3, 5, 7, 8, 9, 10.
                  </p>
                </div>
              )}

              {/* Progress Bar */}
              {(conversionStatus.status === 'uploading' || conversionStatus.status === 'converting') && (
                <div className="mt-4">
                  <div className="flex justify-between text-xs sm:text-sm mb-2">
                    <span className="text-gray-600">{conversionStatus.message}</span>
                    <span className="text-[#5b8ba8] font-medium">{conversionStatus.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <motion.div
                      className="bg-[#5b8ba8] h-2 rounded-full progress-bar-shimmer"
                      initial={{ width: 0 }}
                      animate={{ width: `${conversionStatus.progress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>
              )}

              {/* Success Message */}
              {conversionStatus.status === 'completed' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mt-4 p-3 sm:p-4 bg-green-50 border border-green-200 rounded-lg"
                >
                  <div className="flex items-center gap-2 text-green-700 mb-2">
                    <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium text-sm sm:text-base">
                      Split completed! Extracted {conversionStatus.extractedPages} of {conversionStatus.totalPages} pages.
                    </span>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-700 flex-wrap">
                    <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <span className="truncate max-w-[150px] sm:max-w-none">{conversionStatus.convertedFileName}</span>
                    <span className="text-gray-500">•</span>
                    <span className="text-gray-500">{conversionStatus.convertedFileSize}</span>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              {conversionStatus.status === 'idle' && (
                <>
                  <button
                    onClick={handleConvert}
                    className="flex-1 bg-[#5b8ba8] text-white px-5 sm:px-6 py-3 rounded-lg text-sm sm:text-base font-medium hover:bg-[#4a7a94] transition-colors flex items-center justify-center gap-2 btn-lift"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" transform="rotate(90 12 12)" />
                    </svg>
                    Split PDF
                  </button>
                  <button
                    onClick={handleRemoveFile}
                    className="px-5 sm:px-6 py-3 border border-gray-300 rounded-lg text-sm sm:text-base font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </>
              )}

              {conversionStatus.status === 'completed' && (
                <>
                  <button
                    onClick={handleDownload}
                    className="flex-1 bg-[#5b8ba8] text-white px-5 sm:px-6 py-3 rounded-lg text-sm sm:text-base font-medium hover:bg-[#4a7a94] transition-colors flex items-center justify-center gap-2 btn-lift"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download Split PDF
                  </button>
                  <button
                    onClick={handleRemoveFile}
                    className="px-5 sm:px-6 py-3 border border-gray-300 rounded-lg text-sm sm:text-base font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Split Another
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-10 sm:mt-12 lg:mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6"
        >
          <div className="text-center p-4">
            <div className="w-12 h-12 bg-[#5b8ba8]/10 rounded-full flex items-center justify-center mx-auto mb-3 icon-hover-float">
              <svg className="w-6 h-6 text-[#5b8ba8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="font-semibold text-[#1a1c1e] mb-1 sm:mb-2 text-sm sm:text-base">Flexible Ranges</h3>
            <p className="text-xs sm:text-sm text-gray-600">Extract single pages, ranges, or combinations like &quot;1-3, 5, 8-10&quot;</p>
          </div>
          <div className="text-center p-4">
            <div className="w-12 h-12 bg-[#5b8ba8]/10 rounded-full flex items-center justify-center mx-auto mb-3 icon-hover-float">
              <svg className="w-6 h-6 text-[#5b8ba8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="font-semibold text-[#1a1c1e] mb-1 sm:mb-2 text-sm sm:text-base">Fast Processing</h3>
            <p className="text-xs sm:text-sm text-gray-600">Split your PDF in seconds with no quality loss</p>
          </div>
          <div className="text-center p-4">
            <div className="w-12 h-12 bg-[#5b8ba8]/10 rounded-full flex items-center justify-center mx-auto mb-3 icon-hover-float">
              <svg className="w-6 h-6 text-[#5b8ba8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="font-semibold text-[#1a1c1e] mb-1 sm:mb-2 text-sm sm:text-base">Secure & Private</h3>
            <p className="text-xs sm:text-sm text-gray-600">Your files are encrypted and automatically deleted after 24 hours</p>
          </div>
        </motion.div>
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
          <div className="text-sm text-gray-600">
            © {new Date().getFullYear()} FluxConvert. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
