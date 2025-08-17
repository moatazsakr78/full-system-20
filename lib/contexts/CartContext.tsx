'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useReducer } from 'react';
import { CartService } from '../cart-service';
import { CartSession, CartItemData } from '../cart-utils';

interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  price: number;
  selected_color?: string;
  selected_size?: string;
  products?: {
    name: string;
    product_code: string | null;
    main_image_url: string | null;
  };
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (productId: string, quantity: number, price: number, selectedColor?: string, selectedSize?: string) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  syncWithDatabase: () => Promise<void>;
}

type CartAction = 
  | { type: 'SET_CART'; payload: CartItem[] }
  | { type: 'ADD_ITEM'; payload: CartItem }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_QUANTITY'; payload: { itemId: string; quantity: number } }
  | { type: 'CLEAR_CART' };

function cartReducer(state: CartItem[], action: CartAction): CartItem[] {
  switch (action.type) {
    case 'SET_CART':
      return action.payload;
    
    case 'ADD_ITEM':
      const existingItem = state.find(item => 
        item.product_id === action.payload.product_id &&
        (item.selected_color || '') === (action.payload.selected_color || '') &&
        (item.selected_size || '') === (action.payload.selected_size || '')
      );
      
      if (existingItem) {
        return state.map(item =>
          item.id === existingItem.id
            ? { ...item, quantity: item.quantity + action.payload.quantity }
            : item
        );
      } else {
        return [...state, action.payload];
      }
    
    case 'REMOVE_ITEM':
      return state.filter(item => item.id !== action.payload);
    
    case 'UPDATE_QUANTITY':
      if (action.payload.quantity <= 0) {
        return state.filter(item => item.id !== action.payload.itemId);
      }
      return state.map(item =>
        item.id === action.payload.itemId
          ? { ...item, quantity: action.payload.quantity }
          : item
      );
    
    case 'CLEAR_CART':
      return [];
    
    default:
      return state;
  }
}

const CartContext = createContext<CartContextType | undefined>(undefined);

interface CartProviderProps {
  children: ReactNode;
}

export function CartProvider({ children }: CartProviderProps) {
  const [cartItems, dispatch] = useReducer(cartReducer, []);

  // Load initial cart from database
  const syncWithDatabase = async () => {
    try {
      const sessionId = CartSession.getSessionId();
      const items = await CartService.getCartItems(sessionId);
      
      // Convert CartItemData to CartItem format
      const convertedItems: CartItem[] = items.map(item => ({
        id: item.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
        selected_color: item.selected_color || undefined,
        selected_size: item.selected_size || undefined,
        products: item.products
      }));
      
      dispatch({ type: 'SET_CART', payload: convertedItems });
    } catch (error) {
      console.error('Error syncing cart with database:', error);
    }
  };

  // Local cart operations (immediate UI updates + database sync)
  const addToCart = async (productId: string, quantity: number, price: number, selectedColor?: string, selectedSize?: string) => {
    // 1. Immediate UI update
    const newItem: CartItem = {
      id: `temp_${Date.now()}_${Math.random()}`, // Temporary ID for local state
      product_id: productId,
      quantity,
      price,
      selected_color: selectedColor,
      selected_size: selectedSize
    };
    
    dispatch({ type: 'ADD_ITEM', payload: newItem });
    
    // 2. Sync with database and refresh
    try {
      const sessionId = CartSession.getSessionId();
      await CartService.addToCart(sessionId, productId, quantity, price, selectedColor, selectedSize);
      // Refresh cart from database to ensure accuracy
      await syncWithDatabase();
    } catch (error) {
      console.error('Error syncing add to cart:', error);
    }
  };

  const removeFromCart = async (itemId: string) => {
    // 1. Immediate UI update
    dispatch({ type: 'REMOVE_ITEM', payload: itemId });
    
    // 2. Sync with database and refresh
    try {
      await CartService.removeFromCart(itemId);
      // Refresh cart from database to ensure accuracy
      await syncWithDatabase();
    } catch (error) {
      console.error('Error syncing remove from cart:', error);
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    // 1. Immediate UI update
    dispatch({ type: 'UPDATE_QUANTITY', payload: { itemId, quantity } });
    
    // 2. Sync with database and refresh
    try {
      await CartService.updateCartItemQuantity(itemId, quantity);
      // Refresh cart from database to ensure accuracy
      await syncWithDatabase();
    } catch (error) {
      console.error('Error syncing quantity update:', error);
    }
  };

  const clearCart = async () => {
    // 1. Immediate UI update
    dispatch({ type: 'CLEAR_CART' });
    
    // 2. Sync with database and refresh
    try {
      const sessionId = CartSession.getSessionId();
      await CartService.clearCart(sessionId);
      // Refresh cart from database to ensure accuracy
      await syncWithDatabase();
    } catch (error) {
      console.error('Error syncing clear cart:', error);
    }
  };

  // Load initial cart from database on mount
  useEffect(() => {
    syncWithDatabase();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const value: CartContextType = {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    syncWithDatabase
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