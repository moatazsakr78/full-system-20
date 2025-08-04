'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/useAuth';

interface AuthButtonsProps {
  onAuthSuccess?: () => void;
  compact?: boolean;
}

export default function AuthButtons({ onAuthSuccess, compact = false }: AuthButtonsProps) {
  const { user, loading, isAuthenticated, signInWithGoogle, signOut } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    try {
      const result = await signInWithGoogle();
      if (result.success) {
        onAuthSuccess?.();
      } else {
        alert(result.error || 'حدث خطأ أثناء تسجيل الدخول');
      }
    } catch (error) {
      console.error('Error during Google sign in:', error);
      alert('حدث خطأ أثناء تسجيل الدخول');
    } finally {
      setIsSigningIn(false);
    }
  };

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
      {/* Google Sign In Button */}
      <button
        onClick={handleGoogleSignIn}
        disabled={isSigningIn}
        className={`bg-white hover:bg-gray-50 text-gray-800 border border-gray-300 rounded-lg transition-colors flex items-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-sm ${
          compact ? 'px-3 py-1.5 text-sm' : 'px-4 py-2'
        }`}
      >
        {isSigningIn ? (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
        ) : (
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
        )}
        <span>{isSigningIn ? 'جاري الدخول...' : 'دخول بجوجل'}</span>
      </button>

      {/* Traditional Sign Up Button */}
      <button
        className={`bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium ${
          compact ? 'px-3 py-1.5 text-sm' : 'px-4 py-2'
        }`}
        onClick={() => alert('سيتم إضافة نموذج التسجيل قريباً')}
      >
        إنشاء حساب
      </button>
    </div>
  );
}