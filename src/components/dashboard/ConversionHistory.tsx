'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ConfirmDialog from '@/src/components/ConfirmDialog';

interface Conversion {
  id: string;
  conversionType: string;
  status: string;
  createdAt: string;
  completedAt: string | null;
  inputFile: {
    fileName: string;
    fileSize: number;
    fileType: string;
    createdAt: string;
  } | null;
  outputFile: {
    fileName: string;
    fileSize: number;
    fileType: string;
    createdAt: string;
    status: string;
  } | null;
}

interface PaginationMetadata {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function ConversionHistory() {
  const [conversions, setConversions] = useState<Conversion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState<{
    isOpen: boolean;
    conversionId: string | null;
  }>({ isOpen: false, conversionId: null });
  const [pagination, setPagination] = useState<PaginationMetadata>({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    fetchConversions();
  }, [filter, statusFilter, pagination.page]);

  // Remove auto-refresh for pending conversions since we don't have pending status anymore

  const fetchConversions = async (silent: boolean = false) => {
    try {
      if (!silent) {
        setLoading(true);
      }
      setError(null);
      
      // Build query parameters
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (filter !== 'all') {
        params.append('type', filter);
      }

      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }

      // Fetch from API endpoint
      const response = await fetch(`/api/conversions?${params.toString()}`);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('You must be logged in to view conversion history');
        }
        throw new Error('Failed to fetch conversion history');
      }

      const data = await response.json();

