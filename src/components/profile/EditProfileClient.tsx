'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/src/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import Image from 'next/image';
import { useToast } from '@/src/components/Toast';

interface EditProfileClientProps {
  user: User;
}

export default function EditProfileClient({ user }: EditProfileClientProps) {
  const { showToast } = useToast();
  const [fullName, setFullName] = useState(user.user_metadata?.full_name || user.user_metadata?.name || '');
  const [avatarUrl, setAvatarUrl] = useState(user.user_metadata?.avatar_url || '');
  const [displayAvatarUrl, setDisplayAvatarUrl] = useState(user.user_metadata?.avatar_url || '');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Resolve private storage URLs to signed URLs on client
  useEffect(() => {
    const resolveAvatar = async () => {
      if (!avatarUrl) {
        setDisplayAvatarUrl('');
        return;
      }

      if (avatarUrl.startsWith('data:') || avatarUrl.startsWith('blob:')) {
        setDisplayAvatarUrl(avatarUrl);
        return;
      }

      try {
        const supabase = createClient();
        let path = avatarUrl;
        if (avatarUrl.includes('/uploads/')) {
          path = avatarUrl.split('/uploads/')[1];
        }
        path = path.split('?')[0];

        const bucket = supabase.storage.from('uploads');
        if (typeof bucket.createSignedUrl !== 'function') {
          setDisplayAvatarUrl(avatarUrl);
          return;
        }

        const { data, error } = await bucket.createSignedUrl(path, 31536000); // 1 year expiry

        if (!error && data?.signedUrl) {
          setDisplayAvatarUrl(data.signedUrl);
        } else {
          setDisplayAvatarUrl(avatarUrl);
        }
      } catch (err) {
        console.error('Error resolving signed URL:', err);
        setDisplayAvatarUrl(avatarUrl);
      }
    };

    resolveAvatar();
  }, [avatarUrl]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      const errText = 'Please upload an image file';
      setMessage({ type: 'error', text: errText });
      showToast(errText, 'error');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      const errText = 'Image size must be less than 2MB';
      setMessage({ type: 'error', text: errText });
      showToast(errText, 'error');
      return;
    }

    setIsUploading(true);
    setMessage(null);

    try {
      const supabase = createClient();
      
      // Upload to Supabase Storage - using 'uploads' bucket instead of 'avatars'
      const fileExt = file.name.split('.').pop();
      const fileName = `avatar-${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('uploads')
        .getPublicUrl(filePath);

      setAvatarUrl(publicUrl);
      setDisplayAvatarUrl(publicUrl);
      setMessage({ type: 'success', text: 'Avatar uploaded successfully!' });
      showToast('Avatar uploaded successfully!', 'success');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      setMessage({ type: 'error', text: 'Failed to upload avatar' });
      showToast('Failed to upload avatar', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const supabase = createClient();

      // Update user metadata
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: fullName,
          avatar_url: avatarUrl,
        },
      });

      if (error) throw error;

      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      showToast('Profile updated successfully!', 'success');
      
      // Refresh the page after 1 second
      setTimeout(() => {
        router.refresh();
      }, 1000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ type: 'error', text: 'Failed to update profile' });
      showToast('Failed to update profile', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = () => {
    if (fullName) {
      const names = fullName.trim().split(' ');
      if (names.length >= 2) {
        return (names[0][0] + names[1][0]).toUpperCase();
      }
      return fullName.substring(0, 2).toUpperCase();
    }
    const name = user.email?.split('@')[0] || '';
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#1a1c1e]">Edit Profile</h1>
        <p className="text-gray-600 mt-2">Update your profile information and avatar</p>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          <div className="flex items-start gap-3">
            {message.type === 'success' ? (
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            <p className="text-sm font-medium">{message.text}</p>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
        {/* Avatar Section */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Profile Picture</label>
          <div className="flex items-center gap-6">
            {/* Avatar Preview */}
            <div className="relative flex-shrink-0">
              {displayAvatarUrl ? (
                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-gray-200 flex items-center justify-center bg-gray-50">
                  <img
                    src={displayAvatarUrl}
                    alt="Profile"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              ) : (
                <div className="w-24 h-24 rounded-full bg-[#5b8ba8] text-white flex items-center justify-center text-2xl font-semibold flex-shrink-0">
                  {getInitials()}
                </div>
              )}
              {isUploading && (
                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-white animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
              )}
            </div>

            {/* Upload Button */}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isUploading ? 'Uploading...' : 'Change Avatar'}
              </button>
              <p className="text-xs text-gray-500 mt-2">JPG, PNG or GIF. Max size 2MB.</p>
            </div>
          </div>
        </div>

        {/* Full Name */}
        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
            Full Name
          </label>
          <input
            type="text"
            id="fullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Enter your full name"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5b8ba8] focus:border-transparent outline-none cursor-text text-gray-900 bg-white"
          />
        </div>

        {/* Email (Read-only) */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            value={user.email || ''}
            disabled
            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed font-medium"
          />
          <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2 text-sm font-medium text-white bg-[#5b8ba8] rounded-lg hover:bg-[#4a7a94] transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Saving...
              </span>
            ) : (
              'Save Changes'
            )}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
