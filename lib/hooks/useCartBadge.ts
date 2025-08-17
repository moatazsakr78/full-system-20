'use client';

import { useMemo } from 'react';
import { useCart } from '../contexts/CartContext';

/**
 * Custom hook for cart badge count
 * Provides accurate cart count that matches the cart modal display
 * Now connected directly to CartContext for instant updates
 */
export function useCartBadge() {
  const { cartItems } = useCart();

  // Calculate cart badge count from cartItems in real-time
  const cartBadgeCount = useMemo(() => {
    if (!cartItems || cartItems.length === 0) {
      return 0;
    }

    // Group items by product_id to match cart modal logic
    const groupedItems = cartItems.reduce((groups, item) => {
      const key = item.product_id;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
      return groups;
    }, {} as Record<string, any[]>);
    
    // Count unique product groups (not total items)
    return Object.keys(groupedItems).length;
  }, [cartItems]);

  // Return current count - no loading state needed as it's computed from context
  return {
    cartBadgeCount,
    isLoading: false,
    refreshCartBadge: () => {} // No longer needed as updates are automatic
  };
}