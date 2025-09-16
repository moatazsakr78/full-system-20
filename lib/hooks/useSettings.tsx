'use client';

import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { supabase } from '@/app/lib/supabase/client';
import { updateCurrencyList, addCustomCurrency, CURRENCY_LIST } from '../constants/currencies';

// Setting type definition
export interface Setting {
  id: string;
  setting_key: string;
  setting_value: any;
  setting_category: string;
  setting_type: string;
  description?: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

// Settings Context
interface SettingsContextType {
  settings: Record<string, any>;
  isLoading: boolean;
  error: string | null;
  updateSetting: (key: string, value: any) => Promise<void>;
  getSetting: (key: string, defaultValue?: any) => any;
  refreshSettings: () => Promise<void>;
  // Custom currencies functions
  customCurrencies: string[];
  addNewCustomCurrency: (currency: string) => Promise<void>;
  deleteCustomCurrency: (currency: string) => Promise<void>;
  getAvailableCurrencies: () => string[];
}

const SettingsContext = createContext<SettingsContextType | null>(null);

// Settings Provider Component
interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [customCurrencies, setCustomCurrencies] = useState<string[]>([]);

  // Load custom currencies from database
  const loadCustomCurrencies = async () => {
    try {
      // Note: custom_currencies table doesn't exist in current schema
      // Using default currencies only for now
      setCustomCurrencies([]);
      updateCurrencyList([]);
    } catch (err) {
      console.error('Error loading custom currencies:', err);
    }
  };

  // Load settings from database
  const loadSettings = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Note: settings and custom_currencies tables don't exist in current schema
      // Using default settings only for now
      setSettings({});
      setCustomCurrencies([]);
      updateCurrencyList([]);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطأ في تحميل الإعدادات');
      console.error('Error loading settings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Update setting in database
  const updateSetting = async (key: string, value: any) => {
    try {
      // Note: settings table doesn't exist in current schema
      // Only updating local state for now
      setSettings(prev => ({
        ...prev,
        [key]: value
      }));

    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطأ في تحديث الإعدادات');
      console.error('Error updating setting:', err);
      throw err;
    }
  };

  // Get setting value with default fallback
  const getSetting = (key: string, defaultValue: any = null) => {
    return settings[key] !== undefined ? settings[key] : defaultValue;
  };

  // Add new custom currency
  const addNewCustomCurrency = async (currency: string) => {
    try {
      if (!currency || currency.trim() === '') {
        throw new Error('اسم العملة لا يمكن أن يكون فارغاً');
      }

      const trimmedCurrency = currency.trim();

      // Check if currency already exists
      if (customCurrencies.includes(trimmedCurrency)) {
        // Currency already exists, nothing to do
        return;
      }

      // Note: custom_currencies table doesn't exist in current schema
      // Only updating local state for now

      // Update local state
      const newCurrencies = [...customCurrencies, trimmedCurrency];
      setCustomCurrencies(newCurrencies);
      addCustomCurrency(trimmedCurrency);

    } catch (err) {
      console.error('Error adding custom currency:', err);
      throw err;
    }
  };

  // Delete custom currency
  const deleteCustomCurrency = async (currency: string) => {
    try {
      if (!currency || currency.trim() === '') {
        throw new Error('اسم العملة لا يمكن أن يكون فارغاً');
      }

      const trimmedCurrency = currency.trim();

      // Note: custom_currencies table doesn't exist in current schema
      // Only updating local state for now

      // Update local state
      const newCurrencies = customCurrencies.filter(c => c !== trimmedCurrency);
      setCustomCurrencies(newCurrencies);
      updateCurrencyList(newCurrencies);

    } catch (err) {
      console.error('Error deleting custom currency:', err);
      throw err;
    }
  };

  // Get available currencies (base + custom)
  const getAvailableCurrencies = () => {
    return [...CURRENCY_LIST];
  };

  // Refresh settings from database
  const refreshSettings = async () => {
    await loadSettings();
  };

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  // Subscribe to settings changes (real-time)
  useEffect(() => {
    const subscription = supabase
      .channel('settings_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'settings'
        },
        () => {
          // Reload settings when they change
          loadSettings();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const contextValue: SettingsContextType = {
    settings,
    isLoading,
    error,
    updateSetting,
    getSetting,
    refreshSettings,
    customCurrencies,
    addNewCustomCurrency,
    deleteCustomCurrency,
    getAvailableCurrencies
  };

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
};

// Custom hook to use settings context
export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);

  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }

  return context;
};

// Specialized hook for currency settings
export const useCurrencySettings = () => {
  const {
    getSetting,
    updateSetting,
    isLoading,
    getAvailableCurrencies,
    addNewCustomCurrency,
    deleteCustomCurrency
  } = useSettings();

  const currencyMode = getSetting('currency_mode', 'separate');
  const systemCurrency = getSetting('system_currency', 'ريال');
  const websiteCurrency = getSetting('website_currency', 'جنيه');
  const unifiedCurrency = getSetting('unified_currency', 'ريال');

  const updateCurrencySettings = async (newSettings: {
    currency_mode?: string;
    system_currency?: string;
    website_currency?: string;
    unified_currency?: string;
  }) => {
    const promises = [];

    // Add custom currencies to database if they're new
    if (newSettings.system_currency && !getAvailableCurrencies().includes(newSettings.system_currency)) {
      promises.push(addNewCustomCurrency(newSettings.system_currency));
    }
    if (newSettings.website_currency && !getAvailableCurrencies().includes(newSettings.website_currency)) {
      promises.push(addNewCustomCurrency(newSettings.website_currency));
    }
    if (newSettings.unified_currency && !getAvailableCurrencies().includes(newSettings.unified_currency)) {
      promises.push(addNewCustomCurrency(newSettings.unified_currency));
    }

    // Update settings
    if (newSettings.currency_mode !== undefined) {
      promises.push(updateSetting('currency_mode', newSettings.currency_mode));
    }
    if (newSettings.system_currency !== undefined) {
      promises.push(updateSetting('system_currency', newSettings.system_currency));
    }
    if (newSettings.website_currency !== undefined) {
      promises.push(updateSetting('website_currency', newSettings.website_currency));
    }
    if (newSettings.unified_currency !== undefined) {
      promises.push(updateSetting('unified_currency', newSettings.unified_currency));
    }

    await Promise.all(promises);
  };

  return {
    currencyMode,
    systemCurrency,
    websiteCurrency,
    unifiedCurrency,
    updateCurrencySettings,
    isLoading,
    availableCurrencies: getAvailableCurrencies(),
    addNewCustomCurrency,
    deleteCustomCurrency
  };
};