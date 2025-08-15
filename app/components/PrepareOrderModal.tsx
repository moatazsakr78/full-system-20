'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

// Order item interface with preparation status
interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  image?: string;
  isPrepared: boolean;
  preparedBy?: string;
  preparedAt?: string;
}

// Order interface 
interface Order {
  id: string;
  customerName: string;
  customerPhone?: string;
  total: number;
  items: OrderItem[];
}

interface PrepareOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
}

export default function PrepareOrderModal({ isOpen, onClose, orderId }: PrepareOrderModalProps) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [preparationProgress, setPreparationProgress] = useState(0);

  // Load order data from database with real-time subscription
  useEffect(() => {
    if (!isOpen || !orderId) return;

    const loadOrder = async () => {
      try {
        const { supabase } = await import('../lib/supabase/client');
        
        // Get order with its items and product details
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select(`
            id,
            order_number,
            customer_name,
            customer_phone,
            total_amount,
            order_items (
              id,
              quantity,
              unit_price,
              is_prepared,
              prepared_by,
              prepared_at,
              products (
                id,
                name,
                main_image_url
              )
            )
          `)
          .eq('order_number', orderId)
          .single();

        if (orderError) {
          console.error('Error fetching order:', orderError);
          return;
        }

        // Transform data to match our Order interface
        const transformedOrder: Order = {
          id: orderData.order_number,
          customerName: orderData.customer_name || 'عميل غير محدد',
          customerPhone: orderData.customer_phone,
          total: Number(orderData.total_amount),
          items: orderData.order_items.map((item: any) => ({
            id: String(item.id),
            name: item.products?.name || 'منتج غير معروف',
            quantity: item.quantity,
            price: Number(item.unit_price),
            image: item.products?.main_image_url || undefined,
            isPrepared: item.is_prepared || false,
            preparedBy: item.prepared_by,
            preparedAt: item.prepared_at
          }))
        };

        setOrder(transformedOrder);
        setLoading(false);

        // Set up real-time subscription for order items preparation status
        const subscription = supabase
          .channel(`order_${orderId}_preparation`)
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'order_items',
              filter: `id=in.(${orderData.order_items.map((item: any) => item.id).join(',')})`
            },
            (payload) => {
              console.log('Real-time update received:', payload);
              
              // Update the specific item in real-time
              setOrder(prevOrder => {
                if (!prevOrder) return prevOrder;
                
                const updatedOrder = {
                  ...prevOrder,
                  items: prevOrder.items.map(item => {
                    if (String(item.id) === String(payload.new.id)) {
                      console.log('Updating item:', item.id, 'to prepared:', payload.new.is_prepared);
                      return {
                        ...item,
                        isPrepared: payload.new.is_prepared || false,
                        preparedBy: payload.new.prepared_by,
                        preparedAt: payload.new.prepared_at
                      };
                    }
                    return item;
                  })
                };
                
                console.log('Updated order:', updatedOrder);
                return updatedOrder;
              });
            }
          )
          .subscribe();

        console.log('Real-time subscription created for order:', orderId);

        // Cleanup subscription on unmount
        return () => {
          supabase.removeChannel(subscription);
        };

      } catch (error) {
        console.error('Error loading order:', error);
        setLoading(false);
      }
    };

    loadOrder();
  }, [isOpen, orderId]);

  // Calculate preparation progress
  useEffect(() => {
    if (order) {
      const preparedItems = order.items.filter(item => item.isPrepared).length;
      const totalItems = order.items.length;
      const progress = totalItems > 0 ? (preparedItems / totalItems) * 100 : 0;
      setPreparationProgress(progress);
    }
  }, [order]);

  // Toggle item preparation status with real-time update
  const toggleItemPreparation = async (itemId: string) => {
    if (!order) return;
    
    try {
      const { supabase } = await import('../lib/supabase/client');
      const item = order.items.find(i => i.id === itemId);
      if (!item) return;

      const newPreparedStatus = !item.isPrepared;
      const currentTime = new Date().toISOString();
      
      console.log('Toggling item preparation:', { itemId, newPreparedStatus });
      
      // Update in database with real-time sync
      const { error } = await supabase
        .from('order_items')
        .update({
          is_prepared: newPreparedStatus,
          prepared_by: newPreparedStatus ? 'current_user' : null,
          prepared_at: newPreparedStatus ? currentTime : null
        } as any)
        .eq('id', itemId);

      if (error) {
        console.error('Error updating item preparation status:', error);
        return;
      }

      // Update local state immediately for better UX
      setOrder(prevOrder => {
        if (!prevOrder) return prevOrder;
        
        return {
          ...prevOrder,
          items: prevOrder.items.map(orderItem => {
            if (orderItem.id === itemId) {
              return {
                ...orderItem,
                isPrepared: newPreparedStatus,
                preparedBy: newPreparedStatus ? 'current_user' : undefined,
                preparedAt: newPreparedStatus ? currentTime : undefined
              };
            }
            return orderItem;
          })
        };
      });
      
    } catch (error) {
      console.error('Error toggling item preparation:', error);
    }
  };

  // Complete order preparation
  const completeOrder = async () => {
    if (!order) return;
    
    try {
      const { supabase } = await import('../lib/supabase/client');
      
      // Update order status to completed
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('order_number', orderId);

      if (error) {
        console.error('Error completing order:', error);
        return;
      }

      alert('تم إكمال الطلب بنجاح!');
      onClose();
    } catch (error) {
      console.error('Error completing order:', error);
    }
  };

  if (!isOpen) return null;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gray-100 z-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل الطلب...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="fixed inset-0 bg-gray-100 z-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">طلب غير موجود</h2>
          <p className="text-gray-600 mb-4">لم يتم العثور على الطلب المطلوب</p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            إغلاق
          </button>
        </div>
      </div>
    );
  }

  const allItemsPrepared = order.items.every(item => item.isPrepared);

  return (
    <div className="fixed inset-0 bg-gray-100 z-50" dir="rtl">
      {/* Enhanced Modal Header with Customer Info */}
      <div className="bg-white border-b border-gray-200 p-6">
        {/* Top Row: Title and Close Button */}
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-800">تحضير الطلب</h1>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Progress Bar with percentage and counter */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-600">
              {order.items.filter(item => item.isPrepared).length} من {order.items.length} منتج
            </span>
            <span className="text-sm font-medium text-gray-600">
              {Math.round(preparationProgress)}% مكتمل
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                preparationProgress === 100 ? 'bg-green-500' : 'bg-yellow-500'
              }`}
              style={{ width: `${preparationProgress}%` }}
            ></div>
          </div>
        </div>

        {/* Customer Information */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-right">
            <h2 className="text-lg font-semibold text-gray-800 mb-1">العميل: {order.customerName}</h2>
            <p className="text-gray-600 text-sm">رقم الطلب: {order.id}</p>
            {order.customerPhone && (
              <p className="text-gray-600 text-sm">الهاتف: {order.customerPhone}</p>
            )}
          </div>
        </div>
      </div>

      {/* Modal Content */}
      <div className="p-6 overflow-y-auto h-[calc(100vh-200px)] scrollbar-hide">
        <div className="max-w-4xl mx-auto">

          {/* Items List */}
          <h3 className="text-lg font-semibold text-gray-800 mb-4">قائمة المنتجات للتحضير</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {order.items.map((item) => (
              <div 
                key={item.id} 
                className={`bg-white rounded-lg p-4 shadow-sm border-2 transition-all cursor-pointer ${
                  item.isPrepared 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => toggleItemPreparation(item.id)}
              >
                <div className="flex items-center gap-4">
                  {/* Product Image */}
                  <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
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

                  {/* Product Info */}
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-800">{item.name}</h4>
                    <p className="text-gray-600">الكمية: {item.quantity} قطعة</p>
                    <p className="text-gray-600">السعر الواحد: {item.price.toFixed(2)} ريال</p>
                    <p className="text-gray-600">الإجمالي: {(item.price * item.quantity).toFixed(2)} ريال</p>
                    {item.preparedBy && item.preparedAt && (
                      <p className="text-green-600 text-xs mt-1">
                        تم التحضير في: {new Date(item.preparedAt).toLocaleString('ar-SA')}
                      </p>
                    )}
                  </div>

                  {/* Preparation Status */}
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      item.isPrepared ? 'bg-green-500' : 'bg-gray-300'
                    }`}>
                      {item.isPrepared ? (
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <div className="w-3 h-3 bg-white rounded-full"></div>
                      )}
                    </div>
                    <span className={`text-xs mt-1 font-medium ${
                      item.isPrepared ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      {item.isPrepared ? 'تم التحضير' : 'لم يحضر'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Complete Order Button */}
          <div className="text-center">
            <button
              onClick={completeOrder}
              disabled={!allItemsPrepared}
              className={`px-8 py-3 rounded-lg font-semibold text-white transition-all ${
                allItemsPrepared
                  ? 'bg-green-600 hover:bg-green-700 cursor-pointer'
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
            >
              {allItemsPrepared ? (
                <>
                  <svg className="w-5 h-5 inline-block ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  إتمام الطلب
                </>
              ) : (
                'يرجى تحضير جميع المنتجات أولاً'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}