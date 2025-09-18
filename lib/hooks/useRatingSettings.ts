'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface RatingSettingsContextType {
  showRatings: boolean;
  setShowRatings: (show: boolean) => void;
  updateRatingSettings: (enabled: boolean) => Promise<void>;
  isLoading: boolean;
}

export const RatingSettingsContext = createContext<RatingSettingsContextType | undefined>(undefined);

export function useRatingSettings() {
  const context = useContext(RatingSettingsContext);
  if (context === undefined) {
    throw new Error('useRatingSettings must be used within a RatingSettingsProvider');
  }
  return context;
}

// Hook for components to use rating settings
export function useRatingsDisplay() {
  const [showRatings, setShowRatings] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSetting = localStorage.getItem('showRatings');
    if (savedSetting !== null) {
      setShowRatings(JSON.parse(savedSetting));
    }
  }, []);

  const updateRatingSettings = async (enabled: boolean) => {
    setIsLoading(true);
    try {
      // Save to localStorage for persistence
      localStorage.setItem('showRatings', JSON.stringify(enabled));
      setShowRatings(enabled);
    } catch (error) {
      console.error('Error updating rating settings:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    showRatings,
    setShowRatings,
    updateRatingSettings,
    isLoading
  };
}