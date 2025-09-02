'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Order status type
type OrderStatus = 'pending' | 'processing' | 'ready_for_pickup' | 'ready_for_shipping' | 'shipped' | 'delivered' | 'cancelled' | 'issue';

// Order delivery type
type DeliveryType = 'pickup' | 'delivery';

// Order interface
interface Order {
  id: string;
  orderId: string; // Added database ID
  date: string;
  total: number;
  subtotal?: number | null;
  shipping?: number | null;
  status: OrderStatus;
  deliveryType: DeliveryType;
  items: {
    id: string;
    name: string;
    quantity: number;
    price: number;
    image?: string;
    barcode?: string;
    isPrepared?: boolean; // Added for preparation tracking
  }[];
}

const statusTranslations: Record<OrderStatus, string> = {
  pending: 'معلق',
  processing: 'يتم التحضير',
  ready_for_pickup: 'جاهز للاستلام',
  ready_for_shipping: 'جاهز للشحن',
  shipped: 'مع شركة الشحن',
  delivered: 'تم التسليم',
  cancelled: 'ملغي',
  issue: 'مشكله'
};

const statusColors: Record<OrderStatus, string> = {
  pending: '#EF4444', // Red
  processing: '#F59E0B', // Yellow
  ready_for_pickup: '#86EFAC', // Light Green
  ready_for_shipping: '#FB923C', // Orange
  shipped: '#3B82F6', // Blue
  delivered: '#059669', // Dark Green
  cancelled: '#6B7280', // Gray
  issue: '#8B5CF6' // Purple
};

