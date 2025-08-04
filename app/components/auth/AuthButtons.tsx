'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/useAuth';

interface AuthButtonsProps {
  onAuthSuccess?: () => void;
  compact?: boolean;
}

export default function AuthButtons({ onAuthSuccess, compact = false }: AuthButtonsProps) {
  const { user, loading, isAuthenticated, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      const result = await signOut();
      if (!result.success) {
        alert(result.error || 'حدث خطأ أثناء تسجيل الخروج');
      }
    } catch (error) {
      console.error('Error during sign out:', error);
      alert('حدث خطأ أثناء تسجيل الخروج');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-300"></div>
        <span className="text-sm text-gray-300">جاري التحميل...</span>
      </div>
    );
  }

  if (isAuthenticated && user) {
    return (
      <div className={`flex items-center ${compact ? 'gap-2' : 'gap-4'}`}>
        {/* User Avatar & Name */}
        <div className="flex items-center gap-2">
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={user.name || 'المستخدم'}
              className={`rounded-full ${compact ? 'w-6 h-6' : 'w-8 h-8'}`}
            />
          ) : (
            <div className={`bg-red-600 rounded-full flex items-center justify-center text-white font-bold ${compact ? 'w-6 h-6 text-xs' : 'w-8 h-8 text-sm'}`}>
              {(user.name || user.email || 'U').charAt(0).toUpperCase()}
            </div>
          )}
          <span className={`text-white ${compact ? 'text-sm' : 'text-base'}`}>
            مرحباً، {user.name || user.email?.split('@')[0]}
          </span>
        </div>

        {/* Sign Out Button */}
        <button
          onClick={handleSignOut}
          className={`bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors ${
            compact ? 'px-3 py-1 text-sm' : 'px-4 py-2'
          }`}
        >
          تسجيل خروج
        </button>
      </div>
    );
  }

  return (
    <div className={`flex items-center ${compact ? 'gap-2' : 'gap-3'}`}>
      {/* Login Button */}
      <button
        onClick={() => window.location.href = '/auth/login'}
        className={`bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors font-medium ${
          compact ? 'px-3 py-1.5 text-sm' : 'px-4 py-2'
        }`}
      >
        تسجيل دخول
      </button>

      {/* Sign Up Button */}
      <button
        onClick={() => window.location.href = '/auth/signup'}
        className={`bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium ${
          compact ? 'px-3 py-1.5 text-sm' : 'px-4 py-2'
        }`}
      >
        إنشاء حساب
      </button>
    </div>
  );
}