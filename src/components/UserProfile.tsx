'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/src/lib/supabase/client';
import ConfirmDialog from '@/src/components/ConfirmDialog';
import { useToast } from '@/src/components/Toast';

interface UserProfileProps {
  userEmail: string;
}

export default function UserProfile({ userEmail }: UserProfileProps) {
  const { showToast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [userName, setUserName] = useState<string>('');
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Fetch user profile data
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
        
        if (user) {
          // Try to get user metadata (name)
          const displayName = user.user_metadata?.full_name || user.user_metadata?.name || '';
          setUserName(displayName);

          const rawAvatarUrl = user.user_metadata?.avatar_url || '';
          if (rawAvatarUrl) {
            // Resolve to a signed URL since 'uploads' is private
            let path = rawAvatarUrl;
            if (rawAvatarUrl.includes('/uploads/')) {
              path = rawAvatarUrl.split('/uploads/')[1];
            }
            path = path.split('?')[0];

            const { data, error } = await supabase.storage
              .from('uploads')
              .createSignedUrl(path, 31536000); // 1 year

            if (!error && data?.signedUrl) {
              setAvatarUrl(data.signedUrl);
            } else {
              setAvatarUrl(rawAvatarUrl);
            }
          }
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
      showToast('Successfully logged out!', 'success');
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
      <div className="relative group/profile" ref={dropdownRef}>
        {/* Profile Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl transition-all duration-300 cursor-pointer border border-slate-200/80 bg-white/85 hover:bg-white shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_16px_rgba(91,139,168,0.12)] hover:border-[#5b8ba8]/30 outline-none focus:outline-none"
        >
          <div className="w-8 h-8 rounded-xl overflow-hidden flex-shrink-0 border border-slate-200/60 flex items-center justify-center ring-2 ring-[#5b8ba8]/10 group-hover/profile:ring-[#5b8ba8]/35 transition-all duration-300 bg-slate-50 shadow-sm">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Profile"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#5b8ba8] via-[#4a7a94] to-[#3a617b] text-white flex items-center justify-center text-xs font-bold uppercase tracking-wider">
                {getInitials()}
              </div>
            )}
          </div>
          <span className="hidden md:block text-sm font-semibold text-slate-700 tracking-wide group-hover/profile:text-[#3a617b] transition-colors duration-300">
            {getDisplayName()}
          </span>
          <svg
            className={`w-3.5 h-3.5 text-slate-400 group-hover/profile:text-[#5b8ba8] transition-transform duration-300 ${isOpen ? 'rotate-180 text-[#5b8ba8]' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute right-0 mt-3 w-64 bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0_20px_50px_rgba(91,139,168,0.15)] border border-slate-100 p-2.5 z-50 origin-top-right transition-all duration-300 animate-fadeIn">
            {/* User Info Block */}
            <div className="bg-gradient-to-br from-[#5b8ba8]/5 to-slate-50/50 rounded-xl p-3 border border-slate-100/50 flex items-center gap-3 mb-2 shadow-[inset_0_1px_2px_rgba(255,255,255,0.8)]">
              <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 border border-slate-200/80 flex items-center justify-center bg-white shadow-sm">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Profile"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#5b8ba8] via-[#4a7a94] to-[#3a617b] text-white flex items-center justify-center text-sm font-bold uppercase">
                    {getInitials()}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-900 truncate tracking-tight">{userName || userEmail.split('@')[0]}</p>
                <p className="text-xs text-slate-500 truncate mt-0.5">{userEmail}</p>
                <span className="inline-flex items-center text-[10px] uppercase font-extrabold tracking-wider text-[#5b8ba8] bg-[#5b8ba8]/10 px-2 py-0.5 rounded-full mt-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]">
                  Member
                </span>
              </div>
            </div>

            {/* Menu Items */}
            <div className="space-y-0.5">
              <button
                onClick={() => {
                  setIsOpen(false);
                  router.push('/dashboard');
                }}
                className="w-full px-3.5 py-2.5 text-left text-sm text-slate-700 hover:bg-[#5b8ba8]/8 hover:text-[#3a617b] rounded-xl flex items-center justify-between transition-all duration-200 cursor-pointer font-semibold group/item"
              >
                <div className="flex items-center gap-3">
                  <svg className="w-4.5 h-4.5 text-slate-400 group-hover/item:text-[#5b8ba8] transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                  <span>Dashboard</span>
                </div>
                <svg className="w-4 h-4 text-[#5b8ba8] opacity-0 -translate-x-2 group-hover/item:opacity-100 group-hover/item:translate-x-0 transition-all duration-300 ease-out flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              <button
                onClick={() => {
                  setIsOpen(false);
                  router.push('/profile/edit');
                }}
                className="w-full px-3.5 py-2.5 text-left text-sm text-slate-700 hover:bg-[#5b8ba8]/8 hover:text-[#3a617b] rounded-xl flex items-center justify-between transition-all duration-200 cursor-pointer font-semibold group/item"
              >
                <div className="flex items-center gap-3">
                  <svg className="w-4.5 h-4.5 text-slate-400 group-hover/item:text-[#5b8ba8] transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>Edit Profile</span>
                </div>
                <svg className="w-4 h-4 text-[#5b8ba8] opacity-0 -translate-x-2 group-hover/item:opacity-100 group-hover/item:translate-x-0 transition-all duration-300 ease-out flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              <div className="border-t border-slate-100/80 my-1.5 mx-1"></div>

              <button
                onClick={() => {
                  setIsOpen(false);
                  setShowLogoutConfirm(true);
                }}
                className="w-full px-3.5 py-2.5 text-left text-sm text-red-600 hover:bg-red-50/80 rounded-xl flex items-center justify-between transition-all duration-200 cursor-pointer font-semibold group/item"
              >
                <div className="flex items-center gap-3">
                  <svg className="w-4.5 h-4.5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>Logout</span>
                </div>
                <svg className="w-4 h-4 text-red-500 opacity-0 -translate-x-2 group-hover/item:opacity-100 group-hover/item:translate-x-0 transition-all duration-300 ease-out flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
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
