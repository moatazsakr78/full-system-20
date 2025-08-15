'use client';

import { useState, useEffect } from 'react';
import PrepareOrderModal from '../../components/PrepareOrderModal';

// Order status type
type OrderStatus = 'pending' | 'processing' | 'shipped' | 'completed' | 'cancelled';

// Order interface with customer info
interface Order {
  id: string;
  date: string;
  total: number;
  status: OrderStatus;
  customerName: string;
  customerPhone?: string;
  customerAddress?: string;
  items: {
    id: string;
    name: string;
    quantity: number;
    price: number;
    image?: string;
    isPrepared?: boolean;
  }[];
  preparationProgress?: number;
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

export default function CustomerOrdersPage() {
  const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending');
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedOrderForProcessing, setSelectedOrderForProcessing] = useState<string | null>(null);
  const [showPrepareModal, setShowPrepareModal] = useState(false);
  const [selectedOrderForPreparation, setSelectedOrderForPreparation] = useState<string | null>(null);

  // Load orders from database
  useEffect(() => {
    const loadOrders = async () => {
      try {
        const { supabase } = await import('../../lib/supabase/client');
        
        // Get all orders with their items and product details for all customers
        const { data: ordersData, error: ordersError } = await supabase
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
              is_prepared,
              products (
                id,
                name,
                main_image_url
              )
            )
          `)
          .order('created_at', { ascending: false });

        if (ordersError) {
          console.error('Error fetching orders:', ordersError);
          return;
        }

        // Transform data to match our Order interface and filter out orders with no items
        const transformedOrders: Order[] = (ordersData || [])
          .filter((order: any) => order.order_items && order.order_items.length > 0) // Filter out empty orders
          .map((order: any) => {
            const items = order.order_items.map((item: any) => ({
              id: item.id.toString(),
              name: item.products?.name || 'منتج غير معروف',
              quantity: item.quantity,
              price: parseFloat(item.unit_price),
              image: item.products?.main_image_url || undefined,
              isPrepared: item.is_prepared || false
            }));

            // Calculate preparation progress
            const preparedItems = items.filter((item: { isPrepared: boolean }) => item.isPrepared).length;
            const totalItems = items.length;
            const preparationProgress = totalItems > 0 ? (preparedItems / totalItems) * 100 : 0;

            return {
              id: order.order_number,
              date: order.created_at.split('T')[0], // Extract date part
              total: parseFloat(order.total_amount),
              status: order.status,
              customerName: order.customer_name || 'عميل غير محدد',
              customerPhone: order.customer_phone,
              customerAddress: order.customer_address,
              items,
              preparationProgress
            };
          });

        setOrders(transformedOrders);
        setLoading(false);

        // Set up real-time subscription for order items preparation status
        const subscription = supabase
          .channel('order_items_preparation_updates')
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'order_items'
            },
            (payload) => {
              console.log('Real-time preparation update received:', payload);
              
              // Update the specific order's progress
              setOrders(prevOrders => {
                return prevOrders.map(order => {
                  // Find if this order contains the updated item
                  const updatedItemIndex = order.items.findIndex(item => 
                    String(item.id) === String(payload.new.id)
                  );
                  
                  if (updatedItemIndex !== -1) {
                    // Update the item's preparation status
                    const updatedItems = [...order.items];
                    updatedItems[updatedItemIndex] = {
                      ...updatedItems[updatedItemIndex],
                      isPrepared: payload.new.is_prepared || false
                    };
                    
                    // Recalculate progress
                    const preparedItems = updatedItems.filter(item => item.isPrepared).length;
                    const totalItems = updatedItems.length;
                    const preparationProgress = totalItems > 0 ? (preparedItems / totalItems) * 100 : 0;
                    
                    return {
                      ...order,
                      items: updatedItems,
                      preparationProgress
                    };
                  }
                  
                  return order;
                });
              });
            }
          )
          .subscribe();

        // Cleanup subscription on unmount
        return () => {
          supabase.removeChannel(subscription);
        };

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
    if (activeTab === 'pending') {
      filtered = orders.filter(order => ['pending', 'processing'].includes(order.status));
    } else {
      filtered = orders.filter(order => ['completed', 'shipped', 'cancelled'].includes(order.status));
    }

    // Filter by date range for both tabs
    if (dateFrom || dateTo) {
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
      // Auto-expand pending orders in pending tab only
      if (activeTab === 'pending' && ['pending', 'processing'].includes(order.status)) {
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

  // Handle start preparation button click
  const handleStartPreparation = (orderId: string) => {
    setSelectedOrderForProcessing(orderId);
    setShowConfirmModal(true);
  };

  // Confirm start preparation
  const confirmStartPreparation = async () => {
    if (!selectedOrderForProcessing) return;
    
    // Update order status
    await updateOrderStatus(selectedOrderForProcessing, 'processing');
    
    // Close modal
    setShowConfirmModal(false);
    setSelectedOrderForProcessing(null);
  };

  // Handle preparation page button click
  const handlePreparationPage = (orderId: string) => {
    setSelectedOrderForPreparation(orderId);
    setShowPrepareModal(true);
  };

  // Close prepare modal
  const closePrepareModal = () => {
    setShowPrepareModal(false);
    setSelectedOrderForPreparation(null);
  };

  // Update order status
  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const { supabase } = await import('../../lib/supabase/client');
      
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('order_number', orderId);

      if (error) {
        console.error('Error updating order status:', error);
        return;
      }

      // Update local state
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId 
            ? { ...order, status: newStatus }
            : order
        )
      );
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{backgroundColor: '#c0c0c0'}}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{borderBottomColor: '#5D1F1F'}}></div>
          <p className="text-gray-600">جاري تحميل طلبات العملاء...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-gray-800" style={{backgroundColor: '#c0c0c0'}}>

      {/* Store Header (Red) */}
      <header className="border-b border-gray-700 py-0 relative z-40" style={{backgroundColor: '#5d1f1f'}}>
        <div className="relative flex items-center min-h-[80px]">
          <div className="max-w-[80%] mx-auto px-4 flex items-center justify-between min-h-[80px] w-full">
            <div className="flex items-center gap-8">
              <button
                onClick={() => window.history.back()}
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
        </div>

        {/* Date Filter (for both tabs) */}
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

        {/* Orders List */}
        <div className="space-y-4">
          {filteredOrders.length === 0 ? (
            <div className="bg-white rounded-lg p-8 shadow-lg text-center">
              <div className="text-gray-400 text-6xl mb-4">📦</div>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                {activeTab === 'pending' ? 'لا توجد طلبات قيد التنفيذ' : 'لا توجد طلبات منفذة'}
              </h3>
              <p className="text-gray-500">
                {activeTab === 'pending' 
                  ? 'جميع الطلبات مكتملة' 
                  : 'لم يتم تنفيذ أي طلبات بعد'
                }
              </p>
            </div>
          ) : (
            filteredOrders.map((order) => {
              const isExpanded = expandedOrders.has(order.id);
              return (
                <div key={order.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
                  {/* Action Buttons */}
                  <div className="px-6 pt-4">
                    <div className="flex gap-3">
                      {/* Start Preparation Button - Only for pending orders */}
                      {order.status === 'pending' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartPreparation(order.id);
                          }}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          بدء التحضير
                        </button>
                      )}
                      
                      {/* Preparation Page Button - Only for processing orders */}
                      {order.status === 'processing' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePreparationPage(order.id);
                          }}
                          className="inline-flex items-center gap-2 px-4 py-2 text-white text-sm font-medium rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                          style={{ backgroundColor: '#F59E0B' }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#D97706';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#F59E0B';
                          }}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                          </svg>
                          صفحة التحضير
                        </button>
                      )}
                    </div>
                  </div>


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
                        <p className="text-blue-600 font-medium">العميل: {order.customerName}</p>
                        {order.customerPhone && (
                          <p className="text-gray-500 text-sm">الهاتف: {order.customerPhone}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-left">
                      <p className="text-xl font-bold text-gray-800 mb-2">{order.total.toFixed(2)} ريال</p>
                      <span
                        className="inline-block px-3 py-1 rounded-full text-sm font-semibold text-white"
                        style={{ backgroundColor: statusColors[order.status] }}
                      >
                        {statusTranslations[order.status]}
                      </span>
                      
                      {/* Progress Bar at the top - Only for processing orders */}
                      {order.status === 'processing' && order.preparationProgress !== undefined && (
                        <div className="mt-3 min-w-[250px]">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-medium text-gray-600">
                              {order.items.filter(item => item.isPrepared).length}/{order.items.length}
                            </span>
                            <span className="text-xs font-medium text-gray-600">
                              {Math.round(order.preparationProgress)}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div 
                              className={`h-1.5 rounded-full transition-all duration-300 ${
                                order.preparationProgress === 100 ? 'bg-green-500' : 'bg-yellow-500'
                              }`}
                              style={{ width: `${order.preparationProgress}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Order Items - Collapsible */}
                  {isExpanded && (
                    <div className="px-6 pb-6 border-t border-gray-200">
                      {/* Customer Address */}
                      {order.customerAddress && (
                        <div className="pt-4 pb-2">
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">العنوان:</span> {order.customerAddress}
                          </p>
                        </div>
                      )}
                      
                      {/* Order Items */}
                      <div className="pt-4 space-y-3">
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
                  )}
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">تأكيد بدء التحضير</h3>
            <p className="text-gray-600 mb-6">هل أنت متأكد أنك تريد تفعيل وضع التحضير لهذا الطلب؟</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setSelectedOrderForProcessing(null);
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={confirmStartPreparation}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                نعم، بدء التحضير
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Prepare Order Modal */}
      {showPrepareModal && selectedOrderForPreparation && (
        <PrepareOrderModal
          isOpen={showPrepareModal}
          onClose={closePrepareModal}
          orderId={selectedOrderForPreparation}
        />
      )}
    </div>
  );
}