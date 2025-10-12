import type { Metadata } from 'next'
import Script from 'next/script'
import './globals.css'
import TopHeader from './components/layout/TopHeader'
import { CurrencyProvider } from '@/lib/hooks/useCurrency'
import { SystemSettingsProvider } from '@/lib/hooks/useSystemSettings'
import { CartProvider } from '@/lib/contexts/CartContext'
import { UserProfileProvider } from '@/lib/contexts/UserProfileContext'

export const metadata: Metadata = {
  title: 'نظام نقاط البيع',
  description: 'نظام إدارة نقاط البيع المتكامل',
  other: {
    'theme-color': '#3B82F6',
    'msapplication-navbutton-color': '#3B82F6',
    'apple-mobile-web-app-status-bar-style': 'default',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl">
      <body className="font-arabic bg-[#1F2937] text-gray-800">
        <SystemSettingsProvider>
          <CurrencyProvider>
            <UserProfileProvider>
              <CartProvider>
                <TopHeader />
                {children}
              </CartProvider>
            </UserProfileProvider>
          </CurrencyProvider>
        </SystemSettingsProvider>
      </body>
    </html>
  )
}