'use client';

import { useState } from 'react';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import { 
  ChartBarIcon, 
  DocumentArrowDownIcon,
  PrinterIcon,
  ShoppingCartIcon,
  UserGroupIcon,
  ArchiveBoxIcon,
  CurrencyDollarIcon,
  ChevronDownIcon,
  DocumentTextIcon,
  ArrowsUpDownIcon,
  FunnelIcon,
  CalendarDaysIcon,
  PresentationChartBarIcon,
  DocumentChartBarIcon,
  ClockIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

export default function ReportsPage() {
  
  return (
    <DashboardLayout showSidebar={true} showTopHeader={true} showTopBar={false}>
      <div className="flex-1 flex flex-col h-full bg-[#2B3544]">
        {/* Top Action Buttons Toolbar */}
        <div className="bg-[#374151] border-b border-gray-600 px-4 py-2 w-full">
          <div className="flex items-center justify-start gap-1">
            <button className="flex flex-col items-center p-2 text-gray-300 hover:text-white cursor-pointer min-w-[80px]">
              <DocumentTextIcon className="h-5 w-5 mb-1" />
              <span className="text-sm">التقارير</span>
            </button>

            <button className="flex flex-col items-center p-2 text-gray-300 hover:text-white cursor-pointer min-w-[80px]">
              <ArrowsUpDownIcon className="h-5 w-5 mb-1" />
              <span className="text-sm">ترتيب</span>
            </button>

            <button className="flex flex-col items-center p-2 text-gray-300 hover:text-white cursor-pointer min-w-[80px]">
              <DocumentArrowDownIcon className="h-5 w-5 mb-1" />
              <span className="text-sm">تصدير</span>
            </button>

            <button className="flex flex-col items-center p-2 text-gray-300 hover:text-white cursor-pointer min-w-[80px]">
              <FunnelIcon className="h-5 w-5 mb-1" />
              <span className="text-sm">فلترة</span>
            </button>

            <button className="flex flex-col items-center p-2 text-gray-300 hover:text-white cursor-pointer min-w-[80px]">
              <CalendarDaysIcon className="h-5 w-5 mb-1" />
              <span className="text-sm">تواريخ</span>
            </button>

            <button className="flex flex-col items-center p-2 text-gray-300 hover:text-white cursor-pointer min-w-[80px]">
              <PresentationChartBarIcon className="h-5 w-5 mb-1" />
              <span className="text-sm">عرض بياني</span>
            </button>

            <button className="flex flex-col items-center p-2 text-gray-300 hover:text-white cursor-pointer min-w-[80px]">
              <PrinterIcon className="h-5 w-5 mb-1" />
              <span className="text-sm">طباعة</span>
            </button>

            <button className="flex flex-col items-center p-2 text-gray-300 hover:text-white cursor-pointer min-w-[80px]">
              <DocumentChartBarIcon className="h-5 w-5 mb-1" />
              <span className="text-sm">تقرير مفصل</span>
            </button>

            <button className="flex flex-col items-center p-2 text-gray-300 hover:text-white cursor-pointer min-w-[80px]">
              <ClockIcon className="h-5 w-5 mb-1" />
              <span className="text-sm">تقارير دورية</span>
            </button>

            <button className="flex flex-col items-center p-2 text-gray-300 hover:text-white cursor-pointer min-w-[80px]">
              <ArrowPathIcon className="h-5 w-5 mb-1" />
              <span className="text-sm">تحديث</span>
            </button>
          </div>
        </div>

        {/* Main Content - Fixed Layout No Scrollbars */}
        <div className="flex-1 p-6">
          {/* Top Summary Cards */}
          <div className="grid grid-cols-4 gap-6 mb-6">
            {/* Card 1 - Products Sold */}
            <div className="bg-[#374151] rounded-lg border border-gray-600 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="text-right">
                  <div className="text-3xl font-bold text-white mb-1">3,456</div>
                  <div className="text-red-400 text-sm font-medium">2.1%-</div>
                </div>
                <div className="p-3 bg-orange-500/20 rounded-lg">
                  <ArchiveBoxIcon className="h-8 w-8 text-orange-400" />
                </div>
              </div>
              <div className="text-gray-300 text-sm text-right">المنتجات المباعة</div>
            </div>

            {/* Card 2 - Active Customers */}
            <div className="bg-[#374151] rounded-lg border border-gray-600 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="text-right">
                  <div className="text-3xl font-bold text-white mb-1">892</div>
                  <div className="text-green-400 text-sm font-medium">+15.2%</div>
                </div>
                <div className="p-3 bg-purple-500/20 rounded-lg">
                  <UserGroupIcon className="h-8 w-8 text-purple-400" />
                </div>
              </div>
              <div className="text-gray-300 text-sm text-right">العملاء النشطون</div>
            </div>

            {/* Card 3 - Invoice Count */}
            <div className="bg-[#374151] rounded-lg border border-gray-600 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="text-right">
                  <div className="text-3xl font-bold text-white mb-1">1,234</div>
                  <div className="text-green-400 text-sm font-medium">+8.3%</div>
                </div>
                <div className="p-3 bg-blue-500/20 rounded-lg">
                  <ShoppingCartIcon className="h-8 w-8 text-blue-400" />
                </div>
              </div>
              <div className="text-gray-300 text-sm text-right">عدد الفواتير</div>
            </div>

            {/* Card 4 - Total Sales */}
            <div className="bg-[#374151] rounded-lg border border-gray-600 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="text-right">
                  <div className="text-3xl font-bold text-white mb-1">₾ 45,230.50</div>
                  <div className="text-green-400 text-sm font-medium">+12.5%</div>
                </div>
                <div className="p-3 bg-green-500/20 rounded-lg">
                  <CurrencyDollarIcon className="h-8 w-8 text-green-400" />
                </div>
              </div>
              <div className="text-gray-300 text-sm text-right">إجمالي المبيعات</div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-2 gap-6 h-80">
            {/* Category Distribution */}
            <div className="bg-[#374151] rounded-lg border border-gray-600 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-white text-lg font-semibold text-right">توزيع الفئات</h3>
                <ArchiveBoxIcon className="h-6 w-6 text-green-400" />
              </div>
              
              <div className="flex h-full">
                {/* Categories List */}
                <div className="flex-1 space-y-4">
                  <div className="flex items-center justify-between text-right">
                    <div className="text-white font-semibold">35%</div>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-300 text-sm">الإلكترونيات</span>
                      <div className="w-3 h-3 rounded-full bg-blue-400"></div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-right">
                    <div className="text-white font-semibold">25%</div>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-300 text-sm">الملابس</span>
                      <div className="w-3 h-3 rounded-full bg-green-400"></div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-right">
                    <div className="text-white font-semibold">20%</div>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-300 text-sm">المواد الغذائية</span>
                      <div className="w-3 h-3 rounded-full bg-orange-400"></div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-right">
                    <div className="text-white font-semibold">12%</div>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-300 text-sm">الكتب</span>
                      <div className="w-3 h-3 rounded-full bg-red-400"></div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-right">
                    <div className="text-white font-semibold">8%</div>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-300 text-sm">أخرى</span>
                      <div className="w-3 h-3 rounded-full bg-purple-400"></div>
                    </div>
                  </div>
                </div>

                {/* Compact Donut Chart */}
                <div className="w-32 h-32 relative flex items-center justify-center">
                  <svg className="w-32 h-32 -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      fill="none"
                      stroke="#3B82F6"
                      strokeWidth="12"
                      strokeDasharray="123 227"
                      strokeDashoffset="0"
                      className="transition-all duration-500"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      fill="none"
                      stroke="#10B981"
                      strokeWidth="12"
                      strokeDasharray="88 262"
                      strokeDashoffset="-123"
                      className="transition-all duration-500"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      fill="none"
                      stroke="#F59E0B"
                      strokeWidth="12"
                      strokeDasharray="70 280"
                      strokeDashoffset="-211"
                      className="transition-all duration-500"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      fill="none"
                      stroke="#EF4444"
                      strokeWidth="12"
                      strokeDasharray="42 308"
                      strokeDashoffset="-281"
                      className="transition-all duration-500"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      fill="none"
                      stroke="#8B5CF6"
                      strokeWidth="12"
                      strokeDasharray="28 322"
                      strokeDashoffset="-323"
                      className="transition-all duration-500"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Weekly Sales */}
            <div className="bg-[#374151] rounded-lg border border-gray-600 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-white text-lg font-semibold text-right">مبيعات الأسبوع</h3>
                <ChartBarIcon className="h-6 w-6 text-blue-400" />
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="text-white text-sm font-medium min-w-[50px] text-right">₾ 6,800</div>
                  <div className="flex-1 bg-gray-600 rounded-full h-6 relative">
                    <div className="h-6 bg-blue-500 rounded-full" style={{ width: '74%' }}></div>
                  </div>
                  <div className="text-gray-300 text-sm min-w-[50px] text-right">السبت</div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-white text-sm font-medium min-w-[50px] text-right">₾ 7,200</div>
                  <div className="flex-1 bg-gray-600 rounded-full h-6 relative">
                    <div className="h-6 bg-blue-500 rounded-full" style={{ width: '78%' }}></div>
                  </div>
                  <div className="text-gray-300 text-sm min-w-[50px] text-right">الأحد</div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-white text-sm font-medium min-w-[50px] text-right">₾ 5,600</div>
                  <div className="flex-1 bg-gray-600 rounded-full h-6 relative">
                    <div className="h-6 bg-blue-500 rounded-full" style={{ width: '61%' }}></div>
                  </div>
                  <div className="text-gray-300 text-sm min-w-[50px] text-right">الاثنين</div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-white text-sm font-medium min-w-[50px] text-right">₾ 8,100</div>
                  <div className="flex-1 bg-gray-600 rounded-full h-6 relative">
                    <div className="h-6 bg-blue-500 rounded-full" style={{ width: '88%' }}></div>
                  </div>
                  <div className="text-gray-300 text-sm min-w-[50px] text-right">الثلاثاء</div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-white text-sm font-medium min-w-[50px] text-right">₾ 7,500</div>
                  <div className="flex-1 bg-gray-600 rounded-full h-6 relative">
                    <div className="h-6 bg-blue-500 rounded-full" style={{ width: '82%' }}></div>
                  </div>
                  <div className="text-gray-300 text-sm min-w-[50px] text-right">الأربعاء</div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-white text-sm font-medium min-w-[50px] text-right">₾ 9,200</div>
                  <div className="flex-1 bg-gray-600 rounded-full h-6 relative">
                    <div className="h-6 bg-green-500 rounded-full" style={{ width: '100%' }}></div>
                  </div>
                  <div className="text-gray-300 text-sm min-w-[50px] text-right">الخميس</div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-white text-sm font-medium min-w-[50px] text-right">₾ 8,900</div>
                  <div className="flex-1 bg-gray-600 rounded-full h-6 relative">
                    <div className="h-6 bg-blue-500 rounded-full" style={{ width: '97%' }}></div>
                  </div>
                  <div className="text-gray-300 text-sm min-w-[50px] text-right">الجمعة</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}