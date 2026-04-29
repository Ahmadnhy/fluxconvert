'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/src/lib/supabase/client';
import Link from 'next/link';

interface Conversion {
  id: string;
  conversion_type: string;
  status: string;
  created_at: string;
  completed_at: string | null;
  input_file: {
    file_name: string;
    file_size: number;
  } | null;
  output_file: {
    file_name: string;
    file_size: number;
    storage_path: string;
  } | null;
}

export default function ConversionHistory() {
  const [conversions, setConversions] = useState<Conversion[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const supabase = createClient();

  useEffect(() => {
    fetchConversions();
  }, [filter]);

  const fetchConversions = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('conversions')
        .select(`
          id,
          conversion_type,
          status,
          created_at,
          completed_at,
          input_file:input_file_id(file_name, file_size),
          output_file:output_file_id(file_name, file_size, storage_path)
        `)
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('conversion_type', filter);
      }

      const { data, error } = await query;

      if (error) throw error;

      setConversions((data as any) || []);
    } catch (error) {
      console.error('Error fetching conversions:', error);
    } finally {
      setLoading(false);
    }
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
      processing: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Processing' },
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pending' },
      failed: { bg: 'bg-red-100', text: 'text-red-700', label: 'Failed' },
    };
    const badge = badges[status] || badges.pending;
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  const filteredConversions = conversions.filter((conversion) => {
    if (!searchQuery) return true;
    const inputFileName = conversion.input_file?.file_name?.toLowerCase() || '';
    const outputFileName = conversion.output_file?.file_name?.toLowerCase() || '';
    const query = searchQuery.toLowerCase();
    return inputFileName.includes(query) || outputFileName.includes(query);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h2 className="text-2xl font-bold text-[#1a1c1e]">Conversion History</h2>
        
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Search by filename..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5b8ba8] focus:border-transparent outline-none"
          />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5b8ba8] focus:border-transparent outline-none"
          >
            <option value="all">All Types</option>
            <option value="word-to-pdf">Word to PDF</option>
            <option value="pdf-to-word">PDF to Word</option>
            <option value="jpg-to-pdf">JPG to PDF</option>
            <option value="pdf-to-jpg">PDF to JPG</option>
            <option value="merge-pdf">Merge PDF</option>
            <option value="split-pdf">Split PDF</option>
          </select>
        </div>
      </div>

      {/* Conversions List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5b8ba8]"></div>
        </div>
      ) : filteredConversions.length === 0 ? (
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
        <div className="space-y-3">
          {filteredConversions.map((conversion) => (
            <div
              key={conversion.id}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm font-medium text-[#5b8ba8]">
                      {getConversionTypeLabel(conversion.conversion_type)}
                    </span>
                    {getStatusBadge(conversion.status)}
                  </div>
                  
                  <div className="space-y-1">
                    {conversion.input_file && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span>{conversion.input_file.file_name}</span>
                        <span className="text-gray-400">•</span>
                        <span>{formatFileSize(conversion.input_file.file_size)}</span>
                      </div>
                    )}
                    
                    {conversion.output_file && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{conversion.output_file.file_name}</span>
                        <span className="text-gray-400">•</span>
                        <span>{formatFileSize(conversion.output_file.file_size)}</span>
                      </div>
                    )}
                  </div>
                  
                  <p className="text-xs text-gray-500 mt-2">
                    {formatDate(conversion.created_at)}
                  </p>
                </div>

                {conversion.status === 'completed' && conversion.output_file && (
                  <button
                    onClick={() => {
                      // Download logic here
                      console.log('Download:', conversion.output_file?.storage_path);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-[#5b8ba8] text-white rounded-lg hover:bg-[#4a7a94] transition-colors text-sm font-medium"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
