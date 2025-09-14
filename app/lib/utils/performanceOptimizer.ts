// Performance Optimizer for Table Settings System
// Provides intelligent caching, batch operations, and performance monitoring

import { databaseSettingsService } from '@/app/lib/services/databaseSettingsService';
import { hybridTableStorage, type ReportType } from '@/app/lib/utils/hybridTableStorage';

interface PerformanceMetrics {
  operationType: string;
  duration: number;
  timestamp: number;
  cacheHit: boolean;
  dataSize: number;
  success: boolean;
}

interface BatchOperation {
  id: string;
  reportType: ReportType;
  operation: 'save' | 'load' | 'update';
  data: any;
  timestamp: number;
  priority: 'high' | 'medium' | 'low';
}

interface CachePolicy {
  ttl: number; // Time to live in milliseconds
  maxSize: number; // Maximum number of entries
  compressionEnabled: boolean;
  preloadStrategy: 'lazy' | 'eager' | 'predictive';
}

class PerformanceOptimizer {
  private metrics: PerformanceMetrics[] = [];
  private batchQueue: BatchOperation[] = [];
  private batchTimer: NodeJS.Timeout | null = null;
  private preloadCache = new Map<string, any>();
  private compressionCache = new Map<string, string>();

  private readonly BATCH_DELAY = 300; // 300ms batch window
  private readonly MAX_METRICS = 100; // Keep last 100 operations
  private readonly COMPRESSION_THRESHOLD = 1024; // Compress data > 1KB

  private readonly cachePolicy: CachePolicy = {
    ttl: 10 * 60 * 1000, // 10 minutes
    maxSize: 50,
    compressionEnabled: true,
    preloadStrategy: 'predictive'
  };

  /**
   * Optimized table config loading with intelligent caching
   */
  async loadOptimized(reportType: ReportType): Promise<{
    data: any;
    metrics: {
      loadTime: number;
      source: 'cache' | 'database' | 'fallback';
      cacheHit: boolean;
      compressionUsed: boolean;
    };
  }> {
    const startTime = performance.now();
    const cacheKey = `load_${reportType}`;

    try {
      // 1. Check preload cache first
      if (this.preloadCache.has(cacheKey)) {
        const cached = this.preloadCache.get(cacheKey);
        const loadTime = performance.now() - startTime;

        this.recordMetric({
          operationType: 'load',
          duration: loadTime,
          timestamp: Date.now(),
          cacheHit: true,
          dataSize: JSON.stringify(cached).length,
          success: true
        });

        return {
          data: cached,
          metrics: {
            loadTime,
            source: 'cache',
            cacheHit: true,
            compressionUsed: false
          }
        };
      }

      // 2. Try compressed cache
      if (this.compressionCache.has(cacheKey)) {
        try {
          const compressed = this.compressionCache.get(cacheKey)!;
          const decompressed = this.decompress(compressed);
          const data = JSON.parse(decompressed);
          const loadTime = performance.now() - startTime;

          this.recordMetric({
            operationType: 'load',
            duration: loadTime,
            timestamp: Date.now(),
            cacheHit: true,
            dataSize: decompressed.length,
            success: true
          });

          return {
            data,
            metrics: {
              loadTime,
              source: 'cache',
              cacheHit: true,
              compressionUsed: true
            }
          };
        } catch (error) {
          console.warn('Decompression failed, falling back to database:', error);
          this.compressionCache.delete(cacheKey);
        }
      }

      // 3. Load from database/hybrid storage
      const result = await hybridTableStorage.loadTableConfig(reportType);
      const loadTime = performance.now() - startTime;

      if (result) {
        // Cache for future use
        this.updateCache(cacheKey, result);

        // Predict next load and preload
        this.predictAndPreload(reportType);
      }

      this.recordMetric({
        operationType: 'load',
        duration: loadTime,
        timestamp: Date.now(),
        cacheHit: false,
        dataSize: result ? JSON.stringify(result).length : 0,
        success: !!result
      });

      return {
        data: result,
        metrics: {
          loadTime,
          source: result ? 'database' : 'fallback',
          cacheHit: false,
          compressionUsed: false
        }
      };

    } catch (error) {
      const loadTime = performance.now() - startTime;

      this.recordMetric({
        operationType: 'load',
        duration: loadTime,
        timestamp: Date.now(),
        cacheHit: false,
        dataSize: 0,
        success: false
      });

      throw error;
    }
  }

