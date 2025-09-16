'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import {
  Currency,
  CurrencyMode,
  formatPrice,
  getCurrencySymbol,
  SUPPORTED_CURRENCIES,
  CURRENCY_MODES,
  DEFAULT_CURRENCY_SETTINGS
} from '../constants/currencies';
import { useCurrencySettings as useDbCurrencySettings } from './useSystemSettings';

// Currency context interface
interface CurrencyContextType {
  mode: CurrencyMode;
  systemCurrency: Currency;
  websiteCurrency: Currency;
  unifiedCurrency: Currency;
  updateSettings: (settings: any) => Promise<void>;
  formatPrice: (amount: number, context?: 'system' | 'website') => string;
  getCurrentCurrency: (context?: 'system' | 'website') => Currency;
  isLoading: boolean;
}

const CurrencyContext = createContext<CurrencyContextType | null>(null);

// Currency Provider Component - now using database
interface CurrencyProviderProps {
  children: ReactNode;
}

export const CurrencyProvider: React.FC<CurrencyProviderProps> = ({ children }) => {
  const {
    currencyMode,
    systemCurrency,
    websiteCurrency,
    unifiedCurrency,
    updateCurrencySettings,
    isLoading
  } = useDbCurrencySettings();

  const getCurrentCurrency = (context: 'system' | 'website' = 'system'): Currency => {
    if (currencyMode === CURRENCY_MODES.UNIFIED) {
      return unifiedCurrency as Currency;
    }
    return context === 'system' ? (systemCurrency as Currency) : (websiteCurrency as Currency);
  };

  const formatPriceWithContext = (amount: number, context: 'system' | 'website' = 'system'): string => {
    const currency = getCurrentCurrency(context);
    return formatPrice(amount, currency);
  };

  const updateSettings = async (settings: any) => {
    const mappedSettings: any = {};

    if (settings.mode !== undefined) {
      mappedSettings.currency_mode = settings.mode;
    }
    if (settings.systemCurrency !== undefined) {
      mappedSettings.system_currency = settings.systemCurrency;
    }
    if (settings.websiteCurrency !== undefined) {
      mappedSettings.website_currency = settings.websiteCurrency;
    }
    if (settings.unifiedCurrency !== undefined) {
      mappedSettings.unified_currency = settings.unifiedCurrency;
    }

    await updateCurrencySettings(mappedSettings);
  };

  const contextValue: CurrencyContextType = {
    mode: currencyMode as CurrencyMode,
    systemCurrency: systemCurrency as Currency,
    websiteCurrency: websiteCurrency as Currency,
    unifiedCurrency: unifiedCurrency as Currency,
    updateSettings,
    formatPrice: formatPriceWithContext,
    getCurrentCurrency,
    isLoading
  };

  return (
    <CurrencyContext.Provider value={contextValue}>
      {children}
    </CurrencyContext.Provider>
  );
};

// Custom hook to use currency context
export const useCurrency = (): CurrencyContextType => {
  const context = useContext(CurrencyContext);

  if (!context) {
    // Return default values if provider is not available
    return {
      ...DEFAULT_CURRENCY_SETTINGS,
      updateSettings: async () => {},
      formatPrice: (amount: number) => formatPrice(amount, DEFAULT_CURRENCY_SETTINGS.systemCurrency),
      getCurrentCurrency: () => DEFAULT_CURRENCY_SETTINGS.systemCurrency,
      isLoading: false
    };
  }

  return context;
};

// Utility hooks for specific contexts
export const useSystemCurrency = (): Currency => {
  const { getCurrentCurrency } = useCurrency();
  return getCurrentCurrency('system');
};

export const useWebsiteCurrency = (): Currency => {
  const { getCurrentCurrency } = useCurrency();
  return getCurrentCurrency('website');
};

export const useFormatPrice = () => {
  const { formatPrice } = useCurrency();
  return formatPrice;
};

// Hook for currency settings management
export const useCurrencySettings = () => {
  const currency = useCurrency();

  return {
    settings: {
      mode: currency.mode,
      systemCurrency: currency.systemCurrency,
      websiteCurrency: currency.websiteCurrency,
      unifiedCurrency: currency.unifiedCurrency
    },
    updateSettings: currency.updateSettings,
    isLoading: currency.isLoading
  };
};