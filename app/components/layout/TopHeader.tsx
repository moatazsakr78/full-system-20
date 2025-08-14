'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Bars3Icon, GlobeAltIcon } from '@heroicons/react/24/outline';

interface TopHeaderProps {
  onMenuClick?: () => void;
  isMenuOpen?: boolean;
}

export default function TopHeader({ onMenuClick, isMenuOpen = false }: TopHeaderProps) {
  const [isConnected, setIsConnected] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    const checkConnection = () => {
      setIsConnected(navigator.onLine);
    };

    window.addEventListener('online', checkConnection);
    window.addEventListener('offline', checkConnection);
    
    // Check initial connection status
    checkConnection();

    return () => {
      window.removeEventListener('online', checkConnection);
      window.removeEventListener('offline', checkConnection);
    };
  }, []);
  
  // Hide header on website pages (root, individual product pages, cart page, auth pages, admin product management pages, shipping pages, and my-orders page)
  if (pathname === '/' || 
      (pathname?.startsWith('/product') && pathname !== '/products') || 
      pathname === '/cart' ||
      pathname?.startsWith('/auth/') ||
      pathname?.startsWith('/admin/products') ||
      pathname?.startsWith('/shipping') ||
      pathname === '/my-orders') {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-12 bg-[#374151] border-b border-gray-600 px-4">
      <div className="flex items-center justify-between h-full">
        {/* Left side - Menu button */}
        <div className="flex items-center">
          <button 
            onClick={onMenuClick}
            className="p-2 text-white"
            aria-label={isMenuOpen ? 'إغلاق القائمة' : 'فتح القائمة'}
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
        </div>

        {/* Center - App title */}
        <div className="flex items-center">
          <h1 className="text-white text-lg font-semibold">نظام نقاط البيع</h1>
        </div>

        {/* Right side - Website button */}
        <div className="flex items-center">
          <button 
            onClick={() => window.location.href = '/'}
            className="flex items-center gap-2 px-3 py-1.5 text-blue-400 hover:text-blue-300 hover:bg-gray-700 rounded-lg transition-colors"
            title="انتقل إلى الموقع الإلكتروني"
          >
            <GlobeAltIcon className="h-5 w-5" />
            <span className="text-sm font-medium">الموقع</span>
          </button>
        </div>
      </div>
    </div>
  );
}