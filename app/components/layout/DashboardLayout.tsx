'use client'

import { useState } from 'react'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import TopHeader from './TopHeader'
import RightSidebar from './RightSidebar'
import { useRightSidebar } from '../../lib/hooks/useRightSidebar'

interface DashboardLayoutProps {
  children: React.ReactNode
  title?: string
  showSearch?: boolean
  actions?: React.ReactNode
  showSidebar?: boolean
}

export default function DashboardLayout({ 
  children, 
  title, 
  showSearch = true, 
  actions,
  showSidebar = true
}: DashboardLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  
  // Use right sidebar hook
  const { isRightSidebarOpen, toggleRightSidebar, closeRightSidebar } = useRightSidebar()

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  return (
    <div className="min-h-screen bg-[#2B3544]">
      <TopHeader onMenuClick={toggleRightSidebar} isMenuOpen={isRightSidebarOpen} />
      
      <RightSidebar isOpen={isRightSidebarOpen} onClose={closeRightSidebar} />
      
      {showSidebar && (
        <Sidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} />
      )}
      
      <div className="pt-12">
        <TopBar title={title} showSearch={showSearch} actions={actions} />
        
        <main className="p-0">
          {children}
        </main>
      </div>
    </div>
  )
}