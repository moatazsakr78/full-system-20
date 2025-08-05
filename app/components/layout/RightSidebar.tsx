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
      const target = event.target as Node;
      // Check if click is on menu button (has title="القائمة")
      const menuButton = (target as Element)?.closest('button[title="القائمة"]');
      
      if (sidebarRef.current && !sidebarRef.current.contains(target) && !menuButton) {
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
        className={`fixed top-20 right-0 h-[calc(100vh-80px)] w-96 bg-[#eaeaea] border-l border-gray-400 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-red-600 bg-[#5d1f1f]">
          <h2 className="text-lg font-bold text-white">القائمة الرئيسية</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-200 hover:text-white hover:bg-gray-600 rounded-full transition-colors"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Menu Items */}
        <div className="p-3">
          <div className="space-y-1">
            
            {/* Orders List */}
            <button
              onClick={() => {
                // Handle Orders List navigation
                alert('سيتم إضافة صفحة قائمة الطلبات قريباً');
                onClose();
              }}
              className="flex items-center gap-3 w-full p-3 text-black hover:bg-gray-300 rounded-lg transition-colors text-right group"
            >
              <div className="p-2 bg-[#5d1f1f] rounded-full group-hover:bg-red-700 transition-colors">
                <ClipboardDocumentListIcon className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 text-right">
                <h3 className="font-semibold text-base text-black">قائمة الطلبات</h3>
                <p className="text-xs text-gray-600">عرض وإدارة جميع الطلبات</p>
              </div>
            </button>

            {/* Profile */}
            <button
              onClick={() => {
                // Handle Profile navigation
                alert('سيتم إضافة صفحة الملف الشخصي قريباً');
                onClose();
              }}
              className="flex items-center gap-3 w-full p-3 text-black hover:bg-gray-300 rounded-lg transition-colors text-right group"
            >
              <div className="p-2 bg-[#5d1f1f] rounded-full group-hover:bg-red-700 transition-colors">
                <UserIcon className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 text-right">
                <h3 className="font-semibold text-base text-black">الملف الشخصي</h3>
                <p className="text-xs text-gray-600">إعدادات الحساب والمعلومات الشخصية</p>
              </div>
            </button>

            {/* Favorites */}
            <button
              onClick={() => {
                // Handle Favorites navigation
                alert('سيتم إضافة صفحة المفضلة قريباً');
                onClose();
              }}
              className="flex items-center gap-3 w-full p-3 text-black hover:bg-gray-300 rounded-lg transition-colors text-right group"
            >
              <div className="p-2 bg-[#5d1f1f] rounded-full group-hover:bg-red-700 transition-colors">
                <HeartIcon className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 text-right">
                <h3 className="font-semibold text-base text-black">المفضلة</h3>
                <p className="text-xs text-gray-600">المنتجات والعناصر المفضلة لديك</p>
              </div>
            </button>

          </div>
        </div>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-gray-400 bg-[#eaeaea]">
          <p className="text-center text-black text-xs">
            متجر الفاروق
          </p>
        </div>
      </div>
    </>
  );
}