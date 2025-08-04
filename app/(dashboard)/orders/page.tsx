'use client'

import { useState } from 'react'
import { 
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline'
import Sidebar from '../../components/layout/Sidebar'
import TopHeader from '../../components/layout/TopHeader'
import OrderManagement from '../../components/OrderManagement'

export default function OrdersPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  return (
    <div className="h-screen bg-[#2B3544] overflow-hidden">
      {/* Top Header */}
      <TopHeader onMenuClick={toggleSidebar} isMenuOpen={isSidebarOpen} />
      
      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} />
      
      {/* Main Content Container */}
      <div className="h-full pt-12 overflow-hidden bg-pos-dark text-white" dir="rtl">
        {/* Header */}
        <div className="bg-pos-darker p-4 flex items-center justify-between border-b border-gray-700">
          <div className="flex items-center gap-4">
            <button className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium flex items-center gap-2">
              <ClipboardDocumentListIcon className="h-4 w-4" />
              إدارة الطلبات
            </button>
          </div>
          
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-medium text-gray-300">
              عرض وإدارة جميع الطلبات وتفاصيلها
            </h1>
            <h1 className="text-xl font-bold">الطلبات</h1>
            <ClipboardDocumentListIcon className="h-6 w-6 text-purple-600" />
          </div>
        </div>

        {/* Order Management Component */}
        <OrderManagement className="flex-1" />
      </div>
    </div>
  )
}