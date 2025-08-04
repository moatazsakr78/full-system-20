import { useState, useCallback, useRef } from 'react';

export interface OptimisticAction<T = any> {
  id: string;
  type: string;
  payload: T;
  timestamp: number;
  status: 'pending' | 'success' | 'error';
  rollback?: () => void;
}

export interface OptimisticState<T> {
  data: T;
  isLoading: boolean;
  error: string | null;
  pendingActions: OptimisticAction[];
}

/**
 * Hook for optimistic UI updates without real-time subscriptions
 * Provides instant visual feedback for user actions
 */
export function useOptimisticState<T>(
  initialData: T,
  syncFunction?: (data: T) => Promise<T>
) {
  const [state, setState] = useState<OptimisticState<T>>({
    data: initialData,
    isLoading: false,
    error: null,
    pendingActions: []
  });

  const timeoutRef = useRef<NodeJS.Timeout>();

  const addOptimisticUpdate = useCallback(
    (action: Omit<OptimisticAction, 'id' | 'timestamp' | 'status'>) => {
      const actionId = `${Date.now()}-${Math.random()}`;
      const fullAction: OptimisticAction = {
        ...action,
        id: actionId,
        timestamp: Date.now(),
        status: 'pending'
      };

      setState(prev => ({
        ...prev,
        pendingActions: [...prev.pendingActions, fullAction]
      }));

      return actionId;
    },
    []
  );

  const updateData = useCallback((updater: (prev: T) => T) => {
    setState(prev => ({
      ...prev,
      data: updater(prev.data)
    }));
  }, []);

  const commitAction = useCallback((actionId: string, success: boolean = true) => {
    setState(prev => ({
      ...prev,
      pendingActions: prev.pendingActions.map(action =>
        action.id === actionId
          ? { ...action, status: success ? 'success' : 'error' }
          : action
      )
    }));

    // Clean up completed actions after a delay
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      setState(prev => ({
        ...prev,
        pendingActions: prev.pendingActions.filter(
          action => action.status === 'pending'
        )
      }));
    }, 3000);
  }, []);

  const rollbackAction = useCallback((actionId: string) => {
    setState(prev => {
      const action = prev.pendingActions.find(a => a.id === actionId);
      if (action?.rollback) {
        action.rollback();
      }
      
      return {
        ...prev,
        pendingActions: prev.pendingActions.filter(a => a.id !== actionId)
      };
    });
  }, []);

  const syncData = useCallback(async () => {
    if (!syncFunction) return;
    
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const syncedData = await syncFunction(state.data);
      setState(prev => ({
        ...prev,
        data: syncedData,
        isLoading: false,
        error: null
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Sync failed'
      }));
    }
  }, [state.data, syncFunction]);

  return {
    ...state,
    addOptimisticUpdate,
    updateData,
    commitAction,
    rollbackAction,
    syncData
  };
}

/**
 * Hook for managing cart state with optimistic updates
 */
export function useOptimisticCart(initialCart: any[] = []) {
  const { data: cart, updateData, addOptimisticUpdate, commitAction } = useOptimisticState(
    initialCart
  );

  const addToCart = useCallback((product: any, quantity: number = 1) => {
    const actionId = addOptimisticUpdate({
      type: 'ADD_TO_CART',
      payload: { product, quantity }
    });

    // Optimistic update
    updateData(prev => {
      const existingItem = prev.find(item => item.id === product.id);
      if (existingItem) {
        return prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        return [...prev, { ...product, quantity }];
      }
    });

    // Simulate API call delay and commit
    setTimeout(() => {
      commitAction(actionId, true);
    }, 500);

    return actionId;
  }, [updateData, addOptimisticUpdate, commitAction]);

  const removeFromCart = useCallback((productId: string | number) => {
    const actionId = addOptimisticUpdate({
      type: 'REMOVE_FROM_CART',
      payload: { productId }
    });

    // Store original state for rollback
    const originalCart = cart;
    
    // Optimistic update
    updateData(prev => prev.filter(item => item.id !== productId));

    // Simulate API call
    setTimeout(() => {
      commitAction(actionId, true);
    }, 500);

    return actionId;
  }, [cart, updateData, addOptimisticUpdate, commitAction]);

  const updateQuantity = useCallback((productId: string | number, quantity: number) => {
    const actionId = addOptimisticUpdate({
      type: 'UPDATE_QUANTITY',
      payload: { productId, quantity }
    });

    // Optimistic update
    updateData(prev => 
      prev.map(item =>
        item.id === productId
          ? { ...item, quantity: Math.max(0, quantity) }
          : item
      ).filter(item => item.quantity > 0)
    );

    // Simulate API call
    setTimeout(() => {
      commitAction(actionId, true);
    }, 500);

    return actionId;
  }, [updateData, addOptimisticUpdate, commitAction]);

  const clearCart = useCallback(() => {
    const actionId = addOptimisticUpdate({
      type: 'CLEAR_CART',
      payload: {}
    });

    // Optimistic update
    updateData(() => []);

    // Simulate API call
    setTimeout(() => {
      commitAction(actionId, true);
    }, 500);

    return actionId;
  }, [updateData, addOptimisticUpdate, commitAction]);

  const getCartTotal = useCallback(() => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  }, [cart]);

  const getCartItemsCount = useCallback(() => {
    return cart.reduce((count, item) => count + item.quantity, 0);
  }, [cart]);

  return {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    getCartItemsCount
  };
}

/**
 * Hook for managing user preferences with optimistic updates
 */
export function useOptimisticPreferences(initialPreferences: any = {}) {
  const { data: preferences, updateData, addOptimisticUpdate, commitAction } = useOptimisticState(
    initialPreferences
  );

  const updatePreferences = useCallback((updates: Partial<any>) => {
    const actionId = addOptimisticUpdate({
      type: 'UPDATE_PREFERENCES',
      payload: updates
    });

    // Optimistic update
    updateData(prev => ({ ...prev, ...updates }));

    // Simulate API call
    setTimeout(() => {
      commitAction(actionId, true);
    }, 500);

    return actionId;
  }, [updateData, addOptimisticUpdate, commitAction]);

  return {
    preferences,
    updatePreferences
  };
}

/**
 * Memory-only cache for frequently accessed data
 */
export class MemoryCache<T> {
  private cache = new Map<string, { data: T; timestamp: number; ttl: number }>();

  set(key: string, data: T, ttl: number = 300000): void { // 5 minutes default TTL
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  // Clean expired entries
  cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];
    this.cache.forEach((entry, key) => {
      if (now - entry.timestamp > entry.ttl) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => this.cache.delete(key));
  }
}

// Global memory cache instance
export const memoryCache = new MemoryCache();

// Cleanup expired cache entries every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    memoryCache.cleanup();
  }, 300000);
}