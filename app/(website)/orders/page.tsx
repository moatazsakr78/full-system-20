'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Order status type
type OrderStatus = 'pending' | 'processing' | 'shipped' | 'completed' | 'cancelled';

// Order interface
interface Order {
  id: string;
  date: string;
  total: number;
  status: OrderStatus;
  items: {
    id: string;
    name: string;
    quantity: number;
    price: number;
    image?: string;
  }[];
}

const statusTranslations: Record<OrderStatus, string> = {
  pending: 'معلق',
  processing: 'يتم التحضير',
  shipped: 'مع شركة الشحن',
  completed: 'مكتمل',
  cancelled: 'ملغي'
};

const statusColors: Record<OrderStatus, string> = {
  pending: '#EF4444', // Red
  processing: '#F59E0B', // Yellow
  shipped: '#10B981', // Green
  completed: '#10B981', // Green
  cancelled: '#6B7280' // Gray
};

export default function OrdersPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'completed' | 'pending'>('completed');
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Mock data - replace with real API calls
  useEffect(() => {
    // Simulate API call
    const mockOrders: Order[] = [
      {
        id: 'ORD-001',
        date: '2024-08-10',
        total: 150.00,
        status: 'completed',
        items: [
          {
            id: '1',
            name: 'طقم توزيع الشيف بوراك',
            quantity: 2,
            price: 75.00,
            image: '/placeholder.jpg'
          }
        ]
      },
      {
        id: 'ORD-002',
        date: '2024-08-12',
        total: 225.00,
        status: 'shipped',
        items: [
          {
            id: '2',
            name: 'ديسبينسر شامبو ديكور',
            quantity: 1,
            price: 225.00,
            image: '/placeholder.jpg'
          }
        ]
      },
      {
        id: 'ORD-003',
        date: '2024-08-14',
        total: 320.00,
        status: 'processing',
        items: [
          {
            id: '3',
            name: 'منتج تجريبي',
            quantity: 1,
            price: 320.00,
            image: '/placeholder.jpg'
          }
        ]
      },
      {
        id: 'ORD-004',
        date: '2024-08-13',
        total: 180.00,
        status: 'pending',
        items: [
          {
            id: '4',
            name: 'منتج آخر',
            quantity: 3,
            price: 60.00,
            image: '/placeholder.jpg'
          }
        ]
      }
    ];

    setOrders(mockOrders);
    setLoading(false);
  }, []);

  // Filter orders based on active tab and date range
  useEffect(() => {
    let filtered = orders;

    // Filter by status
    if (activeTab === 'completed') {
      filtered = orders.filter(order => order.status === 'completed');
    } else {
      filtered = orders.filter(order => order.status !== 'completed');
    }

    // Filter by date range for completed orders
    if (activeTab === 'completed' && (dateFrom || dateTo)) {
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.date);
        const fromDate = dateFrom ? new Date(dateFrom) : null;
        const toDate = dateTo ? new Date(dateTo) : null;

        if (fromDate && orderDate < fromDate) return false;
        if (toDate && orderDate > toDate) return false;
        return true;
      });
    }

    setFilteredOrders(filtered);
  }, [orders, activeTab, dateFrom, dateTo]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{backgroundColor: '#c0c0c0'}}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{borderBottomColor: '#5D1F1F'}}></div>
          <p className="text-gray-600">جاري تحميل الطلبات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-gray-800" style={{backgroundColor: '#c0c0c0'}}>
      {/* Hide system blue header */}
      <style jsx global>{`
        body {
          margin-top: 0 !important;
          padding-top: 0 !important;
        }
        html {
          margin-top: 0 !important;
          padding-top: 0 !important;
        }
        /* Hide any potential system headers */
        iframe,
        .system-header,
        [class*="system"],
        [class*="navigation"],
        [style*="background: #374151"],
        [style*="background-color: #374151"] {
          display: none !important;
        }
      `}</style>

      {/* Store Header (Red) */}
      <header className="border-b border-gray-700 py-0 relative z-40" style={{backgroundColor: '#5d1f1f'}}>
        <div className="relative flex items-center min-h-[80px]">
          <div className="max-w-[80%] mx-auto px-4 flex items-center justify-between min-h-[80px] w-full">
            <div className="flex items-center gap-8">
              <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-white hover:text-gray-300 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span>العودة</span>
              </button>
              
              <div className="flex items-center gap-3">
                <img src="/assets/logo/El Farouk Group2.png" alt="الفاروق" className="h-20 w-20 object-contain" />
                <h1 className="text-xl font-bold text-white">قائمة الطلبات - El Farouk Group</h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[80%] mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex mb-8 bg-white rounded-lg overflow-hidden shadow-lg">
          <button
            onClick={() => setActiveTab('completed')}
            className={`flex-1 py-4 px-6 font-semibold transition-colors ${
              activeTab === 'completed'
                ? 'text-white'
                : 'text-gray-600 hover:text-gray-800'
            }`}
            style={{
              backgroundColor: activeTab === 'completed' ? '#5d1f1f' : 'transparent'
            }}
          >
            الطلبات المنفذة
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex-1 py-4 px-6 font-semibold transition-colors ${
              activeTab === 'pending'
                ? 'text-white'
                : 'text-gray-600 hover:text-gray-800'
            }`}
            style={{
              backgroundColor: activeTab === 'pending' ? '#5d1f1f' : 'transparent'
            }}
          >
            الطلبات قيد التنفيذ
          </button>
        </div>

        {/* Date Filter (only for completed orders) */}
        {activeTab === 'completed' && (
          <div className="bg-white rounded-lg p-6 mb-6 shadow-lg">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">فلتر التاريخ</h3>
            <div className="flex flex-wrap gap-4">
              <div className="flex flex-col">
                <label className="text-sm text-gray-600 mb-1">من تاريخ</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                  style={{"--tw-ring-color": "#5D1F1F"} as React.CSSProperties}
                />
              </div>
              <div className="flex flex-col">
                <label className="text-sm text-gray-600 mb-1">إلى تاريخ</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                  style={{"--tw-ring-color": "#5D1F1F"} as React.CSSProperties}
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setDateFrom('');
                    setDateTo('');
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  مسح الفلتر
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Orders List */}
        <div className="space-y-4">
          {filteredOrders.length === 0 ? (
            <div className="bg-white rounded-lg p-8 shadow-lg text-center">
              <div className="text-gray-400 text-6xl mb-4">📦</div>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                {activeTab === 'completed' ? 'لا توجد طلبات منفذة' : 'لا توجد طلبات قيد التنفيذ'}
              </h3>
              <p className="text-gray-500">
                {activeTab === 'completed' 
                  ? 'لم تقم بأي طلبات مكتملة بعد' 
                  : 'جميع طلباتك مكتملة'
                }
              </p>
            </div>
          ) : (
            filteredOrders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg p-6 shadow-lg">
                {/* Order Header */}
                <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">طلب رقم: {order.id}</h3>
                    <p className="text-gray-600">التاريخ: {new Date(order.date).toLocaleDateString('ar-SA')}</p>
                  </div>
                  <div className="text-left">
                    <p className="text-xl font-bold text-gray-800">{order.total.toFixed(2)} ريال</p>
                    <span
                      className="inline-block px-3 py-1 rounded-full text-sm font-semibold text-white"
                      style={{ backgroundColor: statusColors[order.status] }}
                    >
                      {statusTranslations[order.status]}
                    </span>
                  </div>
                </div>

                {/* Order Items */}
                <div className="space-y-3">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                      <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                        {item.image ? (
                          <img 
                            src={item.image} 
                            alt={item.name}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <span className="text-gray-400 text-2xl">📦</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-800">{item.name}</h4>
                        <p className="text-gray-600">الكمية: {item.quantity}</p>
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-gray-800">{(item.price * item.quantity).toFixed(2)} ريال</p>
                        <p className="text-sm text-gray-500">{item.price.toFixed(2)} ريال لكل قطعة</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}