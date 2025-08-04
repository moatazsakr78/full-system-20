'use client'

import { 
  HomeIcon,
  CalculatorIcon,
  UserIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  ShoppingCartIcon,
  TableCellsIcon,
  PrinterIcon,
  FolderIcon,
  EyeIcon
} from '@heroicons/react/24/outline'

interface TopBarProps {
  title?: string
  showSearch?: boolean
  actions?: React.ReactNode
}

export default function TopBar({ title, showSearch = true, actions }: TopBarProps) {
  return (
    <div className="fixed top-12 left-0 right-0 z-40 h-12 bg-[#374151] border-b border-gray-600">
      <div className="flex items-stretch justify-end h-full">
        {/* Far right - All action buttons */}
        <div className="flex h-full">
          {/* Page action icons */}
          <button className="flex flex-col items-center justify-center text-gray-300 hover:text-white cursor-pointer h-full min-w-[60px]">
            <HomeIcon className="h-5 w-5" />
            <span className="text-xs mt-1">الرئيسية</span>
          </button>
          <button className="flex flex-col items-center justify-center text-gray-300 hover:text-white cursor-pointer h-full min-w-[60px]">
            <CalculatorIcon className="h-5 w-5" />
            <span className="text-xs mt-1">المحاسبة</span>
          </button>
          <button className="flex flex-col items-center justify-center text-gray-300 hover:text-white cursor-pointer h-full min-w-[60px]">
            <UserIcon className="h-5 w-5" />
            <span className="text-xs mt-1">اختيار عميل</span>
          </button>
          <button className="flex flex-col items-center justify-center text-gray-300 hover:text-white cursor-pointer h-full min-w-[60px]">
            <ArrowPathIcon className="h-5 w-5" />
            <span className="text-xs mt-1">نقل البيانة</span>
          </button>
          <button className="flex flex-col items-center justify-center text-gray-300 hover:text-white cursor-pointer h-full min-w-[60px]">
            <DocumentTextIcon className="h-5 w-5" />
            <span className="text-xs mt-1">عرض المدفوعات</span>
          </button>
          <button className="flex flex-col items-center justify-center text-gray-300 hover:text-white cursor-pointer h-full min-w-[60px]">
            <TableCellsIcon className="h-5 w-5" />
            <span className="text-xs mt-1">الأعمدة</span>
          </button>
          <button className="flex flex-col items-center justify-center text-gray-300 hover:text-white cursor-pointer h-full min-w-[60px]">
            <PrinterIcon className="h-5 w-5" />
            <span className="text-xs mt-1">نقل الطباعة</span>
          </button>
          <button className="flex flex-col items-center justify-center text-gray-300 hover:text-white cursor-pointer h-full min-w-[60px]">
            <FolderIcon className="h-5 w-5" />
            <span className="text-xs mt-1">تحويل فرع</span>
          </button>
          <button className="flex flex-col items-center justify-center text-gray-300 hover:text-white cursor-pointer h-full min-w-[60px]">
            <EyeIcon className="h-5 w-5" />
            <span className="text-xs mt-1">عرض المدخولات</span>
          </button>


        </div>
      </div>
    </div>
  )
}