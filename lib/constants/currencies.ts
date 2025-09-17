/**
 * Currency Constants
 * Central system for managing currencies across the application
 */

// Base supported currencies in the application
export const SUPPORTED_CURRENCIES = {
  EGYPTIAN_POUND: 'جنيه',
  SAUDI_RIYAL: 'ريال',
  EGP: 'جنيه',
  SAR: 'ريال'
} as const;

// Base currency list - will be extended with custom currencies
export const BASE_CURRENCY_LIST = Object.values(SUPPORTED_CURRENCIES);

// Dynamic currency list that includes custom currencies (to be loaded from database)
export let CURRENCY_LIST: string[] = [...BASE_CURRENCY_LIST];

// Default currencies for different contexts
export const DEFAULT_SYSTEM_CURRENCY = SUPPORTED_CURRENCIES.SAUDI_RIYAL;
export const DEFAULT_WEBSITE_CURRENCY = SUPPORTED_CURRENCIES.EGYPTIAN_POUND;
export const DEFAULT_UNIFIED_CURRENCY = SUPPORTED_CURRENCIES.SAUDI_RIYAL;

// Currency type definition
export type Currency = typeof SUPPORTED_CURRENCIES[keyof typeof SUPPORTED_CURRENCIES];

// Currency modes
export const CURRENCY_MODES = {
  SEPARATE: 'separate',
  UNIFIED: 'unified'
} as const;

export type CurrencyMode = typeof CURRENCY_MODES[keyof typeof CURRENCY_MODES];

// Currency context interface
export interface CurrencySettings {
  mode: CurrencyMode;
  systemCurrency: Currency;
  websiteCurrency: Currency;
  unifiedCurrency: Currency;
}

// Default currency settings
export const DEFAULT_CURRENCY_SETTINGS: CurrencySettings = {
  mode: CURRENCY_MODES.SEPARATE,
  systemCurrency: DEFAULT_SYSTEM_CURRENCY,
  websiteCurrency: DEFAULT_WEBSITE_CURRENCY,
  unifiedCurrency: DEFAULT_UNIFIED_CURRENCY
};

// Currency code mapping to Arabic names
export const CURRENCY_CODE_MAP: Record<string, string> = {
  'EGP': 'جنيه',
  'SAR': 'ريال',
  'جنيه': 'جنيه',
  'ريال': 'ريال'
};

// Helper functions
export const getCurrencySymbol = (currency: Currency): string => {
  return currency;
};

export const formatPrice = (amount: number, currency: Currency | string): string => {
  // Convert currency code to Arabic name if needed
  const displayCurrency = CURRENCY_CODE_MAP[currency] || currency;
  return `${amount.toFixed(2)} ${displayCurrency}`;
};

export const isValidCurrency = (currency: string): boolean => {
  return CURRENCY_LIST.includes(currency);
};

// Helper function to replace hardcoded EGP with system currency
export const formatCurrencyAmount = (amount: number | string, currency: Currency): string => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return `${numAmount.toFixed(2)} ${currency}`;
};

// Function to update currency list with custom currencies
export const updateCurrencyList = (customCurrencies: string[]) => {
  // Combine base currencies with custom currencies, removing duplicates
  const allCurrencies = [...BASE_CURRENCY_LIST, ...customCurrencies];
  const uniqueCurrencies = Array.from(new Set(allCurrencies));
  CURRENCY_LIST.length = 0; // Clear the array
  CURRENCY_LIST.push(...uniqueCurrencies); // Add unique currencies
};

// Function to add a single custom currency
export const addCustomCurrency = (currency: string) => {
  if (!CURRENCY_LIST.includes(currency)) {
    CURRENCY_LIST.push(currency);
  }
};