'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CartService } from '../cart-service';
import { CartSession } from '../cart-utils';

interface CartContextType {
  cartCount: number;
  updateCartCount: () => void;
  incrementCartCount: (amount?: number) => void;
  decrementCartCount: (amount?: number) => void;
  clearCartCount: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

interface CartProviderProps {
  children: ReactNode;
}

export function CartProvider({ children }: CartProviderProps) {
  const [cartCount, setCartCount] = useState(0);

  // Function to update cart count from database
  const updateCartCount = async () => {
    try {
      const sessionId = CartSession.getSessionId();
      const items = await CartService.getCartItems(sessionId);
      const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);
      setCartCount(totalCount);
    } catch (error) {
      console.error('Error updating cart count:', error);
      setCartCount(0);
    }
  };

  // Optimistic updates for immediate UI feedback
  const incrementCartCount = (amount: number = 1) => {
    setCartCount(prev => prev + amount);
  };

  const decrementCartCount = (amount: number = 1) => {
    setCartCount(prev => Math.max(0, prev - amount));
  };

  const clearCartCount = () => {
    setCartCount(0);
  };

  // Load initial cart count
  useEffect(() => {
    updateCartCount();
  }, []);

  // Set up real-time subscription for cart changes
  useEffect(() => {
    const sessionId = CartSession.getSessionId();
    
    const subscription = CartService.subscribeToCartChanges(
      sessionId,
      () => {
        // Update cart count when cart changes
        updateCartCount();
      }
    );

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  const value: CartContextType = {
    cartCount,
    updateCartCount,
    incrementCartCount,
    decrementCartCount,
    clearCartCount
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}