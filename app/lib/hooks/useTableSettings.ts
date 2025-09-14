// React Hook for Enhanced Table Settings
// Provides a clean interface for components to interact with the new settings system

import { useState, useEffect, useCallback, useRef } from 'react';
import { databaseSettingsService } from '@/app/lib/services/databaseSettingsService';
import { hybridTableStorage, type ReportType } from '@/app/lib/utils/hybridTableStorage';
import { settingsErrorHandler } from '@/app/lib/utils/settingsErrorHandler';
import { performanceOptimizer, getPerformanceInsights } from '@/app/lib/utils/performanceOptimizer';
import { settingsSystemTester } from '@/app/lib/utils/settingsSystemTest';

export interface ColumnConfig {
  id: string;
  header: string;
  visible: boolean;
  width?: number;
  order?: number;
}

export interface TableSettingsHookResult {
  // Data
  columns: ColumnConfig[];
  loading: boolean;
  error: string | null;

  // Actions
  updateColumnVisibility: (visibilityMap: Record<string, boolean>) => Promise<void>;
  updateColumnWidth: (columnId: string, width: number) => Promise<void>;
  updateColumnOrder: (newOrder: string[]) => Promise<void>;
  resetToDefaults: () => Promise<void>;

  // System Status
  systemHealth: {
    status: 'healthy' | 'degraded' | 'critical';
    database: boolean;
    cache: boolean;
    issues: string[];
    recommendations: string[];
  } | null;

  // Performance Insights
  performanceInsights: {
    averageLoadTime: number;
    cacheHitRate: number;
    totalOperations: number;
    recommendations: string[];
  } | null;

  // Utilities
  refreshSettings: () => Promise<void>;
  runSystemTest: () => Promise<boolean>;
  exportSettings: () => string;
  importSettings: (settingsJson: string) => Promise<boolean>;
}

