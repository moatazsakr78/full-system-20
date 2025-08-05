/**
 * Utility functions for managing authentication URLs across different environments
 */

/**
 * Get the base URL for the application based on the current environment
 * @returns The base URL without trailing slash
 */
export const getBaseUrl = (): string => {
  // Add debugging
  if (typeof window !== 'undefined') {
    console.log('Client-side - Current origin:', window.location.origin);
    console.log('Client-side - NEXT_PUBLIC_SITE_URL:', process.env.NEXT_PUBLIC_SITE_URL);
  } else {
    console.log('Server-side - NEXT_PUBLIC_SITE_URL:', process.env.NEXT_PUBLIC_SITE_URL);
  }

  // If we're in the browser, we can determine the environment dynamically
  if (typeof window !== 'undefined') {
    const origin = window.location.origin;
    
    // For localhost development - use the actual port for flexibility
    if (origin.includes('localhost')) {
      console.log('Detected localhost environment');
      // If NEXT_PUBLIC_SITE_URL is set for development, use it
      if (process.env.NEXT_PUBLIC_SITE_URL && process.env.NEXT_PUBLIC_SITE_URL.includes('localhost')) {
        return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');
      }
      // Otherwise use current origin for development flexibility
      return origin;
    }
    
    // For production - ALWAYS use current origin if we're in production
    if (origin.includes('vercel.app') || origin.includes('full-system-20')) {
      console.log('Detected Vercel production environment, using origin:', origin);
      return origin; // Use the actual current origin instead of hardcoded
    }
    
    // For any production domain, use current origin
    if (!origin.includes('localhost')) {
      console.log('Detected production environment, using origin:', origin);
      return origin;
    }
    
    // For other production environments - prefer environment variable
    if (process.env.NEXT_PUBLIC_SITE_URL && !process.env.NEXT_PUBLIC_SITE_URL.includes('localhost')) {
      console.log('Using NEXT_PUBLIC_SITE_URL for production:', process.env.NEXT_PUBLIC_SITE_URL);
      return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');
    }
    
    // Final fallback - return current origin
    console.log('Fallback to current origin:', origin);
    return origin;
  }

  // Server-side - use environment variable if available
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    console.log('Server-side using NEXT_PUBLIC_SITE_URL:', process.env.NEXT_PUBLIC_SITE_URL);
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');
  }

  // Server-side fallback
  console.log('Server-side fallback to localhost:3000');
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