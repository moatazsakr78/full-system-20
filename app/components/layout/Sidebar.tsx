'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { 
  HomeIcon,
  ShoppingCartIcon,
  CubeIcon,
  ArchiveBoxIcon,
  UserGroupIcon,
  TruckIcon,
  DocumentTextIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  XMarkIcon,
  MapIcon
} from '@heroicons/react/24/outline'

const sidebarItems = [
  { href: '/dashboard', label: 'لوحة التحكم', icon: HomeIcon },
  { href: '/pos', label: 'نقطة البيع', icon: ShoppingCartIcon },
  { href: '/products', label: 'المنتجات', icon: CubeIcon },
  { href: '/inventory', label: 'المخزون', icon: ArchiveBoxIcon },
  { href: '/customers', label: 'العملاء', icon: UserGroupIcon },
  { href: '/suppliers', label: 'الموردين', icon: TruckIcon },
  { href: '/records', label: 'السجلات', icon: DocumentTextIcon },
  { href: '/reports', label: 'التقارير', icon: ChartBarIcon },
  { href: '/permissions', label: 'الصلاحيات', icon: ShieldCheckIcon },
  { href: '/settings', label: 'الإعدادات', icon: Cog6ToothIcon },
  { href: '/shipping', label: 'تفاصيل الشحن', icon: MapIcon },
]

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const pathname = usePathname()

  // Close sidebar when pressing ESC
  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onToggle()
      }
    }

    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onToggle])

  return (
    <>
      {/* Backdrop - only covers area below top header */}
      <div 
        className={`fixed right-0 left-0 top-12 bottom-0 bg-black z-40 transition-opacity duration-300 ease-in-out ${
          isOpen ? 'opacity-50 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onToggle}
      />
      
      {/* Sidebar */}
      <div 
        id="sidebar"
        className={`fixed right-0 top-12 h-[calc(100vh-3rem)] w-80 bg-[#374151] flex flex-col z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0 pointer-events-auto' : 'translate-x-full pointer-events-none'
        }`}
      >
        {/* Header with close button */}
        <div className="flex items-center justify-between p-4 border-b border-gray-600">
          <h2 className="text-white text-lg font-semibold">القائمة</h2>
          <button
            onClick={onToggle}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-600 rounded-lg transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-2">
          {sidebarItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onToggle}
                className={`flex items-center gap-4 px-6 py-4 text-base font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-[#5DADE2] text-white border-r-4 border-[#4A9BD1]'
                    : 'text-gray-200 hover:bg-gray-600 hover:text-white hover:border-r-4 hover:border-gray-400'
                }`}
              >
                <Icon className="h-6 w-6 flex-shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-gray-600">
          <div className="flex items-center gap-4 px-6 py-4 text-gray-200 hover:text-white hover:bg-gray-600 cursor-pointer transition-colors">
            <ArrowRightOnRectangleIcon className="h-6 w-6" />
            <span className="text-base font-medium">تسجيل الخروج</span>
          </div>
          
          <div className="px-6 py-4 bg-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-base font-bold">A</span>
              </div>
              <div>
                <p className="text-base font-medium text-white">admin</p>
                <p className="text-sm text-gray-400">مشرف النظام</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}