export function useTableSettings(
  reportType: ReportType,
  defaultColumns: ColumnConfig[],
  options: {
    autoSave?: boolean;
    debounceMs?: number;
    enablePerformanceTracking?: boolean;
    enableHealthMonitoring?: boolean;
  } = {}
): TableSettingsHookResult {
  const {
    autoSave = true,
    debounceMs = 300,
    enablePerformanceTracking = true,
    enableHealthMonitoring = true
  } = options;

  // State
  const [columns, setColumns] = useState<ColumnConfig[]>(defaultColumns);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [systemHealth, setSystemHealth] = useState<TableSettingsHookResult['systemHealth']>(null);
  const [performanceInsights, setPerformanceInsights] = useState<TableSettingsHookResult['performanceInsights']>(null);

  // Refs for debouncing and cleanup
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  // Load settings on mount
  useEffect(() => {
    loadSettings();

    if (enableHealthMonitoring) {
      checkSystemHealth();
      // Periodic health checks
      const healthInterval = setInterval(checkSystemHealth, 30000); // Every 30 seconds
      return () => clearInterval(healthInterval);
    }

    return () => {
      mountedRef.current = false;
    };
  }, [reportType]);

  // Performance tracking
  useEffect(() => {
    if (enablePerformanceTracking) {
      const updateInsights = () => {
        const insights = getPerformanceInsights();
        if (mountedRef.current) {
          setPerformanceInsights(insights);
        }
      };

      updateInsights();
      const insightsInterval = setInterval(updateInsights, 10000); // Every 10 seconds
      return () => clearInterval(insightsInterval);
    }
  }, [enablePerformanceTracking]);

  /**
   * Load settings with fallback chain
   */
  const loadSettings = useCallback(async () => {
    if (!mountedRef.current) return;

    setLoading(true);
    setError(null);

    try {
      let loadedColumns: ColumnConfig[];

      if (enablePerformanceTracking) {
        // Use performance-optimized loading
        const result = await performanceOptimizer.loadOptimized(reportType);
        const config = result.data;

        if (config && config.columns) {
          loadedColumns = mergeWithDefaults(config.columns, defaultColumns);
        } else {
          loadedColumns = defaultColumns;
        }
      } else {
        // Use regular hybrid storage
        const config = await hybridTableStorage.loadTableConfig(reportType);

        if (config && config.columns) {
          loadedColumns = mergeWithDefaults(config.columns, defaultColumns);
        } else {
          loadedColumns = defaultColumns;
        }
      }

      if (mountedRef.current) {
        setColumns(loadedColumns);
        setError(null);
      }

    } catch (err) {
      console.error('Failed to load table settings:', err);

      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setColumns(defaultColumns); // Fallback to defaults
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [reportType, defaultColumns, enablePerformanceTracking]);

  /**
   * Save settings with debouncing
   */
  const saveSettings = useCallback(async (
    newColumns: ColumnConfig[],
    immediate: boolean = false
  ) => {
    if (!autoSave && !immediate) return;

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    const doSave = async () => {
      try {
        const columnsData = newColumns.map(col => ({
          id: col.id,
          width: col.width || 100,
          visible: col.visible
        }));

        if (enablePerformanceTracking) {
          await performanceOptimizer.saveBatched(
            reportType,
            columnsData,
            newColumns.map(c => c.id),
            immediate ? 'high' : 'medium'
          );
        } else {
          await hybridTableStorage.saveTableConfig(reportType, columnsData);
        }

        if (mountedRef.current) {
          setError(null);
        }
      } catch (err) {
        console.error('Failed to save table settings:', err);
        if (mountedRef.current) {
          setError(err instanceof Error ? err.message : 'Save failed');
        }
      }
    };

    if (immediate) {
      await doSave();
    } else {
      saveTimeoutRef.current = setTimeout(doSave, debounceMs);
    }
  }, [reportType, autoSave, debounceMs, enablePerformanceTracking]);

  /**
   * Update column visibility
   */
  const updateColumnVisibility = useCallback(async (visibilityMap: Record<string, boolean>) => {
    const newColumns = columns.map(col => ({
      ...col,
      visible: visibilityMap[col.id] !== false
    }));

    setColumns(newColumns);
    await saveSettings(newColumns);
  }, [columns, saveSettings]);

  /**
   * Update column width
   */
  const updateColumnWidth = useCallback(async (columnId: string, width: number) => {
    const newColumns = columns.map(col =>
      col.id === columnId ? { ...col, width } : col
    );

    setColumns(newColumns);
    await saveSettings(newColumns);
  }, [columns, saveSettings]);

  /**
   * Update column order
   */
  const updateColumnOrder = useCallback(async (newOrder: string[]) => {
    const newColumns = [...columns].sort((a, b) => {
      const aIndex = newOrder.indexOf(a.id);
      const bIndex = newOrder.indexOf(b.id);
      return aIndex - bIndex;
    }).map((col, index) => ({
      ...col,
      order: index
    }));

    setColumns(newColumns);
    await saveSettings(newColumns);
  }, [columns, saveSettings]);

  /**
   * Reset to default settings
   */
  const resetToDefaults = useCallback(async () => {
    setColumns(defaultColumns);
    await saveSettings(defaultColumns, true);
  }, [defaultColumns, saveSettings]);

  /**
   * Check system health
   */
  const checkSystemHealth = useCallback(async () => {
    if (!enableHealthMonitoring) return;

    try {
      const health = await settingsErrorHandler.performHealthCheck();

      if (mountedRef.current) {
        setSystemHealth({
          status: health.overall,
          database: health.database,
          cache: health.cache,
          issues: health.issues,
          recommendations: health.recommendations
        });
      }
    } catch (err) {
      console.warn('Health check failed:', err);
    }
  }, [enableHealthMonitoring]);

  /**
   * Refresh settings from database
   */
  const refreshSettings = useCallback(async () => {
    // Clear cache and reload
    databaseSettingsService.clearCache(reportType === 'MAIN_REPORT' ? 'main' : 'products');
    await loadSettings();
  }, [loadSettings, reportType]);

  /**
   * Run system test
   */
  const runSystemTest = useCallback(async (): Promise<boolean> => {
    try {
      const results = await settingsSystemTester.runAllTests();
      return results.overallSuccess;
    } catch (err) {
      console.error('System test failed:', err);
      return false;
    }
  }, []);

  /**
   * Export settings as JSON
   */
  const exportSettings = useCallback((): string => {
    const exportData = {
      reportType,
      columns,
      timestamp: Date.now(),
      version: '2.1.0'
    };

    return JSON.stringify(exportData, null, 2);
  }, [reportType, columns]);

  /**
   * Import settings from JSON
   */
  const importSettings = useCallback(async (settingsJson: string): Promise<boolean> => {
    try {
      const importData = JSON.parse(settingsJson);

      if (importData.reportType !== reportType) {
        throw new Error(`Report type mismatch: expected ${reportType}, got ${importData.reportType}`);
      }

      if (!importData.columns || !Array.isArray(importData.columns)) {
        throw new Error('Invalid columns data');
      }

      const importedColumns = mergeWithDefaults(importData.columns, defaultColumns);
      setColumns(importedColumns);
      await saveSettings(importedColumns, true);

      return true;
    } catch (err) {
      console.error('Import failed:', err);
      setError(err instanceof Error ? err.message : 'Import failed');
      return false;
    }
  }, [reportType, defaultColumns, saveSettings]);

  return {
    // Data
    columns,
    loading,
    error,

    // Actions
    updateColumnVisibility,
    updateColumnWidth,
    updateColumnOrder,
    resetToDefaults,

    // System Status
    systemHealth,
    performanceInsights,

    // Utilities
    refreshSettings,
    runSystemTest,
    exportSettings,
    importSettings
  };
}

/**
 * Merge loaded columns with defaults, preserving user customizations
 */
function mergeWithDefaults(loadedColumns: any[], defaultColumns: ColumnConfig[]): ColumnConfig[] {
  return defaultColumns.map((defaultCol, index) => {
    const loaded = loadedColumns.find(col => col.id === defaultCol.id);

    return {
      ...defaultCol,
      visible: loaded?.visible !== false, // Default to visible if not found
      width: loaded?.width || defaultCol.width || 100,
      order: loaded?.order !== undefined ? loaded.order : index
    };
  });
}

// Convenience hook for specific report types
export function useReportsTableSettings(defaultColumns: ColumnConfig[]) {
  return useTableSettings('MAIN_REPORT', defaultColumns);
}

export function useProductsTableSettings(defaultColumns: ColumnConfig[]) {
  return useTableSettings('PRODUCTS_REPORT', defaultColumns);
}