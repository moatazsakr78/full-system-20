'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { CartService } from '@/lib/cart-service';
import { CartSession, CartItemData } from '@/lib/cart-utils';

interface CustomerData {
  name: string;
  phone: string;
  altPhone: string;
  address: string;
}

const CartPage = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [cartItems, setCartItems] = useState<CartItemData[]>([]);
  const [customerData, setCustomerData] = useState<CustomerData>({
    name: '',
    phone: '',
    altPhone: '',
    address: ''
  });
  
  // Refs to prevent infinite loops
  const sessionIdRef = useRef<string>('');
  const subscriptionRef = useRef<any>(null);
  const isMountedRef = useRef(true);
  const lastLoadRef = useRef<number>(0);
  
  // Get session ID once on mount
  useEffect(() => {
    sessionIdRef.current = CartSession.getSessionId();
  }, []);
  
  // Load cart data from Supabase
  const loadCartData = useCallback(async () => {
    if (!sessionIdRef.current || !isMountedRef.current) return;
    
    // Prevent too frequent reloads (minimum 500ms between calls)
    const now = Date.now();
    if (now - lastLoadRef.current < 500) {
      return;
    }
    lastLoadRef.current = now;
    
    try {
      setIsLoading(true);
      const items = await CartService.getCartItems(sessionIdRef.current);
      
      if (isMountedRef.current) {
        setCartItems(items);
      }
    } catch (error) {
      console.error('Error loading cart data:', error);
      if (isMountedRef.current) {
        setCartItems([]);
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);
  
  // Setup real-time subscription
  const setupRealtimeSubscription = useCallback(() => {
    if (!sessionIdRef.current || subscriptionRef.current) return;
    
    subscriptionRef.current = CartService.subscribeToCartChanges(
      sessionIdRef.current,
      (payload) => {
        console.log('Cart updated in real-time:', payload.eventType);
        // Use a timeout to prevent infinite loops
        setTimeout(() => {
          if (isMountedRef.current) {
            loadCartData();
          }
        }, 100);
      }
    );
  }, [loadCartData]);
  
  // Initial load and subscription setup
  useEffect(() => {
    isMountedRef.current = true;
    
    if (sessionIdRef.current) {
      loadCartData();
      setupRealtimeSubscription();
    }
    
    // Cleanup on unmount
    return () => {
      isMountedRef.current = false;
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
    };
  }, [loadCartData, setupRealtimeSubscription]);
  
  // Handle page visibility changes to manage subscriptions
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is hidden, unsubscribe to save resources
        if (subscriptionRef.current) {
          subscriptionRef.current.unsubscribe();
          subscriptionRef.current = null;
        }
      } else {
        // Page is visible, resubscribe and refresh data
        if (!subscriptionRef.current && sessionIdRef.current) {
          setupRealtimeSubscription();
          loadCartData();
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [loadCartData, setupRealtimeSubscription]);
  
  // Calculate totals
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = 50.00;
  const total = subtotal + shipping;
  
  const handleInputChange = (field: keyof CustomerData, value: string) => {
    setCustomerData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const handleQuantityChange = async (itemId: string, newQuantity: number) => {
    try {
      if (newQuantity <= 0) {
        await handleRemoveItem(itemId);
        return;
      }
      
      const updatedItem = await CartService.updateCartItemQuantity(itemId, newQuantity);
      if (updatedItem) {
        // Real-time subscription will handle the update
        console.log('Quantity updated successfully');
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
    }
  };
  
  const handleRemoveItem = async (itemId: string) => {
    try {
      const success = await CartService.removeFromCart(itemId);
      if (success) {
        // Real-time subscription will handle the update
        console.log('Item removed successfully');
      }
    } catch (error) {
      console.error('Error removing item:', error);
    }
  };
  
  const handleClearCart = async () => {
    try {
      if (!sessionIdRef.current) return;
      
      const success = await CartService.clearCart(sessionIdRef.current);
      if (success) {
        // Real-time subscription will handle the update
        console.log('Cart cleared successfully');
      }
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
  };
  
  const handleConfirmOrder = async () => {
    try {
      if (cartItems.length === 0) {
        alert('السلة فارغة! يرجى إضافة منتجات أولاً.');
        return;
      }
      
      if (!customerData.name.trim()) {
        alert('يرجى إدخال اسم العميل');
        return;
      }
      
      if (!customerData.phone.trim()) {
        alert('يرجى إدخال رقم الهاتف');
        return;
      }
      
      if (!customerData.address.trim()) {
        alert('يرجى إدخال العنوان');
        return;
      }
      
      const orderData = {
        items: cartItems,
        customer: customerData,
        subtotal,
        shipping,
        total,
        timestamp: new Date().toISOString()
      };
      
      console.log('Order confirmed:', orderData);
      alert('تم تأكيد الطلب بنجاح! سيتم التواصل معك قريباً.');
      
      // Clear cart after confirmation
      await handleClearCart();
      
      // Redirect to homepage
      router.push('/');
    } catch (error) {
      console.error('Error confirming order:', error);
      alert('حدث خطأ أثناء تأكيد الطلب. يرجى المحاولة مرة أخرى.');
    }
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen font-['Cairo',Arial,sans-serif] flex items-center justify-center" dir="rtl" style={{backgroundColor: '#C0C0C0'}}>
        <div className="text-gray-600">جاري التحميل...</div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen font-['Cairo',Arial,sans-serif]" dir="rtl" style={{backgroundColor: '#C0C0C0'}}>
      {/* Header */}
      <header className="border-b border-gray-700 py-0 sticky top-0 z-10" style={{backgroundColor: '#661a1a'}}>
        <div className="max-w-[80%] mx-auto px-4 flex items-center justify-between min-h-[80px]">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="h-20 w-20 rounded-lg flex items-center justify-center">
                <img 
                  src="/assets/logo/El Farouk Group2.png" 
                  alt="El Farouk Group Logo" 
                  className="h-full w-full object-contain rounded-lg"
                />
              </div>
              <h1 className="text-xl font-bold text-white">El Farouk Group</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-white">ملخص الطلب</h2>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.push('/')}
              className="text-gray-300 hover:text-red-400 transition-colors font-medium flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              العودة للمتجر
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-[90%] mx-auto px-4 py-6">
        {cartItems.length === 0 ? (
          // Empty cart message
          <div className="text-center py-16">
            <div className="bg-white rounded-lg p-12 shadow-lg max-w-md mx-auto">
              <div className="text-gray-400 text-6xl mb-6">
                🛒
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">السلة فارغة</h2>
              <p className="text-gray-600 mb-8">لم تقم بإضافة أي منتجات إلى السلة بعد</p>
              <button
                onClick={() => router.push('/')}
                className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
              >
                تصفح المنتجات
              </button>
            </div>
          </div>
        ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Products list */}
          <div className="lg:col-span-2">
            <div className="bg-white border border-gray-300 rounded-lg overflow-hidden shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead style={{backgroundColor: '#f8f9fa'}}>
                    <tr>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">المنتج</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">السعر</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">الكمية</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">الإجمالي</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">ملاحظات</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">حذف</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {cartItems.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center space-x-4 space-x-reverse">
                            <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                              <img 
                                src={item.products?.main_image_url || '/placeholder-product.jpg'} 
                                alt={item.products?.name || 'منتج'}
                                className="w-full h-full object-cover rounded"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = '/placeholder-product.jpg';
                                }}
                              />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{item.products?.name || 'منتج غير معروف'}</div>
                              <div className="text-sm text-gray-500">
                                كود {item.products?.product_code || 'غير محدد'}
                                {item.selected_color && (
                                  <span className="mr-2">• اللون: {item.selected_color}</span>
                                )}
                                {item.selected_size && (
                                  <span className="mr-2">• الحجم: {item.selected_size}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center text-gray-900">
                          {item.price.toFixed(2)} ريال
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center space-x-2 space-x-reverse">
                            <button
                              onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                              className="w-7 h-7 bg-red-100 hover:bg-red-200 text-red-600 rounded-full flex items-center justify-center transition-colors font-bold"
                            >
                              <span>−</span>
                            </button>
                            <span className="w-10 text-center font-medium bg-gray-50 py-1 px-2 rounded text-black">{item.quantity}</span>
                            <button
                              onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                              className="w-7 h-7 bg-red-100 hover:bg-red-200 text-red-600 rounded-full flex items-center justify-center transition-colors font-bold"
                            >
                              <span>+</span>
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center font-semibold text-gray-900">
                          {(item.price * item.quantity).toFixed(2)} ريال
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button className="text-blue-600 hover:text-blue-800 transition-colors p-1 hover:bg-blue-50 rounded">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            className="text-red-600 hover:text-red-800 transition-colors p-1 hover:bg-red-50 rounded"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Order summary and customer data */}
          <div className="space-y-6">
            
            {/* Order summary */}
            <div className="bg-white border border-gray-300 rounded-lg p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">ملخص الطلب</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between text-gray-600">
                  <span>المجموع الفرعي:</span>
                  <span>{subtotal.toFixed(2)} ريال</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>الشحن:</span>
                  <span>{shipping.toFixed(2)} ريال</span>
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between text-lg font-semibold text-gray-900">
                    <span>الإجمالي:</span>
                    <span>{total.toFixed(2)} ريال</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Customer data */}
            <div className="bg-white border border-gray-300 rounded-lg p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">بيانات العميل</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">الاسم</label>
                  <input
                    type="text"
                    value={customerData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="أدخل اسم العميل"
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">رقم الهاتف</label>
                  <input
                    type="tel"
                    value={customerData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="أدخل رقم الهاتف"
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">رقم هاتف آخر (اختياري)</label>
                  <input
                    type="tel"
                    value={customerData.altPhone}
                    onChange={(e) => handleInputChange('altPhone', e.target.value)}
                    placeholder="أدخل رقم هاتف آخر"
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">العنوان</label>
                  <textarea
                    value={customerData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="أدخل عنوان التوصيل"
                    rows={3}
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="space-y-3">
              <button
                onClick={handleConfirmOrder}
                disabled={cartItems.length === 0}
                className={`w-full font-semibold py-4 px-6 rounded-lg transition-colors duration-200 ${
                  cartItems.length === 0
                    ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                    : 'text-white hover:opacity-90'
                }`}
                style={cartItems.length > 0 ? {backgroundColor: '#661a1a'} : {}}
              >
                تأكيد الطلب ({cartItems.length} منتج)
              </button>
              
              <button
                onClick={handleClearCart}
                disabled={cartItems.length === 0}
                className={`w-full font-semibold py-4 px-6 rounded-lg transition-colors duration-200 ${
                  cartItems.length === 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-600 hover:bg-gray-700 text-white'
                }`}
              >
                مسح السلة
              </button>
            </div>
          </div>
        </div>
        )}
      </div>
    </div>
  );
};

export default CartPage;