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
  multipleFiles?: { fileName: string; fileSize: string; downloadUrl: string }[];
}

type PageOrientation = 'portrait' | 'landscape';
type PageSizeMode = 'a4' | 'fit';
type MarginOption = 'none' | 'small' | 'big';

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

  // Settings state
  const [orientation, setOrientation] = useState<PageOrientation>('portrait');
  const [pageSize, setPageSize] = useState<PageSizeMode>('a4');
  const [margin, setMargin] = useState<MarginOption>('none');
  const [mergeAll, setMergeAll] = useState(true);

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

      // Append settings
      formData.append('orientation', orientation);
      formData.append('pageSize', pageSize);
      formData.append('margin', margin);
      formData.append('mergeAll', String(mergeAll));

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

      if (result.multiple && result.files) {
        // Multiple separate PDFs
        setConversionStatus({
          status: 'completed',
          progress: 100,
          message: 'Conversion completed!',
          multipleFiles: result.files,
        });
      } else {
        // Single merged PDF
        setConversionStatus({
          status: 'completed',
          progress: 100,
          message: 'Conversion completed!',
          downloadUrl: result.downloadUrl,
          convertedFileName: result.fileName,
          convertedFileSize: result.fileSize,
        });
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

  const handleDownload = (url?: string, fileName?: string) => {
    const downloadUrl = url || conversionStatus.downloadUrl;
    const downloadName = fileName || conversionStatus.convertedFileName;
    if (downloadUrl && downloadName) {
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = downloadName;
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

        {/* File List & Settings */}
        {uploadedFiles.length > 0 && (
          <div className="mt-6 space-y-6">
            {/* Uploaded Images List */}
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

            {/* PDF Settings Panel */}
            {conversionStatus.status === 'idle' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-white border border-gray-200 rounded-lg p-6"
              >
                <div className="flex items-center gap-2 mb-6">
                  <svg className="w-5 h-5 text-[#5b8ba8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <h3 className="text-lg font-semibold text-[#1a1c1e]">PDF Settings</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Page Orientation */}
                  <div>
                    <label className="block text-sm font-medium text-[#1a1c1e] mb-3">
                      Page Orientation
                    </label>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setOrientation('portrait')}
                        className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                          orientation === 'portrait'
                            ? 'border-[#5b8ba8] bg-[#5b8ba8]/5 text-[#5b8ba8]'
                            : 'border-gray-200 hover:border-gray-300 text-gray-500'
                        }`}
                      >
                        <div className={`w-8 h-11 border-2 rounded-sm ${
                          orientation === 'portrait' ? 'border-[#5b8ba8]' : 'border-gray-300'
                        }`} />
                        <span className="text-sm font-medium">Portrait</span>
                      </button>
                      <button
                        onClick={() => setOrientation('landscape')}
                        className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                          orientation === 'landscape'
                            ? 'border-[#5b8ba8] bg-[#5b8ba8]/5 text-[#5b8ba8]'
                            : 'border-gray-200 hover:border-gray-300 text-gray-500'
                        }`}
                      >
                        <div className={`w-11 h-8 border-2 rounded-sm ${
                          orientation === 'landscape' ? 'border-[#5b8ba8]' : 'border-gray-300'
                        }`} />
                        <span className="text-sm font-medium">Landscape</span>
                      </button>
                    </div>
                  </div>

                  {/* Page Size */}
                  <div>
                    <label className="block text-sm font-medium text-[#1a1c1e] mb-3">
                      Page Size
                    </label>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setPageSize('a4')}
                        className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                          pageSize === 'a4'
                            ? 'border-[#5b8ba8] bg-[#5b8ba8]/5 text-[#5b8ba8]'
                            : 'border-gray-200 hover:border-gray-300 text-gray-500'
                        }`}
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        <span className="text-sm font-medium">A4</span>
                        <span className="text-xs text-gray-400">210 × 297mm</span>
                      </button>
                      <button
                        onClick={() => setPageSize('fit')}
                        className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                          pageSize === 'fit'
                            ? 'border-[#5b8ba8] bg-[#5b8ba8]/5 text-[#5b8ba8]'
                            : 'border-gray-200 hover:border-gray-300 text-gray-500'
                        }`}
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                        </svg>
                        <span className="text-sm font-medium">Fit</span>
                        <span className="text-xs text-gray-400">Match image</span>
                      </button>
                    </div>
                  </div>

                  {/* Margin */}
                  <div>
                    <label className="block text-sm font-medium text-[#1a1c1e] mb-3">
                      Margin
                    </label>
                    <div className="flex gap-3">
                      {([
                        { value: 'none' as MarginOption, label: 'No Margin', icon: '0' },
                        { value: 'small' as MarginOption, label: 'Small', icon: 'S' },
                        { value: 'big' as MarginOption, label: 'Big', icon: 'L' },
                      ]).map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => setMargin(opt.value)}
                          className={`flex-1 flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all ${
                            margin === opt.value
                              ? 'border-[#5b8ba8] bg-[#5b8ba8]/5 text-[#5b8ba8]'
                              : 'border-gray-200 hover:border-gray-300 text-gray-500'
                          }`}
                        >
                          <div className={`w-8 h-8 border rounded-sm flex items-center justify-center relative ${
                            margin === opt.value ? 'border-[#5b8ba8]' : 'border-gray-300'
                          }`}>
                            {opt.value === 'none' && (
                              <div className={`w-full h-full rounded-sm ${margin === opt.value ? 'bg-[#5b8ba8]/20' : 'bg-gray-100'}`} />
                            )}
                            {opt.value === 'small' && (
                              <div className={`w-5 h-5 rounded-sm ${margin === opt.value ? 'bg-[#5b8ba8]/20' : 'bg-gray-100'}`} />
                            )}
                            {opt.value === 'big' && (
                              <div className={`w-3 h-3 rounded-sm ${margin === opt.value ? 'bg-[#5b8ba8]/20' : 'bg-gray-100'}`} />
                            )}
                          </div>
                          <span className="text-xs font-medium">{opt.label}</span>
                        </button>
                      ))}
                    </div>
                    {pageSize === 'fit' && (
                      <p className="mt-2 text-xs text-amber-600 flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        Margin is only applied when page size is A4
                      </p>
                    )}
                  </div>

                  {/* Merge All Checkbox */}
                  <div>
                    <label className="block text-sm font-medium text-[#1a1c1e] mb-3">
                      Output Mode
                    </label>
                    <label
                      className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        mergeAll
                          ? 'border-[#5b8ba8] bg-[#5b8ba8]/5'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="relative flex items-center">
                        <input
                          type="checkbox"
                          checked={mergeAll}
                          onChange={(e) => setMergeAll(e.target.checked)}
                          className="sr-only"
                        />
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                          mergeAll
                            ? 'bg-[#5b8ba8] border-[#5b8ba8]'
                            : 'border-gray-300 bg-white'
                        }`}>
                          {mergeAll && (
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </div>
                      <div>
                        <span className={`text-sm font-medium ${mergeAll ? 'text-[#5b8ba8]' : 'text-gray-700'}`}>
                          Merge all images in one PDF file
                        </span>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {mergeAll
                            ? 'All images will be combined into a single PDF document'
                            : 'Each image will be converted to a separate PDF file'}
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
              </motion.div>
            )}

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

            {/* Success Message - Single PDF */}
            {conversionStatus.status === 'completed' && conversionStatus.downloadUrl && (
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

            {/* Success Message - Multiple PDFs */}
            {conversionStatus.status === 'completed' && conversionStatus.multipleFiles && (
              <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 text-green-700">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium">
                      {conversionStatus.multipleFiles.length} PDF files created successfully!
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  {conversionStatus.multipleFiles.map((pf, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3 text-sm">
                        <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        <span className="font-medium text-[#1a1c1e]">{pf.fileName}</span>
                        <span className="text-gray-500">•</span>
                        <span className="text-gray-500">{pf.fileSize}</span>
                      </div>
                      <button
                        onClick={() => handleDownload(pf.downloadUrl, pf.fileName)}
                        className="text-[#5b8ba8] hover:text-[#4a7a94] transition-colors p-1.5"
                        title={`Download ${pf.fileName}`}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </button>
                    </div>
                  ))}
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

              {conversionStatus.status === 'completed' && conversionStatus.downloadUrl && (
                <>
                  <button
                    onClick={() => handleDownload()}
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

              {conversionStatus.status === 'completed' && conversionStatus.multipleFiles && (
                <button
                  onClick={() => handleRemoveFile()}
                  className="flex-1 bg-[#5b8ba8] text-white px-6 py-3 rounded-lg text-base font-medium hover:bg-[#4a7a94] transition-colors flex items-center justify-center gap-2"
                >
                  Convert Another
                </button>
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="font-semibold text-[#1a1c1e] mb-2">Custom Settings</h3>
            <p className="text-sm text-gray-600">Choose orientation, page size, margin, and output mode</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-[#5b8ba8]/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-[#5b8ba8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-semibold text-[#1a1c1e] mb-2">High Quality</h3>
            <p className="text-sm text-gray-600">Images are optimized at 95% quality for accurate, high-fidelity PDFs</p>
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
