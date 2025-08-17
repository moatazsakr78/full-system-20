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

interface ShippingCompany {
  id: string;
  name: string;
  status: string;
}

interface ShippingGovernorate {
  id: string;
  name: string;
  type: 'simple' | 'complex';
  price?: number;
  areas?: ShippingArea[];
}

interface ShippingArea {
  id: string;
  name: string;
  price: number;
}

type DeliveryMethod = 'pickup' | 'delivery';

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CartModal = ({ isOpen, onClose }: CartModalProps) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [cartItems, setCartItems] = useState<CartItemData[]>([]);
  const [customerData, setCustomerData] = useState<CustomerData>({
    name: '',
    phone: '',
    altPhone: '',
    address: ''
  });
  
  // Delivery and shipping states
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('pickup');
  const [shippingCompanies, setShippingCompanies] = useState<ShippingCompany[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [governorates, setGovernorates] = useState<ShippingGovernorate[]>([]);
  const [selectedGovernorate, setSelectedGovernorate] = useState<string>('');
  const [selectedArea, setSelectedArea] = useState<string>('');
  const [shippingCost, setShippingCost] = useState<number>(0);
  
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
    if (isOpen) {
      isMountedRef.current = true;
      
      if (sessionIdRef.current) {
        loadCartData();
        setupRealtimeSubscription();
      }
    }
    
    // Cleanup on unmount or close
    return () => {
      isMountedRef.current = false;
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
    };
  }, [isOpen, loadCartData, setupRealtimeSubscription]);

  // Handle page visibility changes to manage subscriptions
  useEffect(() => {
    if (!isOpen) return;
    
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
  }, [isOpen, loadCartData, setupRealtimeSubscription]);

  // Load shipping companies
  const loadShippingCompanies = useCallback(async () => {
    try {
      const { data, error } = await (CartService.supabase as any)
        .from('shipping_companies')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setShippingCompanies((data as any) || []);
      
      // If only one company, auto-select it
      if (data && data.length === 1) {
        setSelectedCompany(data[0].id);
        loadGovernorates(data[0].id);
      }
    } catch (error) {
      console.error('Error loading shipping companies:', error);
      setShippingCompanies([]);
    }
  }, []);

  // Load shipping companies on mount
  useEffect(() => {
    if (isOpen) {
      loadShippingCompanies();
    }
  }, [isOpen, loadShippingCompanies]);

  // Load governorates for selected company
  const loadGovernorates = useCallback(async (companyId: string) => {
    if (!companyId) {
      setGovernorates([]);
      return;
    }

    try {
      const { data, error } = await (CartService.supabase as any)
        .from('shipping_governorates')
        .select(`
          *,
          shipping_areas (
            id,
            name,
            price
          )
        `)
        .eq('shipping_company_id', companyId)
        .order('name', { ascending: true });
      
      if (error) throw error;
      
      const transformedGovernorates = (data as any).map((gov: any) => ({
        id: gov.id,
        name: gov.name,
        type: gov.type as 'simple' | 'complex',
        price: gov.price,
        areas: gov.shipping_areas?.map((area: any) => ({
          id: area.id,
          name: area.name,
          price: area.price
        })) || []
      }));
      
      setGovernorates(transformedGovernorates);
    } catch (error) {
      console.error('Error loading governorates:', error);
      setGovernorates([]);
    }
  }, []);

  // Handle delivery method change
  const handleDeliveryMethodChange = (method: DeliveryMethod) => {
    setDeliveryMethod(method);
    if (method === 'pickup') {
      setShippingCost(0);
      setSelectedCompany('');
      setSelectedGovernorate('');
      setSelectedArea('');
      // Clear address since it's not needed for pickup
      setCustomerData(prev => ({ ...prev, address: '' }));
    } else if (method === 'delivery') {
      // If only one company, auto-select it
      if (shippingCompanies.length === 1) {
        setSelectedCompany(shippingCompanies[0].id);
        loadGovernorates(shippingCompanies[0].id);
      }
    }
  };

  // Handle company selection
  const handleCompanySelect = (companyId: string) => {
    setSelectedCompany(companyId);
    setSelectedGovernorate('');
    setSelectedArea('');
    setShippingCost(0);
    loadGovernorates(companyId);
  };

  // Handle governorate selection
  const handleGovernorateSelect = (governorateId: string) => {
    setSelectedGovernorate(governorateId);
    setSelectedArea('');
    
    const governorate = governorates.find(g => g.id === governorateId);
    if (governorate) {
      if (governorate.type === 'simple') {
        setShippingCost(governorate.price || 0);
      } else {
        setShippingCost(0); // Will be set when area is selected
      }
    }
  };

  // Handle area selection
  const handleAreaSelect = (areaId: string) => {
    setSelectedArea(areaId);
    
    const governorate = governorates.find(g => g.id === selectedGovernorate);
    const area = governorate?.areas?.find(a => a.id === areaId);
    if (area) {
      setShippingCost(area.price);
    }
  };
  
  // Group cart items by product_id
  const groupedCartItems = cartItems.reduce((groups, item) => {
    const key = item.product_id;
    if (!groups[key]) {
      groups[key] = {
        product: item.products,
        items: []
      };
    }
    groups[key].items.push(item);
    return groups;
  }, {} as Record<string, { product: any; items: CartItemData[] }>);


  // Calculate totals
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = deliveryMethod === 'pickup' ? 0 : shippingCost;
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
      
      // Optimistic UI update - update quantity immediately
      setCartItems(prevItems => 
        prevItems.map(item => 
          item.id === itemId 
            ? { ...item, quantity: newQuantity }
            : item
        )
      );
      
      const updatedItem = await CartService.updateCartItemQuantity(itemId, newQuantity);
      if (updatedItem) {
        console.log('Quantity updated successfully');
      } else {
        // If update failed, restore the cart data
        loadCartData();
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
      // If update failed, restore the cart data
      loadCartData();
    }
  };
  
  const handleRemoveItem = async (itemId: string) => {
    try {
      // Optimistic UI update - remove item immediately from local state
      setCartItems(prevItems => prevItems.filter(item => item.id !== itemId));
      
      const success = await CartService.removeFromCart(itemId);
      if (success) {
        console.log('Item removed successfully');
      } else {
        // If deletion failed, restore the item
        loadCartData();
      }
    } catch (error) {
      console.error('Error removing item:', error);
      // If deletion failed, restore the cart data
      loadCartData();
    }
  };
  
  const handleClearCart = async () => {
    try {
      if (!sessionIdRef.current) return;
      
      // Optimistic UI update - clear cart immediately from local state
      setCartItems([]);
      
      const success = await CartService.clearCart(sessionIdRef.current);
      if (success) {
        console.log('Cart cleared successfully');
      } else {
        // If clearing failed, restore the cart data
        loadCartData();
      }
    } catch (error) {
      console.error('Error clearing cart:', error);
      // If clearing failed, restore the cart data
      loadCartData();
    }
  };
  
  // Save order to database
  const saveOrderToDatabase = async (orderData: any) => {
    try {
      const { supabase } = await import('../lib/supabase/client');
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      // Generate order number
      const orderNumber = 'ORD-' + Date.now().toString().slice(-8);
      
      // Generate a session identifier for non-registered users
      let userSession = null;
      if (!user?.id) {
        // For non-registered users, create a session identifier
        userSession = 'guest_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      }
      
      // Find or create customer in customers table
      let customerId = null;
      if (user?.id) {
        // Check if customer already exists for this user
        const { data: existingCustomer, error: customerCheckError } = await supabase
          .from('customers')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (customerCheckError && customerCheckError.code !== 'PGRST116') {
          // Error other than "not found"
          console.error('Error checking existing customer:', customerCheckError);
        }

        if (existingCustomer) {
          // Customer exists, update their information
          customerId = existingCustomer.id;
          const { error: updateError } = await supabase
            .from('customers')
            .update({
              name: orderData.customer.name,
              phone: orderData.customer.phone,
              address: orderData.customer.address,
              email: user.email,
              updated_at: new Date().toISOString()
            })
            .eq('id', customerId);

          if (updateError) {
            console.error('Error updating customer:', updateError);
          }
        } else {
          // Customer doesn't exist, create new one
          const { data: newCustomer, error: createCustomerError } = await supabase
            .from('customers')
            .insert({
              user_id: user.id,
              name: orderData.customer.name,
              phone: orderData.customer.phone,
              address: orderData.customer.address,
              email: user.email,
              is_active: true,
              loyalty_points: 0,
              account_balance: 0,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .select('id')
            .single();

          if (createCustomerError) {
            console.error('Error creating customer:', createCustomerError);
          } else {
            customerId = newCustomer.id;
          }
        }
      }
      
      // Insert order into orders table
      const { data: orderResult, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          customer_id: customerId,
          user_id: user?.id || null,
          user_session: userSession,
          customer_name: orderData.customer.name,
          customer_phone: orderData.customer.phone,
          customer_address: orderData.customer.address,
          total_amount: orderData.total,
          status: 'pending',
          notes: `الشحن: ${orderData.delivery_method === 'delivery' ? 'توصيل' : 'استلام من المتجر'}${orderData.shipping_details ? ` - ${orderData.shipping_details.company_name} - ${orderData.shipping_details.governorate_name}${orderData.shipping_details.area_name ? ` - ${orderData.shipping_details.area_name}` : ''}` : ''}`
        })
        .select('id')
        .single();

      if (orderError) {
        console.error('Error creating order:', orderError);
        throw orderError;
      }

      // Insert order items
      const orderItems = orderData.items.map((item: CartItemData) => ({
        order_id: orderResult.id,
        product_id: item.product_id, // Use product_id instead of item.id
        quantity: item.quantity,
        unit_price: item.price
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        console.error('Error creating order items:', itemsError);
        // If order items failed, delete the order to keep data consistent
        await supabase.from('orders').delete().eq('id', orderResult.id);
        throw itemsError;
      }

      console.log('Order saved successfully with ID:', orderResult.id);
      
    } catch (error) {
      console.error('Error saving order to database:', error);
      throw error;
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
      
      // Only require address for delivery method
      if (deliveryMethod === 'delivery' && !customerData.address.trim()) {
        alert('يرجى إدخال العنوان');
        return;
      }
      
      // Validate delivery method requirements
      if (deliveryMethod === 'delivery') {
        if (shippingCompanies.length > 1 && !selectedCompany) {
          alert('يرجى اختيار شركة الشحن');
          return;
        }
        
        if (!selectedGovernorate) {
          alert('يرجى اختيار المحافظة');
          return;
        }
        
        const selectedGov = governorates.find(g => g.id === selectedGovernorate);
        if (selectedGov?.type === 'complex' && !selectedArea) {
          alert('يرجى اختيار المنطقة');
          return;
        }
        
        if (shippingCost === 0) {
          alert('لم يتم تحديد تكلفة الشحن. يرجى اختيار المنطقة.');
          return;
        }
      }
      
      // Prepare shipping details
      let shippingDetails = null;
      if (deliveryMethod === 'delivery') {
        const selectedGov = governorates.find(g => g.id === selectedGovernorate);
        const selectedAreaData = selectedGov?.areas?.find(a => a.id === selectedArea);
        
        shippingDetails = {
          company_id: selectedCompany || (shippingCompanies.length === 1 ? shippingCompanies[0].id : null),
          company_name: shippingCompanies.find(c => c.id === (selectedCompany || shippingCompanies[0]?.id))?.name,
          governorate_id: selectedGovernorate,
          governorate_name: selectedGov?.name,
          governorate_type: selectedGov?.type,
          area_id: selectedArea || null,
          area_name: selectedAreaData?.name || null,
          shipping_cost: shippingCost
        };
      }
      
      const orderData = {
        items: cartItems,
        customer: customerData,
        delivery_method: deliveryMethod,
        shipping_details: shippingDetails,
        subtotal,
        shipping,
        total,
        timestamp: new Date().toISOString()
      };
      
      console.log('Order confirmed:', orderData);
      
      // Save order to database
      await saveOrderToDatabase(orderData);
      
      alert('تم تأكيد الطلب بنجاح! سيتم التواصل معك قريباً.');
      
      // Clear cart after confirmation
      await handleClearCart();
      
      // Close modal and redirect to homepage
      onClose();
      router.push('/');
    } catch (error) {
      console.error('Error confirming order:', error);
      alert('حدث خطأ أثناء تأكيد الطلب. يرجى المحاولة مرة أخرى.');
    }
  };
  
  if (!isOpen) return null;
  
  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center" style={{backgroundColor: '#C0C0C0'}}>
        <div className="text-gray-600">جاري التحميل...</div>
      </div>
    );
  }
  
  return (
    <>
      <style jsx>{`
        select option {
          color: #111827 !important;
          background-color: #ffffff !important;
        }
        select {
          color: #111827 !important;
          background-color: #ffffff !important;
        }
        input {
          color: #111827 !important;
          background-color: #ffffff !important;
        }
        textarea {
          color: #111827 !important;
          background-color: #ffffff !important;
        }
        input::placeholder {
          color: #6B7280 !important;
        }
        textarea::placeholder {
          color: #6B7280 !important;
        }
      `}</style>
      <div className="fixed inset-0 z-50 font-['Cairo',Arial,sans-serif]" dir="rtl" style={{backgroundColor: '#C0C0C0'}}>
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
              onClick={onClose}
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

      <div className="max-w-[90%] mx-auto px-4 py-6 h-[calc(100vh-80px)] overflow-y-auto">
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
                onClick={onClose}
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
                    {Object.values(groupedCartItems).map((group) => {
                      const productTotal = group.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                      const totalQuantity = group.items.reduce((sum, item) => sum + item.quantity, 0);
                      
                      // Group items by color
                      const colorGroups = group.items.reduce((colors, item) => {
                        const colorKey = item.selected_color || 'بدون لون';
                        if (!colors[colorKey]) {
                          colors[colorKey] = { items: [], totalQuantity: 0 };
                        }
                        colors[colorKey].items.push(item);
                        colors[colorKey].totalQuantity += item.quantity;
                        return colors;
                      }, {} as Record<string, { items: CartItemData[]; totalQuantity: number }>);

                      return (
                        <tr key={group.product?.id || group.items[0]?.product_id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center space-x-4 space-x-reverse">
                              <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                                <img 
                                  src={group.product?.main_image_url || '/placeholder-product.svg'} 
                                  alt={group.product?.name || 'منتج'}
                                  className="w-full h-full object-cover rounded"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    if (target.src !== '/placeholder-product.svg') {
                                      target.src = '/placeholder-product.svg';
                                    }
                                  }}
                                />
                              </div>
                              <div>
                                <div className="font-medium text-gray-900">{group.product?.name || 'منتج غير معروف'}</div>
                                <div className="text-sm text-gray-500 mb-2">
                                  كود {group.product?.product_code || 'غير محدد'}
                                </div>
                                {/* Color tags with quantities - only show if there are actual colors */}
                                {Object.keys(colorGroups).some(colorName => colorName !== 'بدون لون') && (
                                  <div className="flex flex-wrap gap-1">
                                    {Object.entries(colorGroups).map(([colorName, colorGroup]) => {
                                      // Skip "بدون لون" entries
                                      if (colorName === 'بدون لون') return null;
                                      
                                      return (
                                        <span
                                          key={colorName}
                                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200"
                                        >
                                          {colorName} ({colorGroup.totalQuantity})
                                        </span>
                                      );
                                    })}
                                  </div>
                                )}
                                {/* Show sizes if any */}
                                {group.items.some(item => item.selected_size) && (
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {Array.from(new Set(group.items.filter(item => item.selected_size).map(item => item.selected_size))).map(size => (
                                      <span key={size} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                                        📏 {size}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center text-gray-900">
                            {group.items[0].price.toFixed(2)} ريال
                          </td>
                          <td className="px-4 py-3 text-center font-medium text-gray-900">
                            {totalQuantity}
                          </td>
                          <td className="px-4 py-3 text-center font-semibold text-gray-900">
                            {productTotal.toFixed(2)} ريال
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
                              onClick={() => {
                                // Remove all items of this product
                                group.items.forEach(item => handleRemoveItem(item.id));
                              }}
                              className="text-red-600 hover:text-red-800 transition-colors p-1 hover:bg-red-50 rounded"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Order summary and customer data */}
          <div className="space-y-6">
            
            {/* Delivery Method Selection */}
            <div className="bg-white border border-gray-300 rounded-lg p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">طريقة استلام الطلب</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Pickup Option */}
                <button
                  onClick={() => handleDeliveryMethodChange('pickup')}
                  className={`p-4 rounded-lg border-2 transition-all text-right ${
                    deliveryMethod === 'pickup'
                      ? 'bg-green-50 border-green-500 text-green-700'
                      : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xl mb-2">🏪</div>
                      <div className="font-bold text-lg">حجز واستلام</div>
                      <div className="text-sm mt-1">استلام من المتجر</div>
                      <div className="text-sm text-green-600 font-medium mt-1">مجاناً</div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 ${
                      deliveryMethod === 'pickup'
                        ? 'bg-green-500 border-green-500'
                        : 'border-gray-300'
                    }`}>
                      {deliveryMethod === 'pickup' && (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
                </button>

                {/* Delivery Option */}
                <button
                  onClick={() => handleDeliveryMethodChange('delivery')}
                  className={`p-4 rounded-lg border-2 transition-all text-right ${
                    deliveryMethod === 'delivery'
                      ? 'bg-blue-50 border-blue-500 text-blue-700'
                      : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xl mb-2">🚚</div>
                      <div className="font-bold text-lg">شحن وتوصيل للمنزل</div>
                      <div className="text-sm mt-1">توصيل حتى باب المنزل</div>
                      <div className="text-sm text-blue-600 font-medium mt-1">يضاف رسوم الشحن</div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 ${
                      deliveryMethod === 'delivery'
                        ? 'bg-blue-500 border-blue-500'
                        : 'border-gray-300'
                    }`}>
                      {deliveryMethod === 'delivery' && (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Shipping Details - Only show when delivery is selected */}
            {deliveryMethod === 'delivery' && (
              <div className="bg-white border border-gray-300 rounded-lg p-6 shadow-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">تفاصيل الشحن</h3>
                
                <div className="space-y-4">
                  {/* Shipping Company - Only show if multiple companies */}
                  {shippingCompanies.length > 1 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">شركة الشحن</label>
                      <select
                        value={selectedCompany}
                        onChange={(e) => handleCompanySelect(e.target.value)}
                        className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 bg-white"
                      >
                        <option value="" className="text-gray-900">اختر شركة الشحن</option>
                        {shippingCompanies.map((company) => (
                          <option key={company.id} value={company.id} className="text-gray-900">
                            {company.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Governorate Selection */}
                  {(shippingCompanies.length > 0 && ((shippingCompanies.length === 1) || (shippingCompanies.length > 1 && selectedCompany))) && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">المحافظة</label>
                      <select
                        value={selectedGovernorate}
                        onChange={(e) => handleGovernorateSelect(e.target.value)}
                        className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 bg-white"
                      >
                        <option value="" className="text-gray-900">اختر المحافظة</option>
                        {governorates.map((gov) => (
                          <option key={gov.id} value={gov.id} className="text-gray-900">
                            {gov.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Area Selection - Only for complex governorates */}
                  {selectedGovernorate && governorates.find(g => g.id === selectedGovernorate)?.type === 'complex' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">المنطقة</label>
                      <select
                        value={selectedArea}
                        onChange={(e) => handleAreaSelect(e.target.value)}
                        className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 bg-white"
                      >
                        <option value="" className="text-gray-900">اختر المنطقة</option>
                        {governorates.find(g => g.id === selectedGovernorate)?.areas?.map((area) => (
                          <option key={area.id} value={area.id} className="text-gray-900">
                            {area.name} - {area.price} ريال
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Shipping Cost Display */}
                  {shippingCost > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-blue-700">تكلفة الشحن:</div>
                        <div className="text-lg font-bold text-blue-700">{shippingCost.toFixed(2)} ريال</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Order summary */}
            <div className="bg-white border border-gray-300 rounded-lg p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">ملخص الطلب</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between text-gray-600">
                  <span>المجموع الفرعي:</span>
                  <span>{subtotal.toFixed(2)} ريال</span>
                </div>
                
                {/* Only show shipping row if delivery method is selected */}
                {deliveryMethod === 'delivery' && (
                  <div className="flex justify-between text-gray-600">
                    <span>الشحن:</span>
                    <span>
                      {shipping > 0 ? `${shipping.toFixed(2)} ريال` : (
                        <span className="text-orange-500 text-sm">يرجى اختيار المنطقة</span>
                      )}
                    </span>
                  </div>
                )}
                
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
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors text-gray-900 bg-white placeholder-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">رقم الهاتف</label>
                  <input
                    type="tel"
                    value={customerData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="أدخل رقم الهاتف"
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors text-gray-900 bg-white placeholder-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">رقم هاتف آخر (اختياري)</label>
                  <input
                    type="tel"
                    value={customerData.altPhone}
                    onChange={(e) => handleInputChange('altPhone', e.target.value)}
                    placeholder="أدخل رقم هاتف آخر"
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors text-gray-900 bg-white placeholder-gray-500"
                  />
                </div>

                {/* Address field - only show for delivery */}
                {deliveryMethod === 'delivery' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">العنوان</label>
                    <textarea
                      value={customerData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      placeholder="أدخل عنوان التوصيل"
                      rows={3}
                      className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors resize-none text-gray-900 bg-white placeholder-gray-500"
                    />
                  </div>
                )}
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
                تأكيد الطلب ({Object.keys(groupedCartItems).length} منتج)
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
    </>
  );
};

export default CartModal;