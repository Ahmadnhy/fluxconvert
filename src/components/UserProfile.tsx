'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/src/lib/supabase/client';
import ConfirmDialog from '@/src/components/ConfirmDialog';

interface UserProfileProps {
  userEmail: string;
}

export default function UserProfile({ userEmail }: UserProfileProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [userName, setUserName] = useState<string>('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Fetch user profile data
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          // Try to get user metadata (name)
          const displayName = user.user_metadata?.full_name || user.user_metadata?.name || '';
          setUserName(displayName);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };

    fetchUserProfile();
  }, []);

  // Get user initials from name or email
  const getInitials = () => {
    if (userName) {
      const names = userName.trim().split(' ');
      if (names.length >= 2) {
        return (names[0][0] + names[1][0]).toUpperCase();
      }
      return userName.substring(0, 2).toUpperCase();
    }
    
    // Fallback to email
    const name = userEmail.split('@')[0];
    return name.substring(0, 2).toUpperCase();
  };

  // Get display name (first 2 words)
  const getDisplayName = () => {
    if (userName) {
      const names = userName.trim().split(' ');
      return names.slice(0, 2).join(' ');
    }
    return userEmail.split('@')[0];
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      setShowLogoutConfirm(false);
      setIsOpen(false);
      router.push('/');
      router.refresh();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        {/* Profile Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer border border-gray-200"
        >
          <span className="hidden md:block text-sm font-medium text-gray-700">
            {getDisplayName()}
          </span>
          <div className="w-9 h-9 rounded-full bg-[#5b8ba8] text-white flex items-center justify-center text-sm font-semibold flex-shrink-0">
            {getInitials()}
          </div>
          <svg
            className={`w-4 h-4 text-gray-600 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50">
            {/* User Info */}
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-sm font-semibold text-[#1a1c1e] truncate">{userName || userEmail.split('@')[0]}</p>
              <p className="text-xs text-gray-500 mt-0.5 truncate">{userEmail}</p>
            </div>

            {/* Menu Items */}
            <div className="py-1">
              <button
                onClick={() => {
                  setIsOpen(false);
                  router.push('/profile/edit');
                }}
                className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors cursor-pointer"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Edit Profile
              </button>

              <div className="border-t border-gray-100 my-1"></div>

              <button
                onClick={() => {
                  setIsOpen(false);
                  setShowLogoutConfirm(true);
                }}
                className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Logout Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
        title="Logout"
        message="Are you sure you want to logout from your account?"
        confirmText="Logout"
        cancelText="Cancel"
        confirmButtonClass="bg-red-600 hover:bg-red-700"
        isLoading={isLoading}
      />
    </>
  );
}
