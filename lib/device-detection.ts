export type DeviceType = 'desktop' | 'tablet' | 'mobile';

export interface DeviceInfo {
  type: DeviceType;
  userAgent: string;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

/**
 * Detects device type from User-Agent string
 * Optimized for server-side rendering in getServerSideProps
 */
export function detectDevice(userAgent: string): DeviceInfo {
  const ua = userAgent.toLowerCase();
  
  // Mobile device patterns
  const mobilePatterns = [
    /android.*mobile/,
    /iphone/,
    /ipod/,
    /windows phone/,
    /blackberry/,
    /mobile/
  ];
  
  // Tablet device patterns  
  const tabletPatterns = [
    /ipad/,
    /android(?!.*mobile)/,
    /tablet/,
    /kindle/,
    /silk/,
    /playbook/
  ];
  
  // Check for tablet first (more specific)
  const isTablet = tabletPatterns.some(pattern => pattern.test(ua));
  
  // Check for mobile (exclude tablets)
  const isMobile = !isTablet && mobilePatterns.some(pattern => pattern.test(ua));
  
  // Desktop is everything else
  const isDesktop = !isMobile && !isTablet;
  
  let type: DeviceType;
  if (isMobile) {
    type = 'mobile';
  } else if (isTablet) {
    type = 'tablet';
  } else {
    type = 'desktop';
  }
  
  return {
    type,
    userAgent,
    isMobile,
    isTablet,
    isDesktop
  };
}

/**
 * Client-side device detection using screen dimensions
 * Fallback for when User-Agent is not reliable
 */
export function detectDeviceClient(): DeviceInfo {
  if (typeof window === 'undefined') {
    // Server-side fallback
    return {
      type: 'desktop',
      userAgent: '',
      isMobile: false,
      isTablet: false,
      isDesktop: true
    };
  }
  
  const width = window.innerWidth;
  const userAgent = navigator.userAgent;
  
  // Use screen width as fallback detection
  let type: DeviceType;
  if (width <= 768) {
    type = 'mobile';
  } else if (width <= 1024) {
    type = 'tablet';  
  } else {
    type = 'desktop';
  }
  
  // Override with User-Agent detection if available
  const serverDetection = detectDevice(userAgent);
  if (serverDetection.type !== 'desktop') {
    type = serverDetection.type;
  }
  
  return {
    type,
    userAgent,
    isMobile: type === 'mobile',
    isTablet: type === 'tablet', 
    isDesktop: type === 'desktop'
  };
}