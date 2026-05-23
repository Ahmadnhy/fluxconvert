'use client';

import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/src/lib/supabase/client';
import UserProfile from '@/src/components/UserProfile';

interface UploadedFile {
  file: File;
  preview: string;
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

export default function JpgToPdfConverter() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
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

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      uploadedFiles.forEach((f) => URL.revokeObjectURL(f.preview));
    };
  }, [uploadedFiles]);

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    setError('');
    
    if (rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0];
      if (rejection.errors[0]?.code === 'file-too-large') {
        setError('File size exceeds 50 MB limit');
      } else if (rejection.errors[0]?.code === 'file-invalid-type') {
        setError('Only JPG and PNG files are supported');
      } else {
        setError('Invalid file. Please upload a valid image file.');
      }
      return;
    }

    const newFiles: UploadedFile[] = acceptedFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      id: `${file.name}-${Date.now()}-${Math.random()}`,
    }));

    setUploadedFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
    },
    maxSize: 50 * 1024 * 1024,
    multiple: true,
  });

  const handleConvert = async () => {
    if (uploadedFiles.length === 0) {
      setError('Please upload at least one image');
      return;
    }

    setConversionStatus({
      status: 'uploading',
      progress: 0,
      message: 'Uploading files...',
    });

    try {
      const formData = new FormData();
      uploadedFiles.forEach((uf) => {
        formData.append('files', uf.file);
      });

      setConversionStatus({
        status: 'uploading',
        progress: 30,
        message: 'Uploading files...',
      });

      const response = await fetch('/api/convert/jpg-to-pdf', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
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
    } catch (err: any) {
      setConversionStatus({
        status: 'error',
        progress: 0,
        message: err.message || 'Conversion failed',
      });
      setError(err.message || 'An error occurred during conversion');
    }
  };

  const handleRemoveFile = (id?: string) => {
    if (id) {
      setUploadedFiles((prev) => {
        const file = prev.find((f) => f.id === id);
        if (file) URL.revokeObjectURL(file.preview);
        return prev.filter((f) => f.id !== id);
      });
    } else {
      uploadedFiles.forEach((f) => URL.revokeObjectURL(f.preview));
      setUploadedFiles([]);
      setConversionStatus({ status: 'idle', progress: 0, message: '' });
      setError('');
    }
  };

  const handleDownload = () => {
    if (conversionStatus.downloadUrl && conversionStatus.convertedFileName) {
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

  const moveFile = (index: number, direction: 'up' | 'down') => {
    const newFiles = [...uploadedFiles];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newFiles.length) return;
    [newFiles[index], newFiles[targetIndex]] = [newFiles[targetIndex], newFiles[index]];
    setUploadedFiles(newFiles);
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-[#1a1c1e] font-body-md antialiased flex flex-col">
      {/* Navigation Bar */}
      <nav className="bg-white border-b border-gray-200 w-full sticky top-0 z-50">
        <div className="flex justify-between items-center w-full px-8 py-4 max-w-7xl mx-auto">
          <Link className="text-[#1a1c1e] font-semibold text-lg" href="/">
            FluxConvert
          </Link>
          
          <div className="hidden md:flex gap-8 text-sm font-medium absolute left-1/2 transform -translate-x-1/2">
            {userEmail && (
              <Link className="text-gray-600 hover:text-gray-900 transition-colors" href="/dashboard">
                Dashboard
              </Link>
            )}
            <Link className="text-gray-600 hover:text-gray-900 transition-colors" href="/word-to-pdf">
              Word to PDF
            </Link>
            <Link className="text-[#5b8ba8] hover:text-gray-900 transition-colors" href="/jpg-to-pdf">
              JPG to PDF
            </Link>
            <Link className="text-gray-600 hover:text-gray-900 transition-colors" href="/merge-pdf">
              Merge PDF
            </Link>
            <Link className="text-gray-600 hover:text-gray-900 transition-colors" href="/split-pdf">
              Split PDF
            </Link>
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
            JPG to PDF Converter
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Convert your JPG and PNG images to a single PDF document. 
            Upload multiple images and arrange them in your preferred order.
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

        {/* Upload Area */}
        <div
          {...getRootProps()}
          className={`w-full bg-white border-2 border-dashed rounded-lg p-12 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all ${
            isDragActive
              ? 'border-[#5b8ba8] bg-[#5b8ba8]/5'
              : 'border-gray-300 hover:border-[#5b8ba8] hover:bg-gray-50'
          }`}
        >
          <input {...getInputProps()} />
          <div className="w-16 h-16 flex items-center justify-center">
            <svg className="w-16 h-16 text-[#5b8ba8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="space-y-2 text-center">
            <h3 className="text-xl font-semibold text-[#1a1c1e]">
              {isDragActive ? 'Drop your images here' : 'Drag & Drop your images here'}
            </h3>
            <p className="text-sm text-gray-500">or click to browse your device</p>
          </div>
          <button className="mt-4 bg-[#5b8ba8] text-white px-6 py-2.5 rounded text-sm font-medium hover:bg-[#4a7a94] transition-colors flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
            </svg>
            Select Images
          </button>
          <p className="text-xs text-gray-500 mt-4">Supports JPG, JPEG, PNG files up to 50MB each (max 20 files)</p>
        </div>

        {/* File List */}
        {uploadedFiles.length > 0 && (
          <div className="mt-6 space-y-6">
            <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
              {uploadedFiles.map((uf, index) => (
                <div key={uf.id} className="flex items-center gap-4 p-4">
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                    <img src={uf.preview} alt={uf.file.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-[#1a1c1e] truncate">{uf.file.name}</h4>
                    <p className="text-sm text-gray-500">{formatFileSize(uf.file.size)}</p>
                  </div>
                  {conversionStatus.status === 'idle' && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); moveFile(index, 'up'); }}
                        disabled={index === 0}
                        className="p-1.5 text-gray-400 hover:text-gray-600 disabled:opacity-30 transition-colors"
                        title="Move up"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); moveFile(index, 'down'); }}
                        disabled={index === uploadedFiles.length - 1}
                        className="p-1.5 text-gray-400 hover:text-gray-600 disabled:opacity-30 transition-colors"
                        title="Move down"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleRemoveFile(uf.id); }}
                        className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                        title="Remove"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <p className="text-sm text-gray-500 text-center">
              {uploadedFiles.length} image{uploadedFiles.length > 1 ? 's' : ''} selected — each image will be a page in the PDF
            </p>

            {/* Progress Bar */}
            {(conversionStatus.status === 'uploading' || conversionStatus.status === 'converting') && (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
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
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
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
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4">
              {conversionStatus.status === 'idle' && (
                <>
                  <button
                    onClick={handleConvert}
                    className="flex-1 bg-[#5b8ba8] text-white px-6 py-3 rounded-lg text-base font-medium hover:bg-[#4a7a94] transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Convert to PDF
                  </button>
                  <button
                    onClick={() => handleRemoveFile()}
                    className="px-6 py-3 border border-gray-300 rounded-lg text-base font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Clear All
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
                    onClick={() => handleRemoveFile()}
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="font-semibold text-[#1a1c1e] mb-2">Multiple Images</h3>
            <p className="text-sm text-gray-600">Upload up to 20 images and combine them into a single PDF</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-[#5b8ba8]/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-[#5b8ba8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
            </div>
            <h3 className="font-semibold text-[#1a1c1e] mb-2">Custom Order</h3>
            <p className="text-sm text-gray-600">Arrange your images in any order before converting</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-[#5b8ba8]/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-[#5b8ba8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-semibold text-[#1a1c1e] mb-2">High Quality</h3>
            <p className="text-sm text-gray-600">Images are optimized and properly fitted to their original dimensions</p>
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
