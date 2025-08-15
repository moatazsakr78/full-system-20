'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

// Order interface (same as in my-orders page)
interface Order {
  id: string;
  orderId: string;
  date: string;
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'completed' | 'cancelled';
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  items: {
    id: string;
    name: string;
    quantity: number;
    price: number;
    image?: string;
    isPrepared?: boolean;
  }[];
}

const statusTranslations = {
  pending: 'معلق',
  processing: 'يتم التحضير',
  shipped: 'مع شركة الشحن',
  completed: 'مكتمل',
  cancelled: 'ملغي'
};

const statusColors = {
  pending: '#EF4444',
  processing: '#F59E0B',
  shipped: '#10B981',
  completed: '#10B981',
  cancelled: '#6B7280'
};

export default function OrderViewPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params?.id as string;
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load order from database
  useEffect(() => {
    const loadOrder = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const { supabase } = await import('../../../lib/supabase/client');
        
        // Get order with items and product details
        const { data: orderData, error: orderError } = await supabase
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
          `)
          .eq('id', orderId)
          .single();

        if (orderError) {
          console.error('Error fetching order:', orderError);
          setError('فشل في تحميل بيانات الطلب');
          return;
        }

        if (!orderData) {
          setError('الطلب غير موجود');
          return;
        }

        // Transform data
        const transformedOrder: Order = {
          id: (orderData as any).order_number,
          orderId: (orderData as any).id,
          date: (orderData as any).created_at.split('T')[0],
          total: parseFloat((orderData as any).total_amount),
          status: (orderData as any).status,
          customerName: (orderData as any).customer_name,
          customerPhone: (orderData as any).customer_phone,
          customerAddress: (orderData as any).customer_address,
          items: (orderData as any).order_items.map((item: any) => ({
            id: item.id.toString(),
            name: item.products?.name || 'منتج غير معروف',
            quantity: item.quantity,
            price: parseFloat(item.unit_price),
            image: item.products?.main_image_url || undefined,
            isPrepared: false // This could be loaded from a separate table in future
          }))
        };

        setOrder(transformedOrder);
      } catch (error) {
        console.error('Error loading order:', error);
        setError('حدث خطأ أثناء تحميل الطلب');
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      loadOrder();
    }
  }, [orderId]);

  // Get preparation progress percentage
  const getPreparationProgress = (order: Order) => {
    const preparedItems = order.items.filter(item => item.isPrepared).length;
    return Math.round((preparedItems / order.items.length) * 100);
  };

  // Toggle item preparation status (for processing orders)
  const toggleItemPreparation = (itemId: string) => {
    if (!order || order.status !== 'processing') return;
    
    setOrder(prevOrder => {
      if (!prevOrder) return null;
      return {
        ...prevOrder,
        items: prevOrder.items.map(item => 
          item.id === itemId 
            ? { ...item, isPrepared: !item.isPrepared }
            : item
        )
      };
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل الطلب...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">خطأ في التحميل</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            العودة
          </button>
        </div>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Hide any external headers or footers */}
      <style jsx global>{`
        body {
          margin: 0 !important;
          padding: 0 !important;
        }
        html {
          margin: 0 !important;
          padding: 0 !important;
        }
        /* Hide any potential external elements */
        iframe,
        .system-header,
        [class*="system"],
        [class*="navigation"],
        header:not(.order-header),
        footer {
          display: none !important;
        }
      `}</style>

      {/* Order Content - Full Screen */}
      <div className="w-full max-w-4xl mx-auto bg-white min-h-screen shadow-lg">
        {/* Order Header */}
        <div className="bg-red-600 text-white p-6 relative">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold mb-2">تحضير الطلب</h1>
              <p className="text-red-100">العميل: {order.customerName}</p>
              <p className="text-red-100">رقم الطلب: {order.id}</p>
            </div>
            <button
              onClick={() => router.back()}
              className="bg-red-700 hover:bg-red-800 px-4 py-2 rounded-lg text-sm transition-colors"
            >
              العودة إلى قائمة الطلبات
            </button>
          </div>
        </div>

        {/* Progress Bar for processing orders */}
        {order.status === 'processing' && (
          <div className="bg-white p-6 border-b border-gray-200">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold text-gray-800">تقدم التحضير</h3>
              <span className="text-lg font-bold text-gray-800">{getPreparationProgress(order)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div 
                className="bg-green-600 h-4 rounded-full transition-all duration-300" 
                style={{ width: `${getPreparationProgress(order)}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              {order.items.filter(item => item.isPrepared).length} من {order.items.length} عنصر تم تحضيره
            </p>
          </div>
        )}

        {/* Order Info */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h4 className="font-semibold text-gray-700 mb-1">حالة الطلب</h4>
              <span
                className="inline-block px-3 py-1 rounded-full text-sm font-semibold text-white"
                style={{ backgroundColor: statusColors[order.status] }}
              >
                {statusTranslations[order.status]}
              </span>
            </div>
            <div>
              <h4 className="font-semibold text-gray-700 mb-1">التاريخ</h4>
              <p className="text-gray-600">{new Date(order.date).toLocaleDateString('ar-SA')}</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-700 mb-1">الإجمالي</h4>
              <p className="text-xl font-bold text-green-600">{order.total.toFixed(2)} ريال</p>
            </div>
          </div>
        </div>

        {/* Items List */}
        <div className="p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-6">قائمة المنتجات للتحضير</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {order.items.map((item) => (
              <div 
                key={item.id} 
                className={`border rounded-lg p-4 transition-all duration-200 ${
                  item.isPrepared 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-4">
                  {/* Preparation Checkbox for processing orders */}
                  {order.status === 'processing' && (
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={item.isPrepared || false}
                        onChange={() => toggleItemPreparation(item.id)}
                        className="w-6 h-6 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
                      />
                    </div>
                  )}
                  
                  {/* Completed checkmark for non-processing orders */}
                  {order.status !== 'processing' && (
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}

                  {/* Product Image */}
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

                  {/* Product Info */}
                  <div className="flex-1">
                    <h4 className={`font-semibold ${item.isPrepared ? 'text-green-600 line-through' : 'text-gray-800'}`}>
                      {item.name}
                    </h4>
                    <p className="text-gray-600 text-sm">الكمية: {item.quantity} قطعة</p>
                    <p className="text-gray-800 font-medium">{item.price.toFixed(2)} ريال لكل قطعة</p>
                  </div>

                  {/* Item Total */}
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-800">
                      {(item.price * item.quantity).toFixed(2)} ريال
                    </p>
                    {item.isPrepared && (
                      <p className="text-sm text-green-600 font-medium">تم التحضير ✓</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center text-lg">
              <span className="font-semibold text-gray-700">الإجمالي النهائي</span>
              <span className="font-bold text-2xl text-green-600">{order.total.toFixed(2)} ريال</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}