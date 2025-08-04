export interface PWAInstallPrompt {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export interface PWACapabilities {
  isInstallable: boolean;
  isInstalled: boolean;
  isStandalone: boolean;
  supportsServiceWorker: boolean;
  supportsPushNotifications: boolean;
}

/**
 * Register service worker for PWA functionality
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    console.log('Service Worker not supported'); 
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/'
    });

    console.log('Service Worker registered successfully:', registration);

    // Handle updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New service worker available
            console.log('New service worker available');
            
            // Store update availability but don't auto-reload
            sessionStorage.setItem('pwa-update-available', 'true');
            
            // Show a non-blocking notification instead of confirm dialog
            console.log('إصدار جديد متاح. سيتم التحديث في الزيارة القادمة.');
          }
        });
      }
    });

    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    return null;
  }
}

/**
 * Check PWA capabilities and installation status
 */
export function checkPWACapabilities(): PWACapabilities {
  if (typeof window === 'undefined') {
    return {
      isInstallable: false,
      isInstalled: false,
      isStandalone: false,
      supportsServiceWorker: false,
      supportsPushNotifications: false
    };
  }

  const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                      (window.navigator as any).standalone === true;
  
  const isInstalled = isStandalone || 
                     document.referrer.includes('android-app://');

  return {
    isInstallable: 'serviceWorker' in navigator && 'PushManager' in window,
    isInstalled,
    isStandalone,
    supportsServiceWorker: 'serviceWorker' in navigator,
    supportsPushNotifications: 'PushManager' in window && 'Notification' in window
  };
}

/**
 * Handle PWA install prompt
 */
export function setupInstallPrompt(): {
  showInstallPrompt: () => Promise<boolean>;
  isInstallable: () => boolean;
} {
  let deferredPrompt: PWAInstallPrompt | null = null;

  // Listen for install prompt
  window.addEventListener('beforeinstallprompt', (e) => {
    console.log('PWA install prompt available');
    e.preventDefault();
    deferredPrompt = e as any;
  });

  const showInstallPrompt = async (): Promise<boolean> => {
    if (!deferredPrompt) {
      console.log('PWA install prompt not available');
      return false;
    }

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      
      console.log('PWA install choice:', choiceResult.outcome);
      
      deferredPrompt = null;
      return choiceResult.outcome === 'accepted';
    } catch (error) {
      console.error('PWA install prompt failed:', error);
      return false;
    }
  };

  const isInstallable = (): boolean => {
    return deferredPrompt !== null;
  };

  return {
    showInstallPrompt,
    isInstallable
  };
}

/**
 * Request push notification permission
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.log('Notifications not supported');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission === 'denied') {
    return 'denied';
  }

  try {
    const permission = await Notification.requestPermission();
    console.log('Notification permission:', permission);
    return permission;
  } catch (error) {
    console.error('Notification permission request failed:', error);
    return 'denied';
  }
}

/**
 * Show local notification
 */
export function showNotification(title: string, options: NotificationOptions = {}): Notification | null {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    console.log('Notifications not available or permission denied');
    return null;
  }

  const defaultOptions: NotificationOptions = {
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    dir: 'rtl',
    lang: 'ar',
    ...options
  };

  return new Notification(title, defaultOptions);
}

/**
 * Initialize PWA features
 */
export async function initializePWA(): Promise<void> {
  console.log('Initializing PWA features...');
  
  // Register service worker
  await registerServiceWorker();
  
  // Check capabilities
  const capabilities = checkPWACapabilities();
  console.log('PWA capabilities:', capabilities);
  
  // Setup install prompt
  const { showInstallPrompt, isInstallable } = setupInstallPrompt();
  
  // Store functions globally for easy access
  (window as any).showInstallPrompt = showInstallPrompt;
  (window as any).isInstallable = isInstallable;
  (window as any).requestNotificationPermission = requestNotificationPermission;
  
  // Auto-request notification permission for PWA users
  if (capabilities.isStandalone) {
    setTimeout(requestNotificationPermission, 3000);
  }
}