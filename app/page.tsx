'use client';

import { useState, useEffect } from 'react';
import { detectDeviceClient, DeviceInfo } from '../lib/device-detection';
import DesktopHome from '../components/website/DesktopHome';
import TabletHome from '../components/website/TabletHome';
import MobileHome from '../components/website/MobileHome';
import { useRealCart } from '../lib/useRealCart';
import { useAuth } from '../lib/useAuth';
import { UserInfo } from '../components/website/shared/types';

export default function HomePage() {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
    type: 'desktop',
    userAgent: '',
    isMobile: false,
    isTablet: false,
    isDesktop: true
  });
  const [isClient, setIsClient] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo>({
    id: '1',
    name: 'عميل تجريبي',
    email: 'customer@example.com',
    cart: []
  });

  const { cart, addToCart, removeFromCart, updateQuantity, clearCart, getCartItemsCount } = useRealCart();
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    // Set client flag first
    setIsClient(true);
    // Client-side device detection
    const detected = detectDeviceClient();
    setDeviceInfo(detected);
  }, []);

  const handleCartUpdate = (newCart: any[]) => {
    // Real cart is managed by useRealCart hook with Supabase
    console.log('Cart updated:', newCart);
  };

  // Convert Supabase cart data to compatible format
  const compatibleCart = cart.map(item => ({
    id: item.id,
    name: item.products?.name || 'منتج غير معروف',
    price: item.price,
    quantity: item.quantity,
    image: item.products?.main_image_url || '',
    description: '',
    category: ''
  }));

  const updatedUserInfo = {
    ...userInfo,
    id: isAuthenticated ? user?.id || '1' : '1',
    name: isAuthenticated ? user?.name || 'عميل مسجل' : 'عميل تجريبي',
    email: isAuthenticated ? user?.email || 'user@example.com' : 'customer@example.com',
    cart: compatibleCart // Compatible cart data format
  };

  // Show loading screen during hydration to prevent mismatch
  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{backgroundColor: '#c0c0c0'}}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل التطبيق...</p>
        </div>
      </div>
    );
  }

  // Render appropriate component based on device type
  switch (deviceInfo.type) {
    case 'mobile':
      return (
        <MobileHome 
          userInfo={updatedUserInfo} 
          onCartUpdate={handleCartUpdate}
          onAddToCart={async (product: any) => {
            try {
              console.log('Manual UI: Adding product to cart:', product.name);
              const success = await addToCart(String(product.id), 1, product.price);
              if (success) {
                console.log('Manual UI: Product added successfully');
              } else {
                console.error('Manual UI: Failed to add product to cart');
                alert('فشل في إضافة المنتج للسلة. يرجى المحاولة مرة أخرى.');
              }
            } catch (error) {
              console.error('Manual UI: Error adding product to cart:', error);
              alert('حدث خطأ أثناء إضافة المنتج للسلة.');
            }
          }}
          onRemoveFromCart={(productId: string | number) => {
            const item = cart.find(item => item.product_id === String(productId));
            if (item) removeFromCart(item.id);
          }}
          onUpdateQuantity={(productId: string | number, quantity: number) => {
            const item = cart.find(item => item.product_id === String(productId));
            if (item) updateQuantity(item.id, quantity);
          }}
          onClearCart={clearCart}
        />
      );

    case 'tablet':
      return (
        <TabletHome 
          userInfo={updatedUserInfo} 
          onCartUpdate={handleCartUpdate}
          onAddToCart={async (product: any) => {
            try {
              console.log('Manual UI: Adding product to cart:', product.name);
              const success = await addToCart(String(product.id), 1, product.price);
              if (success) {
                console.log('Manual UI: Product added successfully');
              } else {
                console.error('Manual UI: Failed to add product to cart');
                alert('فشل في إضافة المنتج للسلة. يرجى المحاولة مرة أخرى.');
              }
            } catch (error) {
              console.error('Manual UI: Error adding product to cart:', error);
              alert('حدث خطأ أثناء إضافة المنتج للسلة.');
            }
          }}
          onRemoveFromCart={(productId: string | number) => {
            const item = cart.find(item => item.product_id === String(productId));
            if (item) removeFromCart(item.id);
          }}
          onUpdateQuantity={(productId: string | number, quantity: number) => {
            const item = cart.find(item => item.product_id === String(productId));
            if (item) updateQuantity(item.id, quantity);
          }}
          onClearCart={clearCart}
        />
      );

    case 'desktop':
    default:
      return (
        <DesktopHome 
          userInfo={updatedUserInfo} 
          onCartUpdate={handleCartUpdate}
          onAddToCart={async (product: any) => {
            try {
              console.log('Manual UI: Adding product to cart:', product.name);
              const success = await addToCart(String(product.id), 1, product.price);
              if (success) {
                console.log('Manual UI: Product added successfully');
              } else {
                console.error('Manual UI: Failed to add product to cart');
                alert('فشل في إضافة المنتج للسلة. يرجى المحاولة مرة أخرى.');
              }
            } catch (error) {
              console.error('Manual UI: Error adding product to cart:', error);
              alert('حدث خطأ أثناء إضافة المنتج للسلة.');
            }
          }}
          onRemoveFromCart={(productId: string | number) => {
            const item = cart.find(item => item.product_id === String(productId));
            if (item) removeFromCart(item.id);
          }}
          onUpdateQuantity={(productId: string | number, quantity: number) => {
            const item = cart.find(item => item.product_id === String(productId));
            if (item) updateQuantity(item.id, quantity);
          }}
          onClearCart={clearCart}
        />
      );
  }
}