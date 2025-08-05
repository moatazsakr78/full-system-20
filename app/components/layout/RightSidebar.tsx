'use client';

import { useRef, useEffect } from 'react';
import { 
  ClipboardDocumentListIcon,
  UserIcon,
  HeartIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface RightSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function RightSidebar({ isOpen, onClose }: RightSidebarProps) {
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when sidebar is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div 
        ref={sidebarRef}
        className={`fixed top-0 right-0 h-full w-80 bg-[#2B3544] border-l border-gray-600 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-600 bg-[#374151]">
          <h2 className="text-xl font-bold text-white">القائمة الرئيسية</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-600 rounded-full transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Menu Items */}
        <div className="p-4">
          <div className="space-y-2">
            
            {/* Orders List */}
            <button
              onClick={() => {
                // Handle Orders List navigation
                alert('سيتم إضافة صفحة قائمة الطلبات قريباً');
                onClose();
              }}
              className="flex items-center gap-4 w-full p-4 text-white hover:bg-[#374151] rounded-lg transition-colors text-right group"
            >
              <div className="p-3 bg-blue-600 rounded-full group-hover:bg-blue-700 transition-colors">
                <ClipboardDocumentListIcon className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1 text-right">
                <h3 className="font-semibold text-lg">قائمة الطلبات</h3>
                <p className="text-sm text-gray-400">عرض وإدارة جميع الطلبات</p>
              </div>
            </button>

            {/* Profile */}
            <button
              onClick={() => {
                // Handle Profile navigation
                alert('سيتم إضافة صفحة الملف الشخصي قريباً');
                onClose();
              }}
              className="flex items-center gap-4 w-full p-4 text-white hover:bg-[#374151] rounded-lg transition-colors text-right group"
            >
              <div className="p-3 bg-green-600 rounded-full group-hover:bg-green-700 transition-colors">
                <UserIcon className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1 text-right">
                <h3 className="font-semibold text-lg">الملف الشخصي</h3>
                <p className="text-sm text-gray-400">إعدادات الحساب والمعلومات الشخصية</p>
              </div>
            </button>

            {/* Favorites */}
            <button
              onClick={() => {
                // Handle Favorites navigation
                alert('سيتم إضافة صفحة المفضلة قريباً');
                onClose();
              }}
              className="flex items-center gap-4 w-full p-4 text-white hover:bg-[#374151] rounded-lg transition-colors text-right group"
            >
              <div className="p-3 bg-red-600 rounded-full group-hover:bg-red-700 transition-colors">
                <HeartIcon className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1 text-right">
                <h3 className="font-semibold text-lg">المفضلة</h3>
                <p className="text-sm text-gray-400">المنتجات والعناصر المفضلة لديك</p>
              </div>
            </button>

          </div>
        </div>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-600 bg-[#374151]">
          <p className="text-center text-gray-400 text-sm">
            نظام نقاط البيع المتطور
          </p>
        </div>
      </div>
    </>
  );
}