  /**
   * Batched save operations for better performance
   */
  async saveBatched(
    reportType: ReportType,
    columns: any[],
    columnOrder?: string[],
    priority: 'high' | 'medium' | 'low' = 'medium'
  ): Promise<string> {
    const operationId = `${reportType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const batchOp: BatchOperation = {
      id: operationId,
      reportType,
      operation: 'save',
      data: { columns, columnOrder },
      timestamp: Date.now(),
      priority
    };

    // Add to batch queue
    this.batchQueue.push(batchOp);

    // Sort by priority (high -> medium -> low)
    this.batchQueue.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    // If high priority or queue is full, process immediately
    if (priority === 'high' || this.batchQueue.length >= 10) {
      await this.processBatch();
    } else {
      // Otherwise, schedule batch processing
      this.scheduleBatchProcessing();
    }

    // Update cache immediately for responsive UI
    const cacheKey = `load_${reportType}`;
    const cachedData = {
      columns: columns.map((col, index) => ({
        id: col.id,
        width: col.width || 100,
        order: columnOrder ? columnOrder.indexOf(col.id) : index,
        visible: col.visible !== false
      })),
      timestamp: Date.now(),
      version: '2.1.0'
    };

    this.updateCache(cacheKey, cachedData);

    return operationId;
  }

  /**
   * Process batched operations
   */
  private async processBatch(): Promise<void> {
    if (this.batchQueue.length === 0) return;

    const startTime = performance.now();
    const operations = [...this.batchQueue];
    this.batchQueue = [];

    // Clear any scheduled batch processing
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    try {
      // Group operations by report type for efficiency
      const groupedOps = operations.reduce((groups, op) => {
        if (!groups[op.reportType]) {
          groups[op.reportType] = [];
        }
        groups[op.reportType].push(op);
        return groups;
      }, {} as Record<ReportType, BatchOperation[]>);

      // Process each group
      const results = await Promise.allSettled(
        Object.entries(groupedOps).map(async ([reportType, ops]) => {
          // For saves, use the latest operation data
          const latestSave = ops.filter(op => op.operation === 'save').pop();

          if (latestSave) {
            await hybridTableStorage.saveTableConfig(
              reportType as ReportType,
              latestSave.data.columns,
              latestSave.data.columnOrder
            );
          }
        })
      );

      const duration = performance.now() - startTime;
      const successCount = results.filter(r => r.status === 'fulfilled').length;

      this.recordMetric({
        operationType: 'batch_save',
        duration,
        timestamp: Date.now(),
        cacheHit: false,
        dataSize: operations.reduce((sum, op) => sum + JSON.stringify(op.data).length, 0),
        success: successCount === results.length
      });

      console.log(`⚡ Batch processing completed: ${successCount}/${results.length} operations in ${duration.toFixed(2)}ms`);

    } catch (error) {
      console.error('Batch processing failed:', error);
      // Re-queue failed operations with lower priority
      operations.forEach(op => {
        this.batchQueue.push({ ...op, priority: 'low', timestamp: Date.now() });
      });
    }
  }

  /**
   * Schedule batch processing with debouncing
   */
  private scheduleBatchProcessing(): void {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
    }

    this.batchTimer = setTimeout(() => {
      this.processBatch();
    }, this.BATCH_DELAY);
  }

  /**
   * Intelligent cache management
   */
  private updateCache(key: string, data: any): void {
    const dataStr = JSON.stringify(data);
    const dataSize = dataStr.length;

    // Use compression for large data
    if (this.cachePolicy.compressionEnabled && dataSize > this.COMPRESSION_THRESHOLD) {
      try {
        const compressed = this.compress(dataStr);
        this.compressionCache.set(key, compressed);
        console.log(`💾 Cached with compression: ${key} (${dataSize} -> ${compressed.length} bytes)`);
      } catch (error) {
        console.warn('Compression failed, using regular cache:', error);
        this.preloadCache.set(key, data);
      }
    } else {
      this.preloadCache.set(key, data);
      console.log(`💾 Cached: ${key} (${dataSize} bytes)`);
    }

    // Clean up old entries if cache is too large
    this.cleanupCache();
  }

  /**
   * Predictive preloading based on usage patterns
   */
  private predictAndPreload(currentReportType: ReportType): void {
    if (this.cachePolicy.preloadStrategy === 'predictive') {
      // Analyze recent usage patterns
      const recentMetrics = this.metrics.slice(-10);
      const reportTypeFreq = recentMetrics.reduce((freq, metric) => {
        // Extract report type from operation type if available
        const match = metric.operationType.match(/(MAIN_REPORT|PRODUCTS_REPORT)/);
        if (match) {
          const reportType = match[1] as ReportType;
          freq[reportType] = (freq[reportType] || 0) + 1;
        }
        return freq;
      }, {} as Record<string, number>);

      // Preload the most likely next report type
      const nextReportType = currentReportType === 'MAIN_REPORT' ? 'PRODUCTS_REPORT' : 'MAIN_REPORT';
      const shouldPreload = (reportTypeFreq[nextReportType] || 0) > 2;

      if (shouldPreload) {
        setTimeout(() => {
          this.preloadInBackground(nextReportType);
        }, 1000);
      }
    }
  }

  /**
   * Background preloading
   */
  private async preloadInBackground(reportType: ReportType): Promise<void> {
    try {
      const cacheKey = `load_${reportType}`;
      if (!this.preloadCache.has(cacheKey) && !this.compressionCache.has(cacheKey)) {
        console.log(`🔮 Preloading ${reportType} in background...`);
        const result = await hybridTableStorage.loadTableConfig(reportType);
        if (result) {
          this.updateCache(cacheKey, result);
        }
      }
    } catch (error) {
      console.warn('Background preloading failed:', error);
    }
  }

  /**
   * Cache cleanup to prevent memory bloat
   */
  private cleanupCache(): void {
    // Clean preload cache
    if (this.preloadCache.size > this.cachePolicy.maxSize) {
      const keysToDelete = Array.from(this.preloadCache.keys()).slice(0, this.preloadCache.size - this.cachePolicy.maxSize);
      keysToDelete.forEach(key => this.preloadCache.delete(key));
      console.log(`🧹 Cleaned up ${keysToDelete.length} preload cache entries`);
    }

    // Clean compression cache
    if (this.compressionCache.size > this.cachePolicy.maxSize) {
      const keysToDelete = Array.from(this.compressionCache.keys()).slice(0, this.compressionCache.size - this.cachePolicy.maxSize);
      keysToDelete.forEach(key => this.compressionCache.delete(key));
      console.log(`🧹 Cleaned up ${keysToDelete.length} compression cache entries`);
    }
  }

  /**
   * Simple compression/decompression (using LZ-like algorithm)
   */
  private compress(data: string): string {
    // Simple dictionary-based compression for JSON data
    const commonPatterns = [
      ['","', '\u0001'],
      ['":', '\u0002'],
      ['":true', '\u0003'],
      ['":false', '\u0004'],
      ['":null', '\u0005'],
      ['{"', '\u0006'],
      ['"}', '\u0007'],
      ['[{', '\u0008'],
      ['}]', '\u0009'],
      ['},{"', '\u000A']
    ];

    let compressed = data;
    commonPatterns.forEach(([pattern, replacement]) => {
      compressed = compressed.replace(new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), replacement);
    });

    return compressed;
  }

  private decompress(compressed: string): string {
    const commonPatterns = [
      ['\u0001', '","'],
      ['\u0002', '":'],
      ['\u0003', '":true'],
      ['\u0004', '":false'],
      ['\u0005', '":null'],
      ['\u0006', '{"'],
      ['\u0007', '"}'],
      ['\u0008', '[{'],
      ['\u0009', '}]'],
      ['\u000A', '},{"']
    ];

    let decompressed = compressed;
    commonPatterns.forEach(([replacement, pattern]) => {
      decompressed = decompressed.replace(new RegExp(replacement, 'g'), pattern);
    });

    return decompressed;
  }

  /**
   * Record performance metrics
   */
  private recordMetric(metric: PerformanceMetrics): void {
    this.metrics.push(metric);

    // Keep only recent metrics
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS);
    }

    // Log slow operations
    if (metric.duration > 1000) {
      console.warn(`🐌 Slow operation detected: ${metric.operationType} took ${metric.duration.toFixed(2)}ms`);
    }
  }

  /**
   * Get performance analytics
   */
  getPerformanceReport(): {
    averageLoadTime: number;
    cacheHitRate: number;
    slowOperations: number;
    totalOperations: number;
    compressionSavings: number;
    recommendations: string[];
  } {
    if (this.metrics.length === 0) {
      return {
        averageLoadTime: 0,
        cacheHitRate: 0,
        slowOperations: 0,
        totalOperations: 0,
        compressionSavings: 0,
        recommendations: ['Not enough data for analysis']
      };
    }

    const totalOps = this.metrics.length;
    const avgLoadTime = this.metrics.reduce((sum, m) => sum + m.duration, 0) / totalOps;
    const cacheHits = this.metrics.filter(m => m.cacheHit).length;
    const cacheHitRate = (cacheHits / totalOps) * 100;
    const slowOps = this.metrics.filter(m => m.duration > 1000).length;

    // Calculate compression savings
    const compressionSavings = Array.from(this.compressionCache.entries()).reduce((savings, [key, compressed]) => {
      const original = this.preloadCache.get(key);
      if (original) {
        const originalSize = JSON.stringify(original).length;
        return savings + (originalSize - compressed.length);
      }
      return savings;
    }, 0);

    const recommendations: string[] = [];

    if (cacheHitRate < 50) {
      recommendations.push('Consider enabling predictive preloading');
    }

    if (avgLoadTime > 500) {
      recommendations.push('Enable compression for better performance');
    }

    if (slowOps > totalOps * 0.1) {
      recommendations.push('Review network connectivity and database performance');
    }

    if (this.preloadCache.size + this.compressionCache.size > this.cachePolicy.maxSize * 0.8) {
      recommendations.push('Cache is near capacity - consider increasing limits or clearing old data');
    }

    return {
      averageLoadTime: Math.round(avgLoadTime * 100) / 100,
      cacheHitRate: Math.round(cacheHitRate * 100) / 100,
      slowOperations: slowOps,
      totalOperations: totalOps,
      compressionSavings,
      recommendations
    };
  }

  /**
   * Clear all caches and metrics (for debugging)
   */
  clearAll(): void {
    this.preloadCache.clear();
    this.compressionCache.clear();
    this.metrics = [];
    this.batchQueue = [];

    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    console.log('🧹 All performance optimizer data cleared');
  }

  /**
   * Get current cache status
   */
  getCacheStatus(): {
    preloadCache: { size: number; keys: string[] };
    compressionCache: { size: number; keys: string[] };
    batchQueue: number;
    recentMetrics: number;
  } {
    return {
      preloadCache: {
        size: this.preloadCache.size,
        keys: Array.from(this.preloadCache.keys())
      },
      compressionCache: {
        size: this.compressionCache.size,
        keys: Array.from(this.compressionCache.keys())
      },
      batchQueue: this.batchQueue.length,
      recentMetrics: this.metrics.length
    };
  }
}

// Create singleton instance
export const performanceOptimizer = new PerformanceOptimizer();

// Convenient wrapper functions
export async function loadWithOptimization(reportType: ReportType) {
  return await performanceOptimizer.loadOptimized(reportType);
}

export async function saveWithBatching(
  reportType: ReportType,
  columns: any[],
  columnOrder?: string[],
  priority?: 'high' | 'medium' | 'low'
) {
  return await performanceOptimizer.saveBatched(reportType, columns, columnOrder, priority);
}

export function getPerformanceInsights() {
  return performanceOptimizer.getPerformanceReport();
}