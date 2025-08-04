import { useState, useEffect, useCallback, useRef } from 'react';
import { CartService } from './cart-service';
import { CartSession, CartItemData } from './cart-utils';

export interface RealCartHook {
  cart: CartItemData[];
  isLoading: boolean;
  error: string | null;
  addToCart: (productId: string, quantity: number, price: number, selectedColor?: string, selectedSize?: string) => Promise<boolean>;
  removeFromCart: (itemId: string) => Promise<boolean>;
  updateQuantity: (itemId: string, quantity: number) => Promise<boolean>;
  clearCart: () => Promise<boolean>;
  getCartTotal: () => number;
  getCartItemsCount: () => number;
  refreshCart: () => Promise<void>;
}

export function useRealCart(): RealCartHook {
  const [cart, setCart] = useState<CartItemData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const sessionIdRef = useRef<string>('');
  const subscriptionRef = useRef<any>(null);
  const isMountedRef = useRef(true);
  
  // Initialize session ID
  useEffect(() => {
    sessionIdRef.current = CartSession.getSessionId();
    console.log('🔍 useRealCart initialized with session ID:', sessionIdRef.current);
    console.log('📊 Session info:', CartSession.getSessionInfo());
    
    refreshCart();
    setupRealtimeSubscription();
    
    return () => {
      isMountedRef.current = false;
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, []);
  
  const refreshCart = useCallback(async () => {
    if (!sessionIdRef.current || !isMountedRef.current) return;
    
    try {
      setIsLoading(true);
      setError(null);
      console.log('🔄 Refreshing cart for session:', sessionIdRef.current);
      const items = await CartService.getCartItems(sessionIdRef.current);
      console.log('📦 Cart items loaded:', items.length, 'items');
      
      if (isMountedRef.current) {
        setCart(items);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load cart';
      console.error('❌ Error refreshing cart:', err);
      if (isMountedRef.current) {
        setError(errorMessage);
        setCart([]);
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);
  
  const setupRealtimeSubscription = useCallback(() => {
    if (!sessionIdRef.current || subscriptionRef.current) return;
    
    subscriptionRef.current = CartService.subscribeToCartChanges(
      sessionIdRef.current,
      (payload) => {
        console.log('Cart updated via real-time:', payload.eventType);
        // Small delay to prevent race conditions
        setTimeout(() => {
          if (isMountedRef.current) {
            refreshCart();
          }
        }, 100);
      }
    );
  }, [refreshCart]);
  
  const addToCart = useCallback(async (
    productId: string,
    quantity: number = 1,
    price: number,
    selectedColor?: string,
    selectedSize?: string
  ): Promise<boolean> => {
    try {
      setError(null);
      
      // Ensure session ID is available
      if (!sessionIdRef.current) {
        console.warn('Session ID not ready, regenerating...');
        sessionIdRef.current = CartSession.getSessionId();
      }
      
      const result = await CartService.addToCart(
        sessionIdRef.current,
        productId,
        quantity,
        price,
        selectedColor,
        selectedSize
      );
      
      if (result) {
        // Real-time subscription will update the cart
        return true;
      } else {
        console.error('Failed to add to cart - no result returned');
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add to cart';
      console.error('Error adding to cart:', err);
      setError(errorMessage);
      return false;
    }
  }, []);
  
  const removeFromCart = useCallback(async (itemId: string): Promise<boolean> => {
    try {
      setError(null);
      const success = await CartService.removeFromCart(itemId);
      if (success) {
        // Real-time subscription will update the cart
        return true;
      }
      return false;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove from cart';
      console.error('Error removing from cart:', err);
      setError(errorMessage);
      return false;
    }
  }, []);
  
  const updateQuantity = useCallback(async (itemId: string, quantity: number): Promise<boolean> => {
    try {
      setError(null);
      if (quantity <= 0) {
        return removeFromCart(itemId);
      }
      
      const result = await CartService.updateCartItemQuantity(itemId, quantity);
      if (result) {
        // Real-time subscription will update the cart
        return true;
      }
      return false;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update quantity';
      console.error('Error updating quantity:', err);
      setError(errorMessage);
      return false;
    }
  }, [removeFromCart]);
  
  const clearCart = useCallback(async (): Promise<boolean> => {
    try {
      setError(null);
      const success = await CartService.clearCart(sessionIdRef.current);
      if (success) {
        // Real-time subscription will update the cart
        return true;
      }
      return false;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to clear cart';
      console.error('Error clearing cart:', err);
      setError(errorMessage);
      return false;
    }
  }, []);
  
  const getCartTotal = useCallback((): number => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  }, [cart]);
  
  const getCartItemsCount = useCallback((): number => {
    return cart.reduce((count, item) => count + item.quantity, 0);
  }, [cart]);
  
  return {
    cart,
    isLoading,
    error,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    getCartItemsCount,
    refreshCart
  };
}