import type { AppProps } from 'next/app';
import { useEffect } from 'react';
import '../app/globals.css';
import { initializePWA } from '../lib/pwa';

export default function WebsiteApp({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Initialize PWA features on client side
    initializePWA();
  }, []);

  return <Component {...pageProps} />;
}