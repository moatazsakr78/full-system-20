'use client'

import { useState } from 'react'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import TopHeader from './TopHeader'
import DropdownMenu from './DropdownMenu'

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
  const [isDropdownMenuOpen, setIsDropdownMenuOpen] = useState(false)

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  const toggleDropdownMenu = () => {
    setIsDropdownMenuOpen(!isDropdownMenuOpen)
  }

  const closeDropdownMenu = () => {
    setIsDropdownMenuOpen(false)
  }

  return (
    <div className="min-h-screen bg-[#2B3544]">
      <TopHeader onMenuClick={toggleDropdownMenu} isMenuOpen={isDropdownMenuOpen} />
      
      <DropdownMenu isOpen={isDropdownMenuOpen} onClose={closeDropdownMenu} />
      
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