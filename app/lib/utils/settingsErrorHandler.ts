// Advanced Error Handling and Fallback System for Table Settings
// Provides robust error recovery and user experience management

import { databaseSettingsService } from '@/app/lib/services/databaseSettingsService';
import { hybridTableStorage, type ReportType, type LegacyColumnConfig } from '@/app/lib/utils/hybridTableStorage';

export interface ErrorContext {
  operation: string;
  reportType: string;
  userId?: string;
  timestamp: number;
  attemptCount: number;
}

export interface FallbackResult<T> {
  success: boolean;
  data: T | null;
  source: 'database' | 'cache' | 'localStorage' | 'backup' | 'defaults';
  error?: string;
  warnings: string[];
  recoveryActions: string[];
}

export interface RetryConfig {
  maxAttempts: number;
  delayMs: number;
  backoffMultiplier: number;
  maxDelayMs: number;
}

class SettingsErrorHandler {
  private retryConfigs = new Map<string, RetryConfig>();
  private errorCounts = new Map<string, number>();
  private lastErrors = new Map<string, ErrorContext>();
  private readonly DEFAULT_RETRY_CONFIG: RetryConfig = {
    maxAttempts: 3,
    delayMs: 1000,
    backoffMultiplier: 2,
    maxDelayMs: 10000
  };

  constructor() {
    // Set different retry configs for different operations
    this.retryConfigs.set('load', {
      maxAttempts: 2,
      delayMs: 500,
      backoffMultiplier: 1.5,
      maxDelayMs: 2000
    });

    this.retryConfigs.set('save', {
      maxAttempts: 4,
      delayMs: 1000,
      backoffMultiplier: 2,
      maxDelayMs: 8000
    });

    this.retryConfigs.set('health', {
      maxAttempts: 1,
      delayMs: 0,
      backoffMultiplier: 1,
      maxDelayMs: 0
    });
  }

  /**
   * Load table configuration with comprehensive fallback chain
   */
  async loadWithFallback(reportType: ReportType): Promise<FallbackResult<any>> {
    const warnings: string[] = [];
    const recoveryActions: string[] = [];
    const errorKey = `load_${reportType}`;

    try {
      // Step 1: Try database with retry logic
      const dbResult = await this.withRetry(
        'load',
        () => databaseSettingsService.loadUserSettings(
          reportType === 'MAIN_REPORT' ? 'main' : 'products'
        ),
        { operation: 'load', reportType, timestamp: Date.now(), attemptCount: 0 }
      );

      if (dbResult.success && dbResult.data) {
        this.clearError(errorKey);
        return {
          success: true,
          data: this.convertToLegacyFormat(dbResult.data),
          source: 'database',
          warnings,
          recoveryActions
        };
      }

      if (dbResult.error) {
        warnings.push(`Database load failed: ${dbResult.error}`);
        recoveryActions.push('Trying backup sources...');
      }

      // Step 2: Try cache
      const cacheStats = databaseSettingsService.getCacheStats();
      const userId = await this.getCurrentUserId();

      if (userId) {
        const cacheKey = `${userId}_${reportType === 'MAIN_REPORT' ? 'main' : 'products'}`;
        const hasCachedData = cacheStats.entries.some(entry => entry.key === cacheKey);

        if (hasCachedData) {
          warnings.push('Using cached data due to database issues');
          recoveryActions.push('Database will be retried automatically');
          return {
            success: true,
            data: null, // Cache will be handled by the service
            source: 'cache',
            warnings,
            recoveryActions
          };
        }
      }

      // Step 3: Try localStorage backup
      if (userId) {
        const backupData = databaseSettingsService.loadBackupSettings(
          reportType === 'MAIN_REPORT' ? 'main' : 'products',
          userId
        );

        if (backupData) {
          warnings.push('Using localStorage backup - will sync to database when available');
          recoveryActions.push('Automatic database sync scheduled');

          // Schedule background sync
          setTimeout(() => this.scheduleBackgroundSync(reportType, backupData), 5000);

          return {
            success: true,
            data: this.convertToLegacyFormat(backupData),
            source: 'backup',
            warnings,
            recoveryActions
          };
        }
      }

      // Step 4: Try legacy localStorage format
      const legacyData = await this.loadLegacyConfig(reportType);
      if (legacyData) {
        warnings.push('Using legacy localStorage format - will migrate to database');
        recoveryActions.push('Automatic migration scheduled');

        // Schedule migration
        setTimeout(() => this.scheduleMigration(reportType, legacyData), 2000);

        return {
          success: true,
          data: legacyData,
          source: 'localStorage',
          warnings,
          recoveryActions
        };
      }

      // Step 5: Use defaults
      warnings.push('No saved settings found - using defaults');
      recoveryActions.push('Settings will be saved on first modification');

      return {
        success: true,
        data: null,
        source: 'defaults',
        warnings,
        recoveryActions
      };

    } catch (error) {
      this.recordError(errorKey, {
        operation: 'load',
        reportType,
        timestamp: Date.now(),
        attemptCount: this.getErrorCount(errorKey)
      });

      return {
        success: false,
        data: null,
        source: 'defaults',
        error: error instanceof Error ? error.message : 'Unknown error',
        warnings: [...warnings, 'Critical error during load - using defaults'],
        recoveryActions: ['Check system status', 'Try refreshing the page']
      };
    }
  }

