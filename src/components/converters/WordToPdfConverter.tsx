'use client';

import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/src/lib/supabase/client';
import UserProfile from '@/src/components/UserProfile';
import { useQuota } from '@/src/contexts/QuotaContext';

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
}

interface RateLimitInfo {
  retryAfter: number; // seconds until reset
  limit: number;
  remaining: number;
  resetAt: Date;
}

interface QuotaData {
  limit: number;
  used: number;
  remaining: number;
  resetAt: string;
}

export default function WordToPdfConverter() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [conversionStatus, setConversionStatus] = useState<ConversionStatus>({
    status: 'idle',
    progress: 0,
    message: '',
  });
  const [error, setError] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [quota, setQuota] = useState<QuotaData | null>(null);
  const [rateLimitInfo, setRateLimitInfo] = useState<RateLimitInfo | null>(null);
  const { refreshQuota } = useQuota();

  // Check authentication status and fetch quota
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        setUserEmail(user?.email || null);

        // Fetch quota if user is authenticated
        if (user) {
          const response = await fetch('/api/quota');
          if (response.ok) {
            const quotaData = await response.json();
            setQuota(quotaData);
          }
        }
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
    
    // Handle rejected files
    if (rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0];
      if (rejection.errors[0]?.code === 'file-too-large') {
        setError('File size exceeds 50 MB limit');
      } else if (rejection.errors[0]?.code === 'file-invalid-type') {
        setError('Only .docx files are supported');
      } else {
        setError('Invalid file. Please upload a valid Word document.');
      }
      return;
    }

    // Process accepted files
    const newFiles: UploadedFile[] = acceptedFiles.map((file) => ({
      file,
      id: `${file.name}-${Date.now()}`,
    }));

    setUploadedFiles(newFiles);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxSize: 50 * 1024 * 1024, // 50 MB
    multiple: false,
  });

  const handleConvert = async () => {
    if (uploadedFiles.length === 0) {
      setError('Please upload a file first');
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

      // Simulate upload progress
      setConversionStatus({
        status: 'uploading',
        progress: 30,
        message: 'Uploading file...',
      });

      const response = await fetch('/api/convert/word-to-pdf', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // Handle 429 rate limit error
        if (response.status === 429) {
          const retryAfter = errorData.retryAfter || 3600; // Default to 1 hour
          const resetAt = new Date(Date.now() + retryAfter * 1000);
          
          setRateLimitInfo({
            retryAfter,
            limit: errorData.limit || 10,
            remaining: errorData.remaining || 0,
            resetAt,
          });
          
          throw new Error(`Rate limit exceeded. Please try again at ${resetAt.toLocaleTimeString()}`);
        }
        
        throw new Error(errorData.error || 'Conversion failed');
      }

      setConversionStatus({
        status: 'converting',
        progress: 60,
        message: 'Converting to PDF...',
      });

      const result = await response.json();

      setConversionStatus({
        status: 'completed',
        progress: 100,
        message: 'Conversion completed!',
        downloadUrl: result.downloadUrl,
        convertedFileName: result.fileName,
        convertedFileSize: result.fileSize,
      });

      // Refresh quota display after successful conversion
      if (userEmail) {
        refreshQuota();
        // Also refresh local quota state
        const response = await fetch('/api/quota');
        if (response.ok) {
          const quotaData = await response.json();
          setQuota(quotaData);
        }
      }
    } catch (err: any) {
      setConversionStatus({
        status: 'error',
        progress: 0,
        message: err.message || 'Conversion failed',
      });
      setError(err.message || 'An error occurred during conversion');
    }
  };

  const handleRemoveFile = () => {
    setUploadedFiles([]);
    setConversionStatus({
      status: 'idle',
      progress: 0,
      message: '',
    });
    setError('');
    setRateLimitInfo(null); // Clear rate limit info when removing file
  };

  const handleDownload = () => {
    if (conversionStatus.downloadUrl && conversionStatus.convertedFileName) {
      // Create a proper download link
      const link = document.createElement('a');
      link.href = conversionStatus.downloadUrl;
      link.download = conversionStatus.convertedFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  // Check if conversion should be disabled due to rate limiting
  const isRateLimited = () => {
    if (rateLimitInfo) {
      // Check if we're still within the rate limit window
      return Date.now() < rateLimitInfo.resetAt.getTime();
    }
    // Also check quota if available
    if (userEmail && quota && quota.remaining === 0) {
      return true;
    }
    return false;
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-[#1a1c1e] font-body-md antialiased flex flex-col">
      {/* Navigation Bar */}
      <nav className="bg-white border-b border-gray-200 w-full sticky top-0 z-50">
        <div className="flex justify-between items-center w-full px-8 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-8">
            <Link className="text-[#1a1c1e] font-semibold text-lg" href="/">
              FluxConvert
            </Link>
            <div className="hidden md:flex gap-6 text-sm font-medium">
              <Link className="text-[#5b8ba8] hover:text-gray-900 transition-colors" href="/word-to-pdf">
                Word to PDF
              </Link>
              <Link className="text-gray-600 hover:text-gray-900 transition-colors" href="/dashboard">
                Dashboard
              </Link>
              <Link className="text-gray-600 hover:text-gray-900 transition-colors" href="/privacy">
                Privacy
              </Link>
              <Link className="text-gray-600 hover:text-gray-900 transition-colors" href="/terms">
                Terms
              </Link>
              <Link className="text-gray-600 hover:text-gray-900 transition-colors" href="/help-center">
                Help Center
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {isLoading ? (
              <div className="w-9 h-9 rounded-full bg-gray-200 animate-pulse"></div>
            ) : userEmail ? (
              <UserProfile userEmail={userEmail} />
            ) : (
              <>
                <Link className="text-gray-700 text-sm font-medium hover:text-gray-900 transition-colors" href="/login">
                  Login
                </Link>
                <Link className="bg-[#5b8ba8] text-white px-4 py-2 rounded text-sm font-medium hover:bg-[#4a7a94] transition-colors" href="/register">
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto px-6 w-full py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-[#1a1c1e] mb-4 tracking-tight">
            Word to PDF Converter
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Convert your Word documents (.docx) to PDF format quickly and easily. 
            Maintain formatting, images, and layout.
          </p>
        </div>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quota Exceeded Warning */}
        {userEmail && quota && quota.remaining === 0 && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="font-medium mb-1">Conversion Limit Reached</p>
                <p className="text-sm">
                  You've used all {quota.limit} conversions for this hour. Your quota will reset at{' '}
                  <span className="font-semibold">{new Date(quota.resetAt).toLocaleTimeString()}</span>.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Rate Limit Warning (429 response) */}
        {rateLimitInfo && isRateLimited() && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="font-medium mb-1">Rate Limit Exceeded</p>
                <p className="text-sm">
                  You've reached the maximum of {rateLimitInfo.limit} conversions per hour. 
                  Please try again at{' '}
                  <span className="font-semibold">{rateLimitInfo.resetAt.toLocaleTimeString()}</span>
                  {' '}({Math.ceil(rateLimitInfo.retryAfter / 60)} minutes).
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Upload Area or File Preview */}
        {uploadedFiles.length === 0 ? (
          <div
            {...getRootProps()}
            className={`w-full bg-white border-2 border-dashed rounded-lg p-16 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all ${
              isDragActive
                ? 'border-[#5b8ba8] bg-[#5b8ba8]/5'
                : 'border-gray-300 hover:border-[#5b8ba8] hover:bg-gray-50'
            }`}
          >
            <input {...getInputProps()} />
            <div className="w-16 h-16 flex items-center justify-center">
              <svg className="w-16 h-16 text-[#5b8ba8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <div className="space-y-2 text-center">
              <h3 className="text-xl font-semibold text-[#1a1c1e]">
                {isDragActive ? 'Drop your Word file here' : 'Drag & Drop your Word file here'}
              </h3>
              <p className="text-sm text-gray-500">or click to browse your device</p>
            </div>
            <button className="mt-4 bg-[#5b8ba8] text-white px-6 py-2.5 rounded text-sm font-medium hover:bg-[#4a7a94] transition-colors flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
              </svg>
              Select Word File
            </button>
            <p className="text-xs text-gray-500 mt-4">Supports .docx files up to 50MB</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* File Preview */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-medium text-[#1a1c1e]">{uploadedFiles[0].file.name}</h4>
                    <p className="text-sm text-gray-500">{formatFileSize(uploadedFiles[0].file.size)}</p>
                  </div>
                </div>
                {conversionStatus.status === 'idle' && (
                  <button
                    onClick={handleRemoveFile}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Progress Bar */}
              {(conversionStatus.status === 'uploading' || conversionStatus.status === 'converting') && (
                <div className="mt-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">{conversionStatus.message}</span>
                    <span className="text-[#5b8ba8] font-medium">{conversionStatus.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <motion.div
                      className="bg-[#5b8ba8] h-2 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${conversionStatus.progress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>
              )}

              {/* Success Message */}
              {conversionStatus.status === 'completed' && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 text-green-700 mb-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium">Conversion completed successfully!</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-700">
                    <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <span>{conversionStatus.convertedFileName}</span>
                    <span className="text-gray-500">•</span>
                    <span className="text-gray-500">{conversionStatus.convertedFileSize}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              {conversionStatus.status === 'idle' && (
                <>
                  <button
                    onClick={handleConvert}
                    disabled={isRateLimited()}
                    className="flex-1 bg-[#5b8ba8] text-white px-6 py-3 rounded-lg text-base font-medium hover:bg-[#4a7a94] transition-colors flex items-center justify-center gap-2 disabled:bg-gray-300 disabled:cursor-not-allowed disabled:hover:bg-gray-300"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Convert to PDF
                  </button>
                  <button
                    onClick={handleRemoveFile}
                    className="px-6 py-3 border border-gray-300 rounded-lg text-base font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </>
              )}

              {conversionStatus.status === 'completed' && (
                <>
                  <button
                    onClick={handleDownload}
                    className="flex-1 bg-[#5b8ba8] text-white px-6 py-3 rounded-lg text-base font-medium hover:bg-[#4a7a94] transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download PDF
                  </button>
                  <button
                    onClick={handleRemoveFile}
                    className="px-6 py-3 border border-gray-300 rounded-lg text-base font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Convert Another
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Features */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-[#5b8ba8]/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-[#5b8ba8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="font-semibold text-[#1a1c1e] mb-2">Secure & Private</h3>
            <p className="text-sm text-gray-600">Your files are encrypted and automatically deleted after 24 hours</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-[#5b8ba8]/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-[#5b8ba8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="font-semibold text-[#1a1c1e] mb-2">Fast Conversion</h3>
            <p className="text-sm text-gray-600">Convert your documents in seconds with our optimized engine</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-[#5b8ba8]/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-[#5b8ba8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-semibold text-[#1a1c1e] mb-2">High Quality</h3>
            <p className="text-sm text-gray-600">Maintain formatting, images, and layout in the converted PDF</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16 w-full">
        <div className="max-w-7xl mx-auto py-8 px-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-base font-semibold text-[#1a1c1e]">
            FluxConvert
          </div>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-600">
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
