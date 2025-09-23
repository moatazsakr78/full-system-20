import type { Metadata } from 'next'
import './globals.css'
import TopHeader from './components/layout/TopHeader'
import { CurrencyProvider } from '@/lib/hooks/useCurrency'
import { SystemSettingsProvider } from '@/lib/hooks/useSystemSettings'
import { CartProvider } from '@/lib/contexts/CartContext'

export const metadata: Metadata = {
  title: 'نظام نقاط البيع',
  description: 'نظام إدارة نقاط البيع المتكامل',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl">
      <body className="font-arabic bg-custom-gray text-gray-800">
        <SystemSettingsProvider>
          <CurrencyProvider>
            <CartProvider>
              <TopHeader />
              {children}
            </CartProvider>
          </CurrencyProvider>
        </SystemSettingsProvider>
      </body>
    </html>
  )
}