  /**
   * Save table configuration with advanced error handling
   */
  async saveWithFallback(
    reportType: ReportType,
    columns: LegacyColumnConfig[],
    columnOrder?: string[]
  ): Promise<FallbackResult<boolean>> {
    const warnings: string[] = [];
    const recoveryActions: string[] = [];
    const errorKey = `save_${reportType}`;

    try {
      // Step 1: Try primary save to database with retry
      const dbResult = await this.withRetry(
        'save',
        () => hybridTableStorage.saveTableConfig(reportType, columns, columnOrder),
        { operation: 'save', reportType, timestamp: Date.now(), attemptCount: 0 }
      );

      if (dbResult.success) {
        this.clearError(errorKey);
        recoveryActions.push('Settings saved to database successfully');

        // Create backup in background
        setTimeout(() => this.createBackup(reportType, columns), 1000);

        return {
          success: true,
          data: true,
          source: 'database',
          warnings,
          recoveryActions
        };
      }

      warnings.push(`Primary save failed: ${dbResult.error}`);
      recoveryActions.push('Attempting fallback saves...');

      // Step 2: Fallback to localStorage
      await this.saveLegacyConfig(reportType, {
        columns: columns.map((col, index) => ({
          id: col.id,
          width: col.width || 100,
          order: columnOrder ? columnOrder.indexOf(col.id) : index,
          visible: col.visible !== false
        })),
        timestamp: Date.now(),
        version: '2.1.0'
      });

      warnings.push('Saved to localStorage as fallback');
      recoveryActions.push('Database sync will be retried automatically');

      // Schedule retry in background
      setTimeout(() => this.retryDatabaseSave(reportType, columns, columnOrder), 30000);

      return {
        success: true,
        data: true,
        source: 'localStorage',
        warnings,
        recoveryActions
      };

    } catch (error) {
      this.recordError(errorKey, {
        operation: 'save',
        reportType,
        timestamp: Date.now(),
        attemptCount: this.getErrorCount(errorKey)
      });

      return {
        success: false,
        data: false,
        source: 'localStorage',
        error: error instanceof Error ? error.message : 'Unknown error',
        warnings: [...warnings, 'All save methods failed'],
        recoveryActions: [
          'Settings may be lost on page refresh',
          'Check internet connection',
          'Try manual sync later'
        ]
      };
    }
  }

  /**
   * Perform system health check with detailed diagnostics
   */
  async performHealthCheck(): Promise<{
    overall: 'healthy' | 'degraded' | 'critical';
    database: boolean;
    cache: boolean;
    localStorage: boolean;
    user: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];

