'use client';

import { useState } from 'react';
import TopHeader from '@/app/components/layout/TopHeader';
import Sidebar from '@/app/components/layout/Sidebar';
import { useSystemCurrency } from '@/lib/hooks/useCurrency';
import { 
  ChartBarIcon, 
  CurrencyDollarIcon, 
  UsersIcon, 
  ArchiveBoxIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ClockIcon,
  DocumentTextIcon,
  ArrowRightIcon,
  BuildingStorefrontIcon
} from '@heroicons/react/24/outline';

export default function DashboardPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Mock data for dashboard cards
  const dashboardStats = [
    {
      title: 'إجمالي المبيعات',
      value: '125,450',
      currency: 'ر.س',
      change: '+12.5%',
      isPositive: true,
      icon: CurrencyDollarIcon,
      color: 'pos-green'
    },
    {
      title: 'عدد العملاء',
      value: '2,847',
      change: '+8.2%',
      isPositive: true,
      icon: UsersIcon,
      color: 'pos-blue'
    },
    {
      title: 'المنتجات المتوفرة',
      value: '1,234',
      change: '-2.1%',
      isPositive: false,
      icon: ArchiveBoxIcon,
      color: 'pos-orange'
    },
    {
      title: 'الفواتير اليوم',
      value: '87',
      change: '+15.3%',
      isPositive: true,
      icon: DocumentTextIcon,
      color: 'pos-blue'
    }
  ];

  // Mock data for recent activities
  const recentActivities = [
    { id: 1, type: 'sale', description: 'فاتورة بيع جديدة - عميل أحمد محمد', amount: '1,250 ر.س', time: 'منذ 5 دقائق' },
    { id: 2, type: 'product', description: 'تم إضافة منتج جديد - لابتوب ديل', time: 'منذ 15 دقيقة' },
    { id: 3, type: 'customer', description: 'تم تسجيل عميل جديد - شركة الرياض', time: 'منذ 30 دقيقة' },
    { id: 4, type: 'inventory', description: 'تحديث المخزون - جهاز آيفون 15', time: 'منذ ساعة' },
    { id: 5, type: 'sale', description: 'فاتورة بيع جديدة - عميل فاطمة أحمد', amount: '850 ر.س', time: 'منذ ساعتين' }
  ];

  // Mock data for top products
  const topProducts = [
    { id: 1, name: 'لابتوب HP ProBook', sales: 45, revenue: '67,500 ر.س' },
    { id: 2, name: 'آيفون 15 برو', sales: 38, revenue: '57,000 ر.س' },
    { id: 3, name: 'سامسونج جالاكسي', sales: 32, revenue: '28,800 ر.س' },
    { id: 4, name: 'ماوس لاسلكي', sales: 89, revenue: '26,700 ر.س' },
    { id: 5, name: 'كيبورد ميكانيكي', sales: 67, revenue: '20,100 ر.س' }
  ];

  return (
    <div className="h-screen bg-[#2B3544] overflow-hidden">
      <TopHeader onMenuClick={toggleSidebar} isMenuOpen={isSidebarOpen} />
      <Sidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} />
      
      <div className="h-full pt-12 overflow-hidden">
        {/* Top Action Buttons */}
        <div className="bg-[#374151] border-b border-gray-600 px-4 py-2 w-full">
          <div className="flex items-center gap-4 rtl:space-x-reverse">
            <button className="flex flex-col items-center justify-center min-w-[80px] p-2 text-gray-300 hover:text-white transition-colors">
              <ChartBarIcon className="w-6 h-6 mb-1" />
              <span className="text-xs">تحديث</span>
            </button>
            <button className="flex flex-col items-center justify-center min-w-[80px] p-2 text-gray-300 hover:text-white transition-colors">
              <DocumentTextIcon className="w-6 h-6 mb-1" />
              <span className="text-xs">تقرير</span>
            </button>
            <button className="flex flex-col items-center justify-center min-w-[80px] p-2 text-gray-300 hover:text-white transition-colors">
              <BuildingStorefrontIcon className="w-6 h-6 mb-1" />
              <span className="text-xs">الفروع</span>
            </button>
          </div>
        </div>

        {/* Main Dashboard Content */}
        <div className="flex-1 overflow-auto p-6">
          {/* Stats Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {dashboardStats.map((stat, index) => (
              <div key={index} className="bg-[#374151] rounded-lg border border-gray-600 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-gray-300 text-sm font-medium mb-1">{stat.title}</p>
                    <div className="flex items-baseline gap-2">
                      <p className="text-2xl font-bold text-white">
                        {stat.value}
                      </p>
                      {stat.currency && (
                        <span className="text-gray-400 text-sm">{stat.currency}</span>
                      )}
                    </div>
                    <div className="flex items-center mt-2">
                      {stat.isPositive ? (
                        <ArrowTrendingUpIcon className="w-4 h-4 text-pos-green ml-1" />
                      ) : (
                        <ArrowTrendingDownIcon className="w-4 h-4 text-pos-red ml-1" />
                      )}
                      <span className={`text-sm font-medium ${
                        stat.isPositive ? 'text-pos-green' : 'text-pos-red'
                      }`}>
                        {stat.change}
                      </span>
                      <span className="text-gray-400 text-sm mr-2">من الشهر الماضي</span>
                    </div>
                  </div>
                  <div className={`bg-[#2B3544] p-3 rounded-lg`}>
                    <stat.icon className={`w-8 h-8 text-${stat.color}`} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Charts and Activities Section */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Sales Chart Area */}
            <div className="xl:col-span-2 bg-[#374151] rounded-lg border border-gray-600 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">إحصائيات المبيعات</h3>
                <div className="flex gap-2">
                  <button className="px-3 py-1 text-sm bg-pos-blue text-white rounded">الأسبوع</button>
                  <button className="px-3 py-1 text-sm text-gray-300 hover:text-white rounded">الشهر</button>
                  <button className="px-3 py-1 text-sm text-gray-300 hover:text-white rounded">السنة</button>
                </div>
              </div>
              
              {/* Mock Chart Area */}
              <div className="h-64 bg-[#2B3544] rounded-lg border border-gray-600 flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <ChartBarIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>سيتم عرض الرسم البياني هنا</p>
                  <p className="text-sm mt-2">Chart implementation pending</p>
                </div>
              </div>
            </div>

            {/* Recent Activities */}
            <div className="bg-[#374151] rounded-lg border border-gray-600 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">النشاطات الأخيرة</h3>
                <ClockIcon className="w-5 h-5 text-gray-400" />
              </div>
              
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 p-3 hover:bg-[#2B3544] rounded-lg transition-colors">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      activity.type === 'sale' ? 'bg-pos-green' :
                      activity.type === 'product' ? 'bg-pos-blue' :
                      activity.type === 'customer' ? 'bg-pos-orange' :
                      'bg-pos-gray'
                    }`} />
                    <div className="flex-1">
                      <p className="text-white text-sm font-medium leading-relaxed">
                        {activity.description}
                      </p>
                      {activity.amount && (
                        <p className="text-pos-green text-sm font-medium">{activity.amount}</p>
                      )}
                      <p className="text-gray-400 text-xs mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <button className="w-full mt-4 p-2 text-pos-blue hover:text-white text-sm font-medium flex items-center justify-center gap-2 transition-colors">
                عرض جميع الأنشطة
                <ArrowRightIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Top Products Section */}
          <div className="mt-6 bg-[#374151] rounded-lg border border-gray-600 p-6">
            <h3 className="text-lg font-bold text-white mb-4">أكثر المنتجات مبيعاً</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-600">
                    <th className="text-right py-3 px-4 text-gray-300 font-medium">#</th>
                    <th className="text-right py-3 px-4 text-gray-300 font-medium">اسم المنتج</th>
                    <th className="text-right py-3 px-4 text-gray-300 font-medium">عدد المبيعات</th>
                    <th className="text-right py-3 px-4 text-gray-300 font-medium">إجمالي الإيرادات</th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.map((product, index) => (
                    <tr key={product.id} className="border-b border-gray-700 hover:bg-[#2B3544] transition-colors">
                      <td className="py-3 px-4 text-gray-400">{index + 1}</td>
                      <td className="py-3 px-4 text-white font-medium">{product.name}</td>
                      <td className="py-3 px-4 text-white">{product.sales}</td>
                      <td className="py-3 px-4 text-pos-green font-medium">{product.revenue}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

