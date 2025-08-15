'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Order status type
type OrderStatus = 'pending' | 'processing' | 'shipped' | 'completed' | 'cancelled';

// Order interface
interface Order {
  id: string;
  orderId: string; // Added database ID
  date: string;
  total: number;
  status: OrderStatus;
  items: {
    id: string;
    name: string;
    quantity: number;
    price: number;
    image?: string;
    isPrepared?: boolean; // Added for preparation tracking
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
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  
  // New state for preparation mode
  const [showStartPreparationModal, setShowStartPreparationModal] = useState(false);
  const [showCompletePreparationModal, setShowCompletePreparationModal] = useState(false);
  const [selectedOrderForAction, setSelectedOrderForAction] = useState<Order | null>(null);

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
            status,
            notes,
            created_at,
            order_items (
              id,
              quantity,
              unit_price,
              products (
                id,
                name,
                main_image_url
              )
            )
          `);
          
        // If user is logged in, filter by user ID, otherwise show orders for current session
        if (user?.id) {
          query = query.eq('customer_id', user.id);
        } else {
          // For non-logged in users, we could use session storage to track their orders
          // For now, we'll show no orders unless they're logged in
          query = query.eq('customer_id', 'no-user-logged-in');
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
          .map((order: any) => ({
            id: order.order_number,
            orderId: order.id, // Store database ID
            date: order.created_at.split('T')[0], // Extract date part
            total: parseFloat(order.total_amount),
            status: order.status,
            items: order.order_items.map((item: any) => ({
              id: item.id.toString(),
              name: item.products?.name || 'منتج غير معروف',
              quantity: item.quantity,
              price: parseFloat(item.unit_price),
              image: item.products?.main_image_url || undefined,
              isPrepared: false // Initialize as not prepared
            }))
          }));

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
    
    // Set default expanded state for orders
    const newExpandedOrders = new Set<string>();
    filtered.forEach(order => {
      // Auto-expand non-completed orders (pending, processing, shipped)
      if (order.status !== 'completed') {
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

  // Start preparation of an order
  const handleStartPreparation = async (order: Order) => {
    try {
      const { supabase } = await import('../../lib/supabase/client');
      
      const { error } = await supabase
        .from('orders')
        .update({ status: 'processing' } as any)
        .eq('id', order.orderId);

      if (error) {
        console.error('Error updating order status:', error);
        return;
      }

      // Update local state
      setOrders(prevOrders => 
        prevOrders.map(o => 
          o.orderId === order.orderId 
            ? { ...o, status: 'processing' as OrderStatus }
            : o
        )
      );

      setShowStartPreparationModal(false);
      setSelectedOrderForAction(null);
    } catch (error) {
      console.error('Error starting preparation:', error);
    }
  };

  // Complete preparation of an order
  const handleCompletePreparation = async (order: Order) => {
    try {
      const { supabase } = await import('../../lib/supabase/client');
      
      const { error } = await supabase
        .from('orders')
        .update({ status: 'completed' } as any)
        .eq('id', order.orderId);

      if (error) {
        console.error('Error updating order status:', error);
        return;
      }

      // Update local state
      setOrders(prevOrders => 
        prevOrders.map(o => 
          o.orderId === order.orderId 
            ? { ...o, status: 'completed' as OrderStatus }
            : o
        )
      );

      setShowCompletePreparationModal(false);
      setSelectedOrderForAction(null);
    } catch (error) {
      console.error('Error completing preparation:', error);
    }
  };

  // Toggle item preparation status
  const toggleItemPreparation = (orderId: string, itemId: string) => {
    setOrders(prevOrders => 
      prevOrders.map(order => 
        order.orderId === orderId 
          ? {
              ...order,
              items: order.items.map(item => 
                item.id === itemId 
                  ? { ...item, isPrepared: !item.isPrepared }
                  : item
              )
            }
          : order
      )
    );
  };

  // Check if all items in an order are prepared
  const areAllItemsPrepared = (order: Order) => {
    return order.items.every(item => item.isPrepared);
  };

  // Get preparation progress percentage
  const getPreparationProgress = (order: Order) => {
    const preparedItems = order.items.filter(item => item.isPrepared).length;
    return Math.round((preparedItems / order.items.length) * 100);
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
                  {/* Order Header - Always Visible */}
                  <div 
                    className="flex justify-between items-center p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => toggleOrderExpansion(order.id)}
                  >
                    <div className="flex items-center gap-4">
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
                      
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">طلب رقم: {order.id}</h3>
                        <p className="text-gray-600">التاريخ: {new Date(order.date).toLocaleDateString('ar-SA')}</p>
                      </div>
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

                  {/* Order Items - Collapsible */}
                  {isExpanded && (
                    <div className="px-6 pb-6 border-t border-gray-200">
                      {/* Preparation Progress Bar for processing orders */}
                      {order.status === 'processing' && (
                        <div className="pt-4 pb-3">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-gray-700">تقدم التحضير</span>
                            <span className="text-sm font-medium text-gray-700">{getPreparationProgress(order)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div 
                              className="bg-green-600 h-3 rounded-full transition-all duration-300" 
                              style={{ width: `${getPreparationProgress(order)}%` }}
                            ></div>
                          </div>
                        </div>
                      )}

                      <div className="pt-4 space-y-3">
                        {order.items.map((item) => (
                          <div key={item.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                            {/* Preparation Checkbox for processing orders */}
                            {order.status === 'processing' && (
                              <div className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={item.isPrepared || false}
                                  onChange={() => toggleItemPreparation(order.orderId, item.id)}
                                  className="w-5 h-5 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
                                />
                              </div>
                            )}
                            
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
                              <h4 className={`font-semibold ${item.isPrepared ? 'text-green-600 line-through' : 'text-gray-800'}`}>
                                {item.name}
                              </h4>
                              <p className="text-gray-600">الكمية: {item.quantity}</p>
                            </div>
                            <div className="text-left">
                              <p className="font-semibold text-gray-800">{(item.price * item.quantity).toFixed(2)} ريال</p>
                              <p className="text-sm text-gray-500">{item.price.toFixed(2)} ريال لكل قطعة</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Action Buttons */}
                      <div className="pt-4 border-t border-gray-200 mt-4 flex gap-3 justify-end">
                        {/* Start Preparation Button - Only for pending orders */}
                        {order.status === 'pending' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedOrderForAction(order);
                              setShowStartPreparationModal(true);
                            }}
                            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors text-sm font-medium"
                          >
                            بدء التحضير
                          </button>
                        )}

                        {/* Complete Preparation Button - Only for processing orders with all items prepared */}
                        {order.status === 'processing' && areAllItemsPrepared(order) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedOrderForAction(order);
                              setShowCompletePreparationModal(true);
                            }}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-medium"
                          >
                            تم التحضير
                          </button>
                        )}

                        {/* View Order Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/order-view/${order.orderId}`);
                          }}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
                        >
                          عرض الطلب
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* Start Preparation Confirmation Modal */}
      {showStartPreparationModal && selectedOrderForAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">تأكيد بدء التحضير</h3>
            <p className="text-gray-600 mb-6">
              هل أنت متأكد أنك تريد تفعيل وضع التحضير للطلب رقم: {selectedOrderForAction.id}؟
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowStartPreparationModal(false);
                  setSelectedOrderForAction(null);
                }}
                className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={() => handleStartPreparation(selectedOrderForAction)}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
              >
                نعم، ابدأ التحضير
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Complete Preparation Confirmation Modal */}
      {showCompletePreparationModal && selectedOrderForAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">تأكيد إتمام التحضير</h3>
            <p className="text-gray-600 mb-6">
              هل أنت متأكد أنه تم تحضير الطلب؟ سيتم تحويله إلى "تم التحضير"
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowCompletePreparationModal(false);
                  setSelectedOrderForAction(null);
                }}
                className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={() => handleCompletePreparation(selectedOrderForAction)}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                نعم، تم التحضير
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}