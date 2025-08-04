'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/lib/useAuth';

interface AuthButtonsProps {
  onAuthSuccess?: () => void;
  compact?: boolean;
}

export default function AuthButtons({ onAuthSuccess, compact = false }: AuthButtonsProps) {
  const { user, loading, isAuthenticated, signOut } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSignOut = async () => {
    try {
      const result = await signOut();
      if (!result.success) {
        alert(result.error || 'حدث خطأ أثناء تسجيل الخروج');
      }
      setIsDropdownOpen(false);
    } catch (error) {
      console.error('Error during sign out:', error);
      alert('حدث خطأ أثناء تسجيل الخروج');
    }
  };

  const handleProfileClick = () => {
    setIsDropdownOpen(false);
    alert('سيتم إضافة صفحة الملف الشخصي قريباً');
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
      <div className="relative" ref={dropdownRef}>
        {/* User Avatar & Name - Clickable */}
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className={`flex items-center gap-2 hover:bg-red-700 px-2 py-1 rounded-lg transition-colors ${compact ? 'gap-1' : 'gap-2'}`}
        >
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={user.name || 'المستخدم'}
              className={`rounded-full ${compact ? 'w-6 h-6' : 'w-8 h-8'}`}
            />
          ) : (
            <div className={`bg-white text-red-600 rounded-full flex items-center justify-center font-bold ${compact ? 'w-6 h-6 text-xs' : 'w-8 h-8 text-sm'}`}>
              {(user.name || user.email || 'U').charAt(0).toUpperCase()}
            </div>
          )}
          <span className={`text-white ${compact ? 'text-sm' : 'text-base'}`}>
            مرحباً، {user.name || user.email?.split('@')[0]}
          </span>
          {/* Dropdown Arrow */}
          <svg 
            className={`w-4 h-4 text-white transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Dropdown Menu */}
        {isDropdownOpen && (
          <div className="absolute left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
            {/* Profile Option */}
            <button
              onClick={handleProfileClick}
              className="w-full text-right px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              الملف الشخصي
            </button>
            
            {/* Divider */}
            <hr className="my-1 border-gray-200" />
            
            {/* Sign Out Option */}
            <button
              onClick={handleSignOut}
              className="w-full text-right px-4 py-2 text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              تسجيل الخروج
            </button>
          </div>
        )}
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