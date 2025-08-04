import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="ar" dir="rtl">
      <Head>
        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.json" />
        
        {/* PWA Theme Colors */}
        <meta name="theme-color" content="#DC2626" />
        <meta name="msapplication-TileColor" content="#DC2626" />
        
        {/* PWA App Meta */}
        <meta name="application-name" content="متجر الفاروق" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="متجر الفاروق" />
        <meta name="mobile-web-app-capable" content="yes" />
        
        {/* PWA Icons */}
        <link rel="icon" href="/assets/logo/El Farouk10.png" />
        <link rel="apple-touch-icon" href="/assets/logo/El Farouk10.png" />
        
        {/* Fonts */}
        <link
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        
        {/* SEO Meta */}
        <meta name="description" content="متجر الفاروق الإلكتروني - أفضل المنتجات بأسعار مميزة" />
        <meta name="keywords" content="متجر إلكتروني, الفاروق, تسوق, منتجات" />
        <meta name="author" content="El Farouk Store" />
        
        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="متجر الفاروق الإلكتروني" />
        <meta property="og:description" content="أفضل المنتجات بأسعار مميزة" />
        <meta property="og:image" content="/assets/logo/El Farouk10.png" />
        
        {/* Viewport for better mobile experience */}
        <meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no" />
      </Head>
      <body className="font-arabic bg-gray-900 text-white">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}