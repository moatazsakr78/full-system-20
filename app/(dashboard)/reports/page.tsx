'use client';

import { useState } from 'react';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import ResizableTable from '@/app/components/tables/ResizableTable';
import SimpleDateFilterModal, { DateFilter } from '@/app/components/SimpleDateFilterModal';
import ProductsFilterModal from '@/app/components/ProductsFilterModal';
import CustomersFilterModal from '@/app/components/CustomersFilterModal';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon,
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
  ArrowPathIcon,
  CalendarIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

// Sample reports data - matching the customer details table structure
const reportsData = [
  {
    id: 1,
    type: 'مبيعات يومية',
    date: '2024-01-15',
    amount: 'EGP 15,420.50',
    status: 'مكتمل',
    invoice_count: 45,
    customer_count: 32
  },
  {
    id: 2,
    type: 'مردودات',
    date: '2024-01-15',
    amount: 'EGP -1,200.00',
    status: 'مراجعة',
    invoice_count: 3,
    customer_count: 2
  },
  {
    id: 3,
    type: 'مبيعات أسبوعية',
    date: '2024-01-14',
    amount: 'EGP 89,350.75',
    status: 'مكتمل',
    invoice_count: 287,
    customer_count: 156
  }
];

// Table columns for reports
const tableColumns = [
  { 
    id: 'index', 
    header: '#', 
    accessor: '#', 
    width: 60,
    render: (value: any, item: any, index: number) => (
      <span className="text-gray-400 font-medium">{index + 1}</span>
    )
  },
  { 
    id: 'type', 
    header: 'نوع التقرير', 
    accessor: 'type', 
    width: 150,
    render: (value: string) => <span className="text-white font-medium">{value}</span>
  },
  { 
    id: 'date', 
    header: 'التاريخ', 
    accessor: 'date', 
    width: 120,
    render: (value: string) => <span className="text-gray-300">{value}</span>
  },
  { 
    id: 'amount', 
    header: 'المبلغ الإجمالي', 
    accessor: 'amount', 
    width: 150,
    render: (value: string) => <span className="text-white font-medium">{value}</span>
  },
  { 
    id: 'status', 
    header: 'الحالة', 
    accessor: 'status', 
    width: 100,
    render: (value: string) => (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
        value === 'مكتمل' 
          ? 'bg-green-500/20 text-green-400' 
          : value === 'مراجعة'
          ? 'bg-yellow-500/20 text-yellow-400'
          : 'bg-gray-500/20 text-gray-400'
      }`}>
        {value}
      </span>
    )
  },
  { 
    id: 'invoice_count', 
    header: 'عدد الفواتير', 
    accessor: 'invoice_count', 
    width: 100,
    render: (value: number) => <span className="text-gray-300">{value}</span>
  },
  { 
    id: 'customer_count', 
    header: 'عدد العملاء', 
    accessor: 'customer_count', 
    width: 100,
    render: (value: number) => <span className="text-gray-300">{value}</span>
  }
];

export default function ReportsPage() {
  const [currentView, setCurrentView] = useState('main'); // 'main' or 'periodic'
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [dateFilter, setDateFilter] = useState<DateFilter>({ type: 'all' });
  const [showReportsSidebar, setShowReportsSidebar] = useState(true);
  const [showProductsFilter, setShowProductsFilter] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [showCustomersFilter, setShowCustomersFilter] = useState(false);
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<string[]>([]);
  const [selectedCustomerGroupIds, setSelectedCustomerGroupIds] = useState<string[]>([]);
  
  const handlePeriodicReportsClick = () => {
    setCurrentView('periodic');
  };

  const handleBackToMain = () => {
    setCurrentView('main');
  };

  return (
    <DashboardLayout showSidebar={true} showTopHeader={true} showTopBar={false}>
      <div className="w-full flex flex-col bg-[#2B3544] overflow-hidden" style={{height: 'calc(100vh - 60px)', maxHeight: 'calc(100vh - 60px)'}}>
        
        {/* Top Action Buttons Toolbar - Fixed Height */}
        <div className="bg-[#374151] px-4 py-1.5 w-full flex-shrink-0">
          <div className="flex items-center justify-start gap-1 overflow-x-auto scrollbar-hide">
            <button 
              onClick={() => setCurrentView('main')}
              className={`flex flex-col items-center p-2 cursor-pointer min-w-[80px] ${
                currentView === 'main' 
                  ? 'text-blue-400 bg-blue-500/10' 
                  : 'text-gray-300 hover:text-white'
              }`}
            >
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

            <button 
              onClick={() => setShowProductsFilter(true)}
              className={`flex flex-col items-center p-2 cursor-pointer min-w-[80px] ${
                selectedProductIds.length > 0 || selectedCategoryIds.length > 0
                  ? 'text-green-400 bg-green-500/10'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              <FunnelIcon className="h-5 w-5 mb-1" />
              <span className="text-sm">المنتجات</span>
              {(selectedProductIds.length > 0 || selectedCategoryIds.length > 0) && (
                <span className="text-xs bg-green-500/20 text-green-400 px-1 rounded">
                  {selectedProductIds.length + selectedCategoryIds.length}
                </span>
              )}
            </button>

            <button 
              onClick={() => setShowCustomersFilter(true)}
              className={`flex flex-col items-center p-2 cursor-pointer min-w-[80px] ${
                selectedCustomerIds.length > 0 || selectedCustomerGroupIds.length > 0
                  ? 'text-green-400 bg-green-500/10'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              <UserGroupIcon className="h-5 w-5 mb-1" />
              <span className="text-sm">العملاء</span>
              {(selectedCustomerIds.length > 0 || selectedCustomerGroupIds.length > 0) && (
                <span className="text-xs bg-green-500/20 text-green-400 px-1 rounded">
                  {selectedCustomerIds.length + selectedCustomerGroupIds.length}
                </span>
              )}
            </button>

            <button 
              onClick={() => setShowDateFilter(true)}
              className="flex flex-col items-center p-2 text-gray-300 hover:text-white cursor-pointer min-w-[80px]"
            >
              <CalendarDaysIcon className="h-5 w-5 mb-1" />
              <span className="text-sm">تواريخ</span>
            </button>

            <button className="flex flex-col items-center p-2 text-gray-300 hover:text-white cursor-pointer min-w-[80px]">
              <FunnelIcon className="h-5 w-5 mb-1" />
              <span className="text-sm">فروع ومخازن</span>
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

            <button 
              onClick={handlePeriodicReportsClick}
              className={`flex flex-col items-center p-2 cursor-pointer min-w-[80px] ${
                currentView === 'periodic' 
                  ? 'text-blue-400 bg-blue-500/10' 
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              <ClockIcon className="h-5 w-5 mb-1" />
              <span className="text-sm">تقارير دورية</span>
            </button>

            <button className="flex flex-col items-center p-2 text-gray-300 hover:text-white cursor-pointer min-w-[80px]">
              <ArrowPathIcon className="h-5 w-5 mb-1" />
              <span className="text-sm">تحديث</span>
            </button>
          </div>
        </div>

        {/* Main Content Area - Fill remaining height */}
        <div className="flex-1 flex overflow-hidden">
          {currentView === 'periodic' ? (
            /* Periodic Reports Content */
            <div className="flex-1 p-4 overflow-y-auto scrollbar-hide">
              {/* Top Summary Cards */}
              <div className="grid grid-cols-4 gap-4 mb-4">
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
              <div className="grid grid-cols-2 gap-4 h-64">
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
          ) : (
            /* Main Reports View */
            <>
              {/* Toggle Button */}
              <div className="flex">
                <button
                  onClick={() => setShowReportsSidebar(!showReportsSidebar)}
                  className="w-6 bg-[#374151] hover:bg-[#4B5563] border-l border-gray-600 flex items-center justify-center transition-colors duration-200"
                  title={showReportsSidebar ? 'إخفاء الشريط الجانبي' : 'إظهار الشريط الجانبي'}
                >
                  {showReportsSidebar ? (
                    <ChevronLeftIcon className="h-4 w-4 text-gray-300" />
                  ) : (
                    <ChevronRightIcon className="h-4 w-4 text-gray-300" />
                  )}
                </button>
              </div>

              {/* Right Sidebar */}
              {showReportsSidebar && (
                <div className="w-80 bg-[#3B4754] border-r border-gray-600 flex flex-col overflow-hidden">
                  {/* Balance Section */}
                  <div className="p-3 border-b border-gray-600 flex-shrink-0">
                    <div className="bg-blue-600 rounded-lg p-3 text-center text-white">
                      <div className="text-xl font-bold mb-1">EGP 190,322.00</div>
                      <div className="text-xs opacity-90">رصيد الحساب</div>
                    </div>
                  </div>

                  {/* Report Information - Scrollable */}
                  <div className="flex-1 overflow-y-auto scrollbar-hide">
                    {selectedReport && (
                      <div className="p-3 border-b border-gray-600">
                        <h3 className="text-white font-medium mb-2 text-right">معلومات التقرير</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-white">{selectedReport.type}</span>
                            <span className="text-gray-400">نوع التقرير</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-white">{selectedReport.date}</span>
                            <span className="text-gray-400">تاريخ التقرير</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-white">{selectedReport.amount}</span>
                            <span className="text-gray-400">المبلغ الإجمالي</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-white">{selectedReport.invoice_count}</span>
                            <span className="text-gray-400">عدد الفواتير</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Summary Statistics */}
                    <div className="p-3 border-b border-gray-600">
                      <h3 className="text-white font-medium mb-2 text-right">إحصائيات التقرير</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-white">1</span>
                          <span className="text-gray-400">عدد التقارير</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-white">EGP 480.00</span>
                          <span className="text-gray-400">إجمالي المشتريات</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-white">EGP 480.00</span>
                          <span className="text-gray-400">متوسط قيمة الطلبية</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-white">7/15/2025</span>
                          <span className="text-gray-400">آخر تحديث</span>
                        </div>
                      </div>
                    </div>

                    {/* Message Area */}
                    <div className="p-3 text-center text-gray-500 text-sm">
                      {selectedReport ? 'تفاصيل إضافية للتقرير المحدد' : 'اختر تقريراً لعرض التفاصيل'}
                    </div>
                  </div>

                  {/* Date Filter Button - Fixed at Bottom */}
                  <div className="p-2 border-t border-gray-600 flex-shrink-0 bg-[#3B4754]">
                    <button
                      onClick={() => setShowDateFilter(true)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded font-medium flex items-center justify-center gap-2 transition-colors text-sm"
                    >
                      <CalendarDaysIcon className="h-4 w-4" />
                      <span>التاريخ</span>
                    </button>
                    
                    {/* Current Filter Display */}
                    {dateFilter.type !== 'all' && (
                      <div className="mt-1.5 text-center">
                        <span className="text-xs text-blue-400 break-words leading-tight">
                          {dateFilter.type === 'today' && 'عرض تقارير اليوم'}
                          {dateFilter.type === 'current_week' && 'عرض تقارير الأسبوع الحالي'}
                          {dateFilter.type === 'last_week' && 'عرض تقارير الأسبوع الماضي'}
                          {dateFilter.type === 'current_month' && 'عرض تقارير الشهر الحالي'}
                          {dateFilter.type === 'last_month' && 'عرض تقارير الشهر الماضي'}
                          {dateFilter.type === 'custom' && dateFilter.startDate && dateFilter.endDate && 
                            <span className="break-words">{`من ${dateFilter.startDate.toLocaleDateString('ar-SA')} إلى ${dateFilter.endDate.toLocaleDateString('ar-SA')}`}</span>}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Main Content Area - Table */}
              <div className="flex-1 min-w-0 overflow-hidden">
                <div className="h-full overflow-y-auto scrollbar-hide bg-[#2B3544]" style={{maxHeight: '100%'}}>
                  <ResizableTable
                    className="w-full"
                    columns={tableColumns}
                    data={reportsData}
                    selectedRowId={selectedReport?.id || null}
                    onRowClick={(report, index) => {
                      if (selectedReport?.id === report.id) {
                        setSelectedReport(null);
                      } else {
                        setSelectedReport(report);
                      }
                    }}
                    onRowDoubleClick={(report, index) => {
                      // Handle double click if needed
                    }}
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Date Filter Modal */}
        <SimpleDateFilterModal
          isOpen={showDateFilter}
          onClose={() => setShowDateFilter(false)}
          onDateFilterChange={(filter) => {
            setDateFilter(filter)
          }}
          currentFilter={dateFilter}
        />

        {/* Products Filter Modal */}
        <ProductsFilterModal
          isOpen={showProductsFilter}
          onClose={() => setShowProductsFilter(false)}
          onFilterApply={(productIds, categoryIds) => {
            setSelectedProductIds(productIds)
            setSelectedCategoryIds(categoryIds)
            console.log('Selected Products:', productIds)
            console.log('Selected Categories:', categoryIds)
          }}
          initialSelectedProducts={selectedProductIds}
          initialSelectedCategories={selectedCategoryIds}
        />

        {/* Customers Filter Modal */}
        <CustomersFilterModal
          isOpen={showCustomersFilter}
          onClose={() => setShowCustomersFilter(false)}
          onFilterApply={(customerIds, groupIds) => {
            setSelectedCustomerIds(customerIds)
            setSelectedCustomerGroupIds(groupIds)
            console.log('Selected Customers:', customerIds)
            console.log('Selected Customer Groups:', groupIds)
          }}
          initialSelectedCustomers={selectedCustomerIds}
          initialSelectedGroups={selectedCustomerGroupIds}
        />
      </div>
    </DashboardLayout>
  );
}