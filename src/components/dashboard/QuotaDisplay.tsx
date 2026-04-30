'use client';

import { useEffect, useState } from 'react';
import { useQuota } from '@/src/contexts/QuotaContext';

interface QuotaData {
  limit: number;
  used: number;
  remaining: number;
  resetAt: string;
}

/**
 * QuotaDisplay Component
 * 
 * Displays the user's current conversion quota information.
 * Fetches quota data from /api/quota and displays:
 * - Current conversion count (used)
 * - Remaining conversions
 * - Total limit
 * 
 * Requirements: 9.1, 9.2, 9.4
 */
export default function QuotaDisplay() {
  const [quota, setQuota] = useState<QuotaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { registerRefresh } = useQuota();

  const fetchQuota = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/quota');
      
      if (!response.ok) {
        throw new Error('Failed to fetch quota information');
      }

      const data = await response.json();
      setQuota(data);
    } catch (err: any) {
      console.error('Error fetching quota:', err);
      setError(err.message || 'Failed to load quota information');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuota();
    // Register the refresh function with the context
    registerRefresh(fetchQuota);
  }, [registerRefresh]);

  // Loading state
  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !quota) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
        <p className="text-red-600 text-sm">
          {error || 'Unable to load quota information'}
        </p>
      </div>
    );
  }

  // Calculate percentage for progress bar
  const usagePercentage = (quota.used / quota.limit) * 100;

  // Determine color based on usage
  const getProgressColor = () => {
    if (usagePercentage >= 90) return 'bg-red-500';
    if (usagePercentage >= 70) return 'bg-yellow-500';
    return 'bg-[#5b8ba8]';
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-[#1a1c1e]">
          Conversion Quota
        </h2>
        <button
          onClick={fetchQuota}
          className="text-sm text-[#5b8ba8] hover:text-[#4a7a94] transition-colors"
          aria-label="Refresh quota"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* Quota Stats */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-600 mb-1">Used</p>
          <p className="text-2xl font-bold text-[#1a1c1e]">{quota.used}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-1">Remaining</p>
          <p className="text-2xl font-bold text-[#5b8ba8]">{quota.remaining}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-1">Total Limit</p>
          <p className="text-2xl font-bold text-gray-400">{quota.limit}</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${getProgressColor()}`}
            style={{ width: `${Math.min(usagePercentage, 100)}%` }}
          />
        </div>
      </div>

      {/* Reset Time */}
      <p className="text-xs text-gray-500">
        Quota resets at {new Date(quota.resetAt).toLocaleTimeString()}
      </p>

      {/* Warning Message */}
      {quota.remaining === 0 && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">
            You've reached your conversion limit. Your quota will reset at{' '}
            {new Date(quota.resetAt).toLocaleTimeString()}.
          </p>
        </div>
      )}
    </div>
  );
}
