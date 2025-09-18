'use client';

import { useSystemSettings } from './useSystemSettings';

// Hook for components to use rating settings from the central system
export function useRatingsDisplay() {
  const { getSetting, updateSettings, isLoading } = useSystemSettings();

  // Get the current rating setting from the system settings
  const showRatings = getSetting('website.show_ratings', true);

  const updateRatingSettings = async (enabled: boolean) => {
    try {
      await updateSettings({
        website: {
          show_ratings: enabled
        }
      });
    } catch (error) {
      console.error('Error updating rating settings:', error);
      throw error;
    }
  };

  return {
    showRatings,
    updateRatingSettings,
    isLoading
  };
}