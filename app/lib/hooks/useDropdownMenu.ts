'use client';

import { useState } from 'react';

export function useDropdownMenu() {
  const [isDropdownMenuOpen, setIsDropdownMenuOpen] = useState(false);

  const toggleDropdownMenu = () => {
    setIsDropdownMenuOpen(!isDropdownMenuOpen);
  };

  const closeDropdownMenu = () => {
    setIsDropdownMenuOpen(false);
  };

  return {
    isDropdownMenuOpen,
    toggleDropdownMenu,
    closeDropdownMenu
  };
}