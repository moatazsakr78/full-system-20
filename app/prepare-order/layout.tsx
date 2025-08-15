import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'تحضير الطلب',
  description: 'صفحة تحضير الطلب',
}

export default function PrepareOrderLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl">
      <head />
      <body className="font-arabic">
        {children}
      </body>
    </html>
  )
}