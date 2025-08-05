'use client';

import { useState } from 'react';

export function useRightSidebar() {
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);

  const toggleRightSidebar = () => {
    setIsRightSidebarOpen(!isRightSidebarOpen);
  };

  const closeRightSidebar = () => {
    setIsRightSidebarOpen(false);
  };

  const openRightSidebar = () => {
    setIsRightSidebarOpen(true);
  };

  return {
    isRightSidebarOpen,
    toggleRightSidebar,
    closeRightSidebar,
    openRightSidebar
  };
}