export default function OrdersPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'completed' | 'pending'>('completed');
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  

  // Load orders from database
  useEffect(() => {
    const loadOrders = async () => {
      try {
        const { supabase } = await import('../../lib/supabase/client');
        
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        
        // Get orders with their items and product details for current user
        let query = supabase
          .from('orders')
          .select(`
            id,
            order_number,
            customer_name,
            customer_phone,
            customer_address,
            total_amount,
            subtotal_amount,
            shipping_amount,
            status,
            delivery_type,
            notes,
            created_at,
            order_items (
              id,
              quantity,
              unit_price,
              products (
                id,
                name,
                barcode,
                main_image_url
              )
            )
          `);
          
        // If user is logged in, filter by user ID, otherwise show orders for current session
        if (user?.id) {
          query = query.eq('user_id', user.id);
        } else {
          // For non-logged in users, we could use session storage to track their orders
          // For now, we'll show no orders unless they're logged in
          query = query.eq('user_id', 'no-user-logged-in');
        }
        
        const { data: ordersData, error: ordersError } = await query
          .order('created_at', { ascending: false });

        if (ordersError) {
          console.error('Error fetching orders:', ordersError);
          return;
        }

        // Transform data to match our Order interface and filter out orders with no items
        const transformedOrders: Order[] = (ordersData || [])
          .filter((order: any) => order.order_items && order.order_items.length > 0) // Filter out empty orders
          .map((order: any) => {
            // First, map all items
            const rawItems = order.order_items.map((item: any) => ({
              id: item.id.toString(),
              product_id: item.products?.id,
              name: item.products?.name || 'منتج غير معروف',
              quantity: item.quantity,
              price: parseFloat(item.unit_price),
              image: item.products?.main_image_url || undefined,
              barcode: item.products?.barcode || null,
              isPrepared: false // Initialize as not prepared
            }));

            // Group items by product_id and combine quantities
            const groupedItemsMap = new Map();
            rawItems.forEach((item: any) => {
              const key = item.product_id || item.name; // Use product_id as key, fallback to name
              if (groupedItemsMap.has(key)) {
                const existingItem = groupedItemsMap.get(key);
                existingItem.quantity += item.quantity;
                // Keep the prepared status as true if any of the items is prepared
                existingItem.isPrepared = existingItem.isPrepared || item.isPrepared;
              } else {
                groupedItemsMap.set(key, { ...item });
              }
            });

            // Convert back to array
            const groupedItems = Array.from(groupedItemsMap.values());

            return {
              id: order.order_number,
              orderId: order.id, // Store database ID
              date: order.created_at.split('T')[0], // Extract date part
              total: parseFloat(order.total_amount),
              subtotal: order.subtotal_amount ? parseFloat(order.subtotal_amount) : null,
              shipping: order.shipping_amount ? parseFloat(order.shipping_amount) : null,
              status: order.status,
              deliveryType: order.delivery_type || 'pickup',
              items: groupedItems
            };
          });

        setOrders(transformedOrders);
        setLoading(false);
      } catch (error) {
        console.error('Error loading orders:', error);
        setLoading(false);
      }
    };

    loadOrders();
  }, []);

  // Filter orders based on active tab and date range
  useEffect(() => {
    let filtered = orders;

    // Filter by status
    if (activeTab === 'completed') {
      filtered = orders.filter(order => order.status === 'delivered');
    } else {
      filtered = orders.filter(order => order.status !== 'delivered');
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
    
    // Set default expanded state for orders
    const newExpandedOrders = new Set<string>();
    filtered.forEach(order => {
      // Auto-expand non-delivered orders (pending, processing, ready_for_pickup, ready_for_shipping, shipped)
      if (order.status !== 'delivered') {
        newExpandedOrders.add(order.id);
      }
    });
    setExpandedOrders(newExpandedOrders);
  }, [orders, activeTab, dateFrom, dateTo]);

  // Toggle order expansion
  const toggleOrderExpansion = (orderId: string) => {
    const newExpandedOrders = new Set(expandedOrders);
    if (newExpandedOrders.has(orderId)) {
      newExpandedOrders.delete(orderId);
    } else {
      newExpandedOrders.add(orderId);
    }
    setExpandedOrders(newExpandedOrders);
  };



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
        [class*="navigation"] {
          display: none !important;
        }
      `}</style>

      {/* Store Header (Red) */}
      <header className="border-b border-gray-700 py-0 relative z-40" style={{backgroundColor: '#5d1f1f'}}>
        <div className="relative flex items-center min-h-[60px] md:min-h-[80px]">
          <div className="max-w-[95%] md:max-w-[95%] lg:max-w-[80%] mx-auto px-2 md:px-3 lg:px-4 flex items-center justify-between min-h-[60px] md:min-h-[80px] w-full">
            
            {/* زر العودة - اليسار */}
            <button
              onClick={() => router.back()}
              className="flex items-center p-2 text-white hover:text-gray-300 transition-colors"
            >
              <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="hidden md:inline mr-2">العودة</span>
            </button>

            {/* النص الرئيسي - الوسط */}
            <div className="absolute left-1/2 transform -translate-x-1/2">
              <h1 className="text-lg md:text-2xl font-bold text-white text-center whitespace-nowrap">
                قائمة الطلبات
              </h1>
            </div>

            {/* اللوجو - اليمين */}
            <div className="flex items-center">
              <img src="/assets/logo/El Farouk Group2.png" alt="الفاروق" className="h-12 w-12 md:h-16 md:w-16 object-contain" />
            </div>

          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[98%] md:max-w-[95%] lg:max-w-[80%] mx-auto px-2 md:px-3 lg:px-4 py-4 md:py-5 lg:py-8">
        {/* Tabs */}
        <div className="flex flex-wrap md:flex-nowrap mb-4 md:mb-6 lg:mb-8 bg-white rounded-lg overflow-hidden shadow-lg">
          <button
            onClick={() => setActiveTab('completed')}
            className={`flex-1 min-w-0 py-2 md:py-4 px-2 md:px-6 text-sm md:text-base font-semibold transition-colors ${
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
            className={`flex-1 min-w-0 py-2 md:py-4 px-2 md:px-6 text-sm md:text-base font-semibold transition-colors ${
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
          <div className="bg-white rounded-lg p-3 md:p-4 lg:p-6 mb-4 md:mb-5 lg:mb-6 shadow-lg">
            <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4 text-gray-800">فلتر التاريخ</h3>
            <div className="flex flex-wrap gap-2 md:gap-3 lg:gap-4">
              <div className="flex flex-col flex-1 min-w-[140px]">
                <label className="text-xs md:text-sm text-gray-600 mb-1">من تاريخ</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="px-2 md:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 text-sm md:text-base"
                  style={{"--tw-ring-color": "#5D1F1F"} as React.CSSProperties}
                />
              </div>
              <div className="flex flex-col flex-1 min-w-[140px]">
                <label className="text-xs md:text-sm text-gray-600 mb-1">إلى تاريخ</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="px-2 md:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 text-sm md:text-base"
                  style={{"--tw-ring-color": "#5D1F1F"} as React.CSSProperties}
                />
              </div>
              <div className="flex items-end w-full md:w-auto mt-2 md:mt-0">
                <button
                  onClick={() => {
                    setDateFrom('');
                    setDateTo('');
                  }}
                  className="w-full md:w-auto px-3 md:px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm md:text-base"
                >
                  مسح الفلتر
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Orders List */}
        <div className="space-y-2 md:space-y-3 lg:space-y-4">
          {filteredOrders.length === 0 ? (
            <div className="bg-white rounded-lg p-4 md:p-8 shadow-lg text-center">
              <div className="text-gray-400 text-4xl md:text-6xl mb-2 md:mb-4">📦</div>
              <h3 className="text-lg md:text-xl font-semibold text-gray-600 mb-1 md:mb-2">
                {activeTab === 'completed' ? 'لا توجد طلبات منفذة' : 'لا توجد طلبات قيد التنفيذ'}
              </h3>
              <p className="text-gray-500 mb-4">
                {activeTab === 'completed' 
                  ? 'لم تقم بأي طلبات مكتملة بعد' 
                  : 'جميع طلباتك مكتملة'
                }
              </p>
              <button
                onClick={() => window.location.href = '/'}
                className="px-6 py-2 rounded-lg text-white transition-colors"
                style={{backgroundColor: '#5d1f1f'}}
                onMouseEnter={(e) => {
                  (e.target as HTMLButtonElement).style.backgroundColor = '#4A1616';
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLButtonElement).style.backgroundColor = '#5d1f1f';
                }}
              >
                تصفح المنتجات
              </button>
            </div>
          ) : (
            filteredOrders.map((order) => {
              const isExpanded = expandedOrders.has(order.id);
              return (
                <div key={order.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
                  {/* Status Tag with Order Info */}
                  <div className="px-3 md:px-4 lg:px-6 pt-3 md:pt-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      {/* Left Side: Status Tag */}
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 md:gap-2 px-3 md:px-4 py-1 md:py-2 rounded-full text-sm md:text-base font-semibold ${
                            order.status === 'ready_for_pickup' ? 'text-green-800' : 'text-white'
                          }`}
                          style={{ backgroundColor: statusColors[order.status] }}
                        >
                          <span className="text-sm md:text-base">{statusTranslations[order.status]}</span>
                        </span>
                      </div>
                      
                      {/* Right Side: Order Number and Date */}
                      <div className="flex flex-col items-end text-right">
                        <span className="text-sm md:text-base font-medium text-gray-800">طلب رقم: {order.id}</span>
                        <span className="text-xs md:text-sm text-gray-600">{new Date(order.date).toLocaleDateString('ar-SA')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Order Content - Always Visible */}
                  <div 
                    className="px-3 md:px-4 lg:px-6 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => toggleOrderExpansion(order.id)}
                  >
                    
                    {/* Mobile View: Stacked Layout */}
                    <div className="md:hidden py-3">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold text-blue-600">معلومات الطلب</h4>
                        {/* Collapse/Expand Arrow */}
                        <svg 
                          className={`w-5 h-5 text-gray-500 transform transition-transform duration-200 ${
                            isExpanded ? 'rotate-90' : 'rotate-0'
                          }`} 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                      
                      {/* Customer Information */}
                      <div className="space-y-1 text-sm">
                        <p className="text-gray-700">اسم العميل: محمد أحمد</p>
                        <p className="text-gray-700">رقم الهاتف: 011-1234567</p>
                        <p className="text-gray-700">العنوان: السيوف شماعة</p>
                      </div>
                      
                      {/* Separator Line */}
                      <hr className="border-t border-gray-300 my-3" />
                      
                      {/* Financial Details */}
                      <div className="space-y-1 text-sm">
                        {order.subtotal && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">مبلغ الفاتورة:</span>
                            <span className="text-gray-800 font-medium">{order.subtotal.toFixed(2)} ريال</span>
                          </div>
                        )}
                        {order.shipping && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">الشحن:</span>
                            <span className="text-gray-800 font-medium">{order.shipping.toFixed(2)} ريال</span>
                          </div>
                        )}
                        <div className="flex justify-between font-semibold text-base pt-1 border-t border-gray-200">
                          <span className="text-gray-800">الإجمالي:</span>
                          <span className="text-gray-800">{order.total.toFixed(2)} ريال</span>
                        </div>
                      </div>
                    </div>

                    {/* Desktop/Tablet View: Side by Side Layout */}
                    <div className="hidden md:block py-4">
                      <div className="grid grid-cols-3 gap-4 md:gap-6 lg:gap-8">
                        {/* Customer Information - Left Side (takes more space) */}
                        <div className="col-span-2">
                          <h5 className="text-lg font-semibold text-blue-600 mb-4">معلومات العميل</h5>
                          <div className="space-y-3 text-lg">
                            <p className="text-gray-700">الاسم: محمد أحمد</p>
                            <p className="text-gray-700">الهاتف: 011-1234567</p>
                            <p className="text-gray-700">العنوان: السيوف شماعة</p>
                          </div>
                        </div>

                        {/* Financial Details + Arrow - Right Side (compact) */}
                        <div className="flex flex-col">
                          {/* Title aligned with Customer Info title */}
                          <div className="flex justify-between items-center mb-4">
                            <h5 className="text-lg font-semibold text-blue-600">التفاصيل المالية</h5>
                            {/* Collapse/Expand Arrow */}
                            <svg 
                              className={`w-6 h-6 text-gray-500 transform transition-transform duration-200 ${
                                isExpanded ? 'rotate-90' : 'rotate-0'
                              }`} 
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                          
                          <div className="space-y-2 text-base bg-gray-50 rounded-lg p-3 md:p-4">
                            {order.subtotal && (
                              <div className="flex justify-between items-center gap-4">
                                <span className="text-gray-600 text-base">مبلغ الفاتورة:</span>
                                <span className="text-gray-800 font-medium whitespace-nowrap text-base">{order.subtotal.toFixed(2)} ريال</span>
                              </div>
                            )}
                            {order.shipping && (
                              <div className="flex justify-between items-center gap-4">
                                <span className="text-gray-600 text-base">الشحن:</span>
                                <span className="text-gray-800 font-medium whitespace-nowrap text-base">{order.shipping.toFixed(2)} ريال</span>
                              </div>
                            )}
                            <div className="flex justify-between items-center gap-4 font-semibold text-lg pt-2 border-t border-gray-200">
                              <span className="text-gray-800">المبلغ الإجمالي:</span>
                              <span className="text-gray-800 whitespace-nowrap">{order.total.toFixed(2)} ريال</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Order Items - Responsive: Mobile Cards, Desktop/Tablet Table */}
                  {isExpanded && (
                    <div className="px-3 md:px-4 lg:px-6 pb-4 md:pb-5 lg:pb-6 border-t border-gray-200">
                      <div className="pt-4">
                        <h4 className="text-sm font-semibold text-blue-600 mb-3">عناصر الطلب</h4>
                        
                        {/* Mobile View: Items as Cards */}
                        <div className="md:hidden space-y-3">
                          {order.items.map((item) => (
                            <div key={item.id} className="bg-gray-50 rounded-lg p-3">
                              <div className="flex gap-3">
                                {/* Product Image */}
                                <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                                  {item.image ? (
                                    <img 
                                      src={item.image} 
                                      alt={item.name}
                                      className="w-full h-full object-cover rounded-lg"
                                    />
                                  ) : (
                                    <span className="text-gray-400 text-xl">📦</span>
                                  )}
                                </div>

                                {/* Product Details */}
                                <div className="flex-1 min-w-0">
                                  {/* Product Name */}
                                  <h5 className="font-semibold text-gray-800 text-sm mb-1 line-clamp-2">{item.name}</h5>
                                  
                                  {/* Price and Quantity Info */}
                                  <div className="space-y-1">
                                    <div className="flex justify-between items-center">
                                      <span className="text-xs text-gray-600">السعر:</span>
                                      <span className="text-sm font-medium text-gray-800">{item.price?.toFixed(2) || '0'} ريال</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-xs text-gray-600">الكمية:</span>
                                      <span className="text-sm font-bold text-blue-600">{item.quantity}</span>
                                    </div>
                                    <div className="flex justify-between items-center border-t border-gray-200 pt-1">
                                      <span className="text-xs text-gray-800 font-medium">الإجمالي:</span>
                                      <span className="text-sm font-bold text-gray-800">
                                        {((item.quantity * (item.price || 0))).toFixed(2)} ريال
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Desktop View: Full Table with All Columns */}
                        <div className="hidden lg:block bg-gray-50 rounded-lg overflow-hidden">
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead style={{backgroundColor: '#f8f8f8'}}>
                                <tr className="text-right">
                                  <th className="px-6 py-4 text-base font-semibold text-gray-800">المنتج</th>
                                  <th className="px-6 py-4 text-base font-semibold text-gray-800 text-center">السعر</th>
                                  <th className="px-6 py-4 text-base font-semibold text-gray-800 text-center">الكمية</th>
                                  <th className="px-6 py-4 text-base font-semibold text-gray-800 text-center">الإجمالي</th>
                                  <th className="px-6 py-4 text-base font-semibold text-gray-800 text-center">ملاحظات</th>
                                  <th className="px-6 py-4 text-base font-semibold text-gray-800 text-center">الأوزان</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200">
                                {order.items.map((item, index) => (
                                  <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                                    <td className="px-6 py-4">
                                      <div className="flex gap-4 items-center">
                                        <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                                          {item.image ? (
                                            <img 
                                              src={item.image} 
                                              alt={item.name}
                                              className="w-full h-full object-cover rounded-lg"
                                            />
                                          ) : (
                                            <span className="text-gray-400 text-lg">📦</span>
                                          )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                          <h6 className="font-medium text-gray-800 text-base break-words">{item.name}</h6>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                      <span className="text-base font-medium text-gray-800">
                                        {item.price?.toFixed(2) || '0.00'} ريال
                                      </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                      <span className="inline-flex items-center justify-center w-10 h-10 bg-blue-100 text-blue-800 rounded-full text-base font-bold">
                                        {item.quantity}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                      <span className="text-base font-bold text-gray-800">
                                        {((item.quantity * (item.price || 0))).toFixed(2)} ريال
                                      </span>
                                    </td>
                                    <td className="px-6 py-4 text-center text-base text-gray-600">-</td>
                                    <td className="px-6 py-4 text-center text-base text-gray-600">-</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Tablet View: Compact Table (No Notes/Weights) */}
                        <div className="hidden md:block lg:hidden bg-gray-50 rounded-lg overflow-hidden">
                          <table className="w-full">
                            <thead style={{backgroundColor: '#f8f8f8'}}>
                              <tr className="text-right">
                                <th className="px-4 py-3 text-base font-semibold text-gray-800">المنتج</th>
                                <th className="px-4 py-3 text-base font-semibold text-gray-800 text-center">السعر</th>
                                <th className="px-4 py-3 text-base font-semibold text-gray-800 text-center">الكمية</th>
                                <th className="px-4 py-3 text-base font-semibold text-gray-800 text-center">الإجمالي</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {order.items.map((item, index) => (
                                <tr key={`tablet-${item.id}`} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                                  <td className="px-4 py-3">
                                    <div className="flex gap-3 items-center">
                                      <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                                        {item.image ? (
                                          <img 
                                            src={item.image} 
                                            alt={item.name}
                                            className="w-full h-full object-cover rounded-lg"
                                          />
                                        ) : (
                                          <span className="text-gray-400 text-sm">📦</span>
                                        )}
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <h6 className="font-medium text-gray-800 text-sm break-words line-clamp-2">{item.name}</h6>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    <span className="text-sm font-medium text-gray-800 whitespace-nowrap">
                                      {item.price?.toFixed(2) || '0.00'} ريال
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-800 rounded-full text-sm font-bold">
                                      {item.quantity}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    <span className="text-sm font-bold text-gray-800 whitespace-nowrap">
                                      {((item.quantity * (item.price || 0))).toFixed(2)} ريال
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </main>


    </div>
  );
}