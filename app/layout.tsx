import type { Metadata } from 'next'
import './globals.css'
import TopHeader from './components/layout/TopHeader'

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
      <body className="font-arabic bg-pos-dark text-white">
        <TopHeader />
        {children}
      </body>
    </html>
  )
}