/**
 * Utility functions for managing authentication URLs across different environments
 */

/**
 * Get the base URL for the application based on the current environment
 * @returns The base URL without trailing slash
 */
export const getBaseUrl = (): string => {
  // If we're in the browser, we can determine the environment dynamically
  if (typeof window !== 'undefined') {
    const origin = window.location.origin;
    
    // For localhost development - use the actual port for flexibility
    if (origin.includes('localhost')) {
      // If NEXT_PUBLIC_SITE_URL is set for development, use it
      if (process.env.NEXT_PUBLIC_SITE_URL && process.env.NEXT_PUBLIC_SITE_URL.includes('localhost')) {
        return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');
      }
      // Otherwise use current origin for development flexibility
      return origin;
    }
    
    // For production - prefer environment variable
    if (process.env.NEXT_PUBLIC_SITE_URL) {
      return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');
    }
    
    // For production domains
    if (origin.includes('vercel.app') || origin.includes('full-system-20')) {
      return 'https://full-system-20.vercel.app';
    }
    
    // Return current origin for any other domain
    return origin;
  }

  // Server-side - use environment variable if available
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');
  }

  // Server-side fallback
  return 'http://localhost:3000';
};

/**
 * Get the OAuth redirect URL for authentication providers
 * @param path - The callback path (default: '/auth/callback')
 * @returns The complete redirect URL
 */
export const getOAuthRedirectUrl = (path: string = '/auth/callback'): string => {
  const baseUrl = getBaseUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
};

/**
 * Check if the current environment is development (localhost)
 * @returns true if running on localhost
 */
export const isDevelopment = (): boolean => {
  if (typeof window !== 'undefined') {
    return window.location.origin.includes('localhost');
  }
  return process.env.NODE_ENV === 'development';
};

/**
 * Check if the current environment is production
 * @returns true if running in production
 */
export const isProduction = (): boolean => {
  return !isDevelopment();
};

/**
 * Get environment-specific configuration
 */
export const getEnvironmentConfig = () => {
  const baseUrl = getBaseUrl();
  const isDev = isDevelopment();
  
  return {
    baseUrl,
    isDevelopment: isDev,
    isProduction: !isDev,
    authCallbackUrl: getOAuthRedirectUrl('/auth/callback'),
    // Add more environment-specific configs as needed
  };
};