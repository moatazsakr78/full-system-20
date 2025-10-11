import { useState, useCallback, useEffect, useRef } from 'react';
import { posTabsService } from '@/lib/services/posTabsService';

export interface POSTab {
  id: string;
  title: string;
  active: boolean;
  cartItems: any[];
  selections: {
    customer: any;
    branch: any;
    record: any;
  };
  isPurchaseMode?: boolean;
  isTransferMode?: boolean;
  isReturnMode?: boolean;
  selectedSupplier?: any;
  selectedWarehouse?: any;
  transferFromLocation?: any;
  transferToLocation?: any;
}

interface UsePOSTabsReturn {
  tabs: POSTab[];
  activeTab: POSTab | undefined;
  activeTabId: string;
  addTab: (title: string) => void;
  closeTab: (tabId: string) => void;
  switchTab: (tabId: string) => void;
  updateActiveTabCart: (cartItems: any[]) => void;
  updateActiveTabSelections: (selections: any) => void;
  updateActiveTabMode: (updates: Partial<POSTab>) => void;
  clearActiveTabCart: () => void;
  isLoading: boolean;
}

const DEFAULT_TAB: POSTab = {
  id: 'main',
  title: 'نقطة البيع',
  active: true,
  cartItems: [],
  selections: {
    customer: null,
    branch: null,
    record: null,
  },
};

export function usePOSTabs(): UsePOSTabsReturn {
  const [tabs, setTabs] = useState<POSTab[]>([DEFAULT_TAB]);
  const [activeTabId, setActiveTabId] = useState<string>('main');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialMount = useRef(true);

  const activeTab = tabs.find(tab => tab.id === activeTabId);

  const addTab = useCallback((title: string) => {
    const newTabId = `pos-${Date.now()}`;
    setTabs(prev => [
      ...prev.map(tab => ({ ...tab, active: false })),
      {
        id: newTabId,
        title,
        active: true,
        cartItems: [],
        selections: {
          customer: null,
          branch: null,
          record: null,
        },
      },
    ]);
    setActiveTabId(newTabId);
  }, []);

  const closeTab = useCallback((tabId: string) => {
    if (tabId === 'main') return;

    setTabs(prev => {
      const newTabs = prev.filter(tab => tab.id !== tabId);

      if (activeTabId === tabId) {
        const lastTab = newTabs[newTabs.length - 1];
        const newActiveId = lastTab?.id || 'main';
        setActiveTabId(newActiveId);
        return newTabs.map(tab => ({
          ...tab,
          active: tab.id === newActiveId,
        }));
      }

      return newTabs;
    });
  }, [activeTabId]);

  const switchTab = useCallback((tabId: string) => {
    setTabs(prev => prev.map(tab => ({
      ...tab,
      active: tab.id === tabId,
    })));
    setActiveTabId(tabId);
  }, []);

  const updateActiveTabCart = useCallback((cartItems: any[]) => {
    setTabs(prev => prev.map(tab =>
      tab.id === activeTabId
        ? { ...tab, cartItems }
        : tab
    ));
  }, [activeTabId]);

  const updateActiveTabSelections = useCallback((selections: any) => {
    setTabs(prev => prev.map(tab =>
      tab.id === activeTabId
        ? { ...tab, selections }
        : tab
    ));
  }, [activeTabId]);

  const updateActiveTabMode = useCallback((updates: Partial<POSTab>) => {
    setTabs(prev => prev.map(tab =>
      tab.id === activeTabId
        ? { ...tab, ...updates }
        : tab
    ));
  }, [activeTabId]);

  const clearActiveTabCart = useCallback(() => {
    setTabs(prev => prev.map(tab =>
      tab.id === activeTabId
        ? { ...tab, cartItems: [] }
        : tab
    ));
  }, [activeTabId]);

  // Load tabs state from database on mount
  useEffect(() => {
    const loadTabsState = async () => {
      try {
        setIsLoading(true);
        const savedState = await posTabsService.loadTabsState();

        if (savedState && savedState.tabs && savedState.tabs.length > 0) {
          // Restore saved tabs
          setTabs(savedState.tabs);
          setActiveTabId(savedState.active_tab_id || 'main');
        }
      } catch (error) {
        console.error('Failed to load POS tabs state:', error);
      } finally {
        setIsLoading(false);
        isInitialMount.current = false;
      }
    };

    loadTabsState();
  }, []);

  // Auto-save tabs state to database with debounce
  useEffect(() => {
    // Skip saving on initial mount
    if (isInitialMount.current || isLoading) {
      return;
    }

    // Clear previous timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Debounce save operation (save after 1 second of no changes)
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await posTabsService.saveTabsState(tabs, activeTabId);
      } catch (error) {
        console.error('Failed to save POS tabs state:', error);
      }
    }, 1000);

    // Cleanup timeout on unmount
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [tabs, activeTabId, isLoading]);

  return {
    tabs,
    activeTab,
    activeTabId,
    addTab,
    closeTab,
    switchTab,
    updateActiveTabCart,
    updateActiveTabSelections,
    updateActiveTabMode,
    clearActiveTabCart,
    isLoading,
  };
}