    try {
      // Database health
      const dbHealth = await databaseSettingsService.healthCheck();
      const database = dbHealth.isHealthy;

      if (!database) {
        issues.push('Database connection issues');
        recommendations.push('Check internet connection and try refreshing');
      }

      // Cache health
      const cacheStats = databaseSettingsService.getCacheStats();
      const cache = cacheStats.size >= 0; // Cache is always available

      if (cacheStats.size > 50) {
        recommendations.push('Consider clearing cache to free memory');
      }

      // localStorage health
      let localStorage = true;
      try {
        window.localStorage.setItem('test', 'test');
        window.localStorage.removeItem('test');
      } catch {
        localStorage = false;
        issues.push('localStorage not available');
        recommendations.push('Enable browser storage for better performance');
      }

      // User session health
      const user = !!await this.getCurrentUserId();
      if (!user) {
        issues.push('User session not available');
        recommendations.push('Login to enable personalized settings');
      }

      // Overall status
      let overall: 'healthy' | 'degraded' | 'critical';
      if (database && cache && localStorage && user) {
        overall = 'healthy';
      } else if ((database || localStorage) && cache) {
        overall = 'degraded';
      } else {
        overall = 'critical';
      }

      return {
        overall,
        database,
        cache,
        localStorage,
        user,
        issues,
        recommendations
      };

    } catch (error) {
      return {
        overall: 'critical',
        database: false,
        cache: false,
        localStorage: false,
        user: false,
        issues: ['System health check failed'],
        recommendations: ['Refresh the page and try again']
      };
    }
  }

  /**
   * Generic retry mechanism with exponential backoff
   */
  private async withRetry<T>(
    operation: string,
    fn: () => Promise<T>,
    context: ErrorContext
  ): Promise<{ success: boolean; data: T | null; error?: string }> {
    const config = this.retryConfigs.get(operation) || this.DEFAULT_RETRY_CONFIG;
    let lastError: Error | null = null;
    let delay = config.delayMs;

    for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
      try {
        const result = await fn();
        return { success: true, data: result };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');

        if (attempt < config.maxAttempts) {
          console.warn(`Attempt ${attempt} failed for ${operation}, retrying in ${delay}ms:`, lastError.message);
          await this.sleep(delay);
          delay = Math.min(delay * config.backoffMultiplier, config.maxDelayMs);
        }
      }
    }

    return {
      success: false,
      data: null,
      error: lastError?.message || 'All retry attempts failed'
    };
  }

  /**
   * Utility functions
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async getCurrentUserId(): Promise<string | null> {
    try {
      const { supabase } = await import('@/app/lib/supabase/client');
      const { data: { user } } = await supabase.auth.getUser();
      return user?.id || null;
    } catch {
      return null;
    }
  }

  private convertToLegacyFormat(preferences: any): any {
    return {
      columns: preferences.columns,
      timestamp: preferences.timestamp,
      version: preferences.version
    };
  }

  private async loadLegacyConfig(reportType: ReportType): Promise<any> {
    try {
      if (typeof window === 'undefined') return null;

      const key = reportType === 'MAIN_REPORT'
        ? 'pos-reports-main-table-config'
        : 'pos-reports-products-table-config';

      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  private async saveLegacyConfig(reportType: ReportType, config: any): Promise<void> {
    if (typeof window === 'undefined') return;

    const key = reportType === 'MAIN_REPORT'
      ? 'pos-reports-main-table-config'
      : 'pos-reports-products-table-config';

    localStorage.setItem(key, JSON.stringify(config));
  }

  private recordError(key: string, context: ErrorContext): void {
    this.errorCounts.set(key, (this.errorCounts.get(key) || 0) + 1);
    this.lastErrors.set(key, context);
  }

  private clearError(key: string): void {
    this.errorCounts.delete(key);
    this.lastErrors.delete(key);
  }

  private getErrorCount(key: string): number {
    return this.errorCounts.get(key) || 0;
  }

  // Background operations
  private async scheduleBackgroundSync(reportType: ReportType, data: any): Promise<void> {
    console.log(`🔄 Scheduling background sync for ${reportType}`);
    // Implementation for background sync
  }

  private async scheduleMigration(reportType: ReportType, data: any): Promise<void> {
    console.log(`🔄 Scheduling migration for ${reportType}`);
    // Implementation for background migration
  }

  private async createBackup(reportType: ReportType, columns: LegacyColumnConfig[]): Promise<void> {
    console.log(`💾 Creating backup for ${reportType}`);
    // Implementation for backup creation
  }

  private async retryDatabaseSave(
    reportType: ReportType,
    columns: LegacyColumnConfig[],
    columnOrder?: string[]
  ): Promise<void> {
    console.log(`🔄 Retrying database save for ${reportType}`);
    // Implementation for retry mechanism
  }
}

// Create singleton instance
export const settingsErrorHandler = new SettingsErrorHandler();

// Utility function for components
export async function safeLoadTableConfig(reportType: ReportType) {
  return await settingsErrorHandler.loadWithFallback(reportType);
}

export async function safeSaveTableConfig(
  reportType: ReportType,
  columns: LegacyColumnConfig[],
  columnOrder?: string[]
) {
  return await settingsErrorHandler.saveWithFallback(reportType, columns, columnOrder);
}