      setConversions(data.conversions || []);
      if (data.pagination) {
        setPagination(data.pagination);
      }
    } catch (err) {
      console.error('Error fetching conversions:', err);
      if (!silent) {
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      }
      setConversions([]);
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await fetchConversions();
    setIsRefreshing(false);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getConversionTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      'word-to-pdf': 'Word to PDF',
      'pdf-to-word': 'PDF to Word',
      'jpg-to-pdf': 'JPG to PDF',
      'pdf-to-jpg': 'PDF to JPG',
      'merge-pdf': 'Merge PDF',
      'split-pdf': 'Split PDF',
    };
    return labels[type] || type;
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string; label: string }> = {
      completed: { bg: 'bg-green-100', text: 'text-green-700', label: 'Completed' },
      failed: { bg: 'bg-red-100', text: 'text-red-700', label: 'Failed' },
    };
    const badge = badges[status] || badges.failed;
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  const handleDownload = async (conversionId: string, fileName: string) => {
    try {
      setDownloadingId(conversionId);
      setDownloadError(null);

      // Call the download endpoint to get a fresh signed URL
      const response = await fetch(`/api/conversions/${conversionId}/download`);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('You must be logged in to download files');
        } else if (response.status === 403) {
          throw new Error('You do not have permission to download this file');
        } else if (response.status === 404) {
          throw new Error('File not found or has been deleted');
        } else {
          throw new Error('Failed to generate download link');
        }
      }

      const data = await response.json();

      // Trigger download using the signed URL
      const link = document.createElement('a');
      link.href = data.url;
      link.download = fileName;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (err) {
      console.error('Error downloading file:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to download file';
      setDownloadError(errorMessage);
      
      // Clear error after 5 seconds
      setTimeout(() => {
        setDownloadError(null);
      }, 5000);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDelete = async (conversionId: string) => {
    try {
      setDeletingId(conversionId);
      setDeleteError(null);

      // Send DELETE request to API
      const response = await fetch(`/api/conversions/${conversionId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('You must be logged in to delete conversions');
        } else if (response.status === 403) {
          throw new Error('You do not have permission to delete this conversion');
        } else if (response.status === 404) {
          throw new Error('Conversion not found');
        } else {
          throw new Error('Failed to delete conversion');
        }
      }

      // Remove entry from local state without page refresh
      setConversions(prevConversions => 
        prevConversions.filter(conv => conv.id !== conversionId)
      );

      // Update pagination total count
      setPagination(prev => ({
        ...prev,
        total: prev.total - 1,
        totalPages: Math.ceil((prev.total - 1) / prev.limit),
      }));

      // Close dialog
      setDeleteConfirmDialog({ isOpen: false, conversionId: null });

    } catch (err) {
      console.error('Error deleting conversion:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete conversion';
      setDeleteError(errorMessage);
      
      // Clear error after 5 seconds
      setTimeout(() => {
        setDeleteError(null);
      }, 5000);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h2 className="text-2xl font-bold text-[#1a1c1e]">Conversion History</h2>
        
        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
              isRefreshing
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
            title="Refresh conversion history"
          >
            <svg
              className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 w-full">
        {/* Search with icon */}
        <div className="relative w-full sm:w-auto flex-1 sm:flex-initial sm:min-w-[250px] group">
          <input
            type="text"
            placeholder="Search by filename..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setPagination(prev => ({ ...prev, page: 1 }));
                fetchConversions();
              }
            }}
            className="w-full pl-4 pr-11 py-2.5 bg-white border border-gray-200/80 shadow-sm rounded-xl focus:ring-4 focus:ring-[#5b8ba8]/15 focus:border-[#5b8ba8] outline-none placeholder:text-gray-400 cursor-text hover:border-[#5b8ba8]/40 hover:shadow-md transition-all duration-300 text-sm font-medium text-gray-700"
          />
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none p-1.5 rounded-lg bg-gray-50 group-hover:bg-[#5b8ba8]/10 group-focus-within:bg-[#5b8ba8]/10 transition-colors">
            <svg 
              className="w-4 h-4 text-gray-400 group-hover:text-[#5b8ba8] group-focus-within:text-[#5b8ba8] transition-colors" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Type filter */}
        <div className="relative group">
          <select
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
            className="w-full sm:w-auto pl-4 pr-11 py-2.5 bg-white border border-gray-200/80 shadow-sm rounded-xl focus:ring-4 focus:ring-[#5b8ba8]/15 focus:border-[#5b8ba8] outline-none cursor-pointer hover:border-[#5b8ba8]/40 hover:shadow-md transition-all duration-300 appearance-none text-sm font-medium text-gray-700"
          >
            <option value="all" className="text-gray-500">All Types</option>
            <option value="word-to-pdf" className="text-gray-900">Word to PDF</option>
            <option value="pdf-to-word" className="text-gray-900">PDF to Word</option>
            <option value="jpg-to-pdf" className="text-gray-900">JPG to PDF</option>
            <option value="pdf-to-jpg" className="text-gray-900">PDF to JPG</option>
            <option value="merge-pdf" className="text-gray-900">Merge PDF</option>
            <option value="split-pdf" className="text-gray-900">Split PDF</option>
          </select>
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none bg-gray-50 group-hover:bg-[#5b8ba8]/10 transition-colors p-1.5 rounded-lg">
            <svg className="w-3.5 h-3.5 text-gray-500 group-hover:text-[#5b8ba8] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Status filter */}
        <div className="relative group">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
            className="w-full sm:w-auto pl-4 pr-11 py-2.5 bg-white border border-gray-200/80 shadow-sm rounded-xl focus:ring-4 focus:ring-[#5b8ba8]/15 focus:border-[#5b8ba8] outline-none cursor-pointer hover:border-[#5b8ba8]/40 hover:shadow-md transition-all duration-300 appearance-none text-sm font-medium text-gray-700"
          >
            <option value="all" className="text-gray-500">All Status</option>
            <option value="completed" className="text-gray-900">Completed</option>
            <option value="failed" className="text-gray-900">Failed</option>
          </select>
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none bg-gray-50 group-hover:bg-[#5b8ba8]/10 transition-colors p-1.5 rounded-lg">
            <svg className="w-3.5 h-3.5 text-gray-500 group-hover:text-[#5b8ba8] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-red-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800">Error loading conversions</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
              <button
                onClick={() => fetchConversions()}
                className="mt-3 text-sm font-medium text-red-600 hover:text-red-500"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Download Error Message */}
      {downloadError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-red-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800">Download failed</h3>
              <p className="text-sm text-red-700 mt-1">{downloadError}</p>
            </div>
          </div>
        </div>
      )}

      {/* Delete Error Message */}
      {deleteError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-red-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800">Delete failed</h3>
              <p className="text-sm text-red-700 mt-1">{deleteError}</p>
            </div>
          </div>
        </div>
      )}

      {/* Conversions List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5b8ba8]"></div>
        </div>
      ) : conversions.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No conversions yet</h3>
          <p className="text-gray-600 mb-4">Start converting files to see your history here</p>
          <Link
            href="/word-to-pdf"
            className="inline-block bg-[#5b8ba8] text-white px-6 py-2 rounded-lg font-medium hover:bg-[#4a7a94] transition-colors"
          >
            Start Converting
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {conversions.map((conversion) => (
              <div
                key={conversion.id}
                className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                      <span className="text-sm font-medium text-[#5b8ba8] break-words">
                        {getConversionTypeLabel(conversion.conversionType)}
                      </span>
                      {getStatusBadge(conversion.status)}
                    </div>
                    
                    <div className="space-y-1">
                      {conversion.inputFile && (
                        <div className="flex items-start gap-2 text-sm text-gray-600 min-w-0">
                          <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span className="break-words overflow-wrap-anywhere min-w-0 flex-1">{conversion.inputFile.fileName}</span>
                          <span className="text-gray-400 flex-shrink-0">•</span>
                          <span className="flex-shrink-0">{formatFileSize(conversion.inputFile.fileSize)}</span>
                        </div>
                      )}
                      
                      {conversion.outputFile && (
                        <div className="flex items-start gap-2 text-sm text-gray-600 min-w-0">
                          <svg className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="break-words overflow-wrap-anywhere min-w-0 flex-1">{conversion.outputFile.fileName}</span>
                          <span className="text-gray-400 flex-shrink-0">•</span>
                          <span className="flex-shrink-0">{formatFileSize(conversion.outputFile.fileSize)}</span>
                        </div>
                      )}
                    </div>
                    
                    <p className="text-xs text-gray-500 mt-2">
                      {formatDate(conversion.createdAt)}
                    </p>
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-col items-end gap-2 w-full sm:w-auto mt-2 sm:mt-0 flex-shrink-0">
                    {/* Delete button (available for all statuses) */}
                    <button
                      onClick={() => setDeleteConfirmDialog({ isOpen: true, conversionId: conversion.id })}
                      disabled={deletingId === conversion.id}
                      className={`flex items-center justify-center p-2 rounded-lg transition-colors text-sm font-medium cursor-pointer ${
                        deletingId === conversion.id
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-white border border-red-300 text-red-600 hover:bg-red-50'
                      }`}
                      aria-label="Delete conversion"
                      title="Delete conversion"
                    >
                      {deletingId === conversion.id ? (
                        <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      )}
                    </button>

                    {/* Download button (only if completed and active) */}
                    {conversion.status === 'completed' && conversion.outputFile && conversion.outputFile.status === 'active' && (
                      <button
                        onClick={() => handleDownload(conversion.id, conversion.outputFile!.fileName)}
                        disabled={downloadingId === conversion.id}
                        className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium flex-1 sm:flex-initial cursor-pointer ${
                          downloadingId === conversion.id
                            ? 'bg-gray-400 text-white cursor-not-allowed'
                            : 'bg-[#5b8ba8] text-white hover:bg-[#4a7a94]'
                        }`}
                        title="Download converted file"
                      >
                        {downloadingId === conversion.id ? (
                          <>
                            <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Downloading...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Download
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-gray-200">
              {/* Page info */}
              <div className="text-sm text-gray-600 text-center sm:text-left">
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} total conversions)
              </div>

              {/* Pagination buttons */}
              <div className="flex items-center gap-2 flex-wrap justify-center">
                {/* Previous button */}
                <button
                  onClick={() => {
                    setPagination(prev => ({ ...prev, page: prev.page - 1 }));
                  }}
                  disabled={pagination.page === 1}
                  className={`px-3 sm:px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                    pagination.page === 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Previous
                </button>

                {/* Page numbers */}
                <div className="flex items-center gap-1 flex-wrap justify-center">
                  {(() => {
                    const pages = [];
                    const maxVisiblePages = 5;
                    let startPage = Math.max(1, pagination.page - Math.floor(maxVisiblePages / 2));
                    let endPage = Math.min(pagination.totalPages, startPage + maxVisiblePages - 1);

                    // Adjust start if we're near the end
                    if (endPage - startPage < maxVisiblePages - 1) {
                      startPage = Math.max(1, endPage - maxVisiblePages + 1);
                    }

                    // First page + ellipsis
                    if (startPage > 1) {
                      pages.push(
                        <button
                          key={1}
                          onClick={() => setPagination(prev => ({ ...prev, page: 1 }))}
                          className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg font-medium text-sm bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          1
                        </button>
                      );
                      if (startPage > 2) {
                        pages.push(
                          <span key="ellipsis-start" className="px-1 sm:px-2 text-gray-400">
                            ...
                          </span>
                        );
                      }
                    }

                    // Visible page numbers
                    for (let i = startPage; i <= endPage; i++) {
                      pages.push(
                        <button
                          key={i}
                          onClick={() => setPagination(prev => ({ ...prev, page: i }))}
                          className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg font-medium text-sm transition-colors ${
                            i === pagination.page
                              ? 'bg-[#5b8ba8] text-white'
                              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {i}
                        </button>
                      );
                    }

                    // Ellipsis + last page
                    if (endPage < pagination.totalPages) {
                      if (endPage < pagination.totalPages - 1) {
                        pages.push(
                          <span key="ellipsis-end" className="px-1 sm:px-2 text-gray-400">
                            ...
                          </span>
                        );
                      }
                      pages.push(
                        <button
                          key={pagination.totalPages}
                          onClick={() => setPagination(prev => ({ ...prev, page: pagination.totalPages }))}
                          className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg font-medium text-sm bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          {pagination.totalPages}
                        </button>
                      );
                    }

                    return pages;
                  })()}
                </div>

                {/* Next button */}
                <button
                  onClick={() => {
                    setPagination(prev => ({ ...prev, page: prev.page + 1 }));
                  }}
                  disabled={pagination.page === pagination.totalPages}
                  className={`px-3 sm:px-4 py-2 rounded-lg font-medium text-sm transition-colors cursor-pointer ${
                    pagination.page === pagination.totalPages
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirmDialog.isOpen}
        onClose={() => setDeleteConfirmDialog({ isOpen: false, conversionId: null })}
        onConfirm={() => {
          if (deleteConfirmDialog.conversionId) {
            handleDelete(deleteConfirmDialog.conversionId);
          }
        }}
        title="Delete Conversion"
        message="Are you sure you want to delete this conversion? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        confirmButtonClass="bg-red-600 hover:bg-red-700"
        isLoading={deletingId === deleteConfirmDialog.conversionId}
      />
    </div>
  );
}
