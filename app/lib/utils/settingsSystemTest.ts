// Comprehensive Testing Suite for the Enhanced Table Settings System
// Tests database persistence, fallback mechanisms, and performance optimizations

import { databaseSettingsService } from '@/app/lib/services/databaseSettingsService';
import { hybridTableStorage, type ReportType } from '@/app/lib/utils/hybridTableStorage';
import { settingsErrorHandler } from '@/app/lib/utils/settingsErrorHandler';
import { performanceOptimizer, getPerformanceInsights } from '@/app/lib/utils/performanceOptimizer';

interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  details: string;
  error?: string;
}

interface TestSuite {
  name: string;
  tests: TestResult[];
  passed: number;
  failed: number;
  totalDuration: number;
}

class SettingsSystemTester {
  private testResults: TestSuite[] = [];

  /**
   * Run complete test suite
   */
  async runAllTests(): Promise<{
    overallSuccess: boolean;
    summary: string;
    suites: TestSuite[];
    recommendations: string[];
  }> {
    console.log('🧪 Starting comprehensive settings system tests...');

    const startTime = performance.now();

    // Run all test suites
    const suites = await Promise.all([
      this.testDatabaseService(),
      this.testHybridStorage(),
      this.testErrorHandling(),
      this.testPerformanceOptimizer(),
      this.testIntegrationScenarios()
    ]);

    const totalDuration = performance.now() - startTime;
    const totalTests = suites.reduce((sum, suite) => sum + suite.tests.length, 0);
    const totalPassed = suites.reduce((sum, suite) => sum + suite.passed, 0);
    const totalFailed = suites.reduce((sum, suite) => sum + suite.failed, 0);

    const overallSuccess = totalFailed === 0;

    const summary = `Tests completed in ${totalDuration.toFixed(2)}ms\n` +
      `Total: ${totalTests} tests, ${totalPassed} passed, ${totalFailed} failed\n` +
      `Success rate: ${((totalPassed / totalTests) * 100).toFixed(1)}%`;

    // Generate recommendations
    const recommendations = this.generateRecommendations(suites);

    console.log(`${overallSuccess ? '✅' : '❌'} ${summary}`);

    return {
      overallSuccess,
      summary,
      suites,
      recommendations
    };
  }

  /**
   * Test Database Service functionality
   */
  private async testDatabaseService(): Promise<TestSuite> {
    const suite: TestSuite = {
      name: 'Database Service Tests',
      tests: [],
      passed: 0,
      failed: 0,
      totalDuration: 0
    };

    // Test 1: Health Check
    const healthTest = await this.runTest(
      'Database Health Check',
      async () => {
        const health = await databaseSettingsService.healthCheck();
        if (!health.isHealthy) {
          throw new Error(`Health issues: ${health.errors.join(', ')}`);
        }
        return `Database is healthy. User: ${health.user}, DB: ${health.database}`;
      }
    );
    suite.tests.push(healthTest);

    // Test 2: Save Settings
    const saveTest = await this.runTest(
      'Save User Settings',
      async () => {
        const testColumns = [
          { id: 'test1', width: 100, order: 0, visible: true },
          { id: 'test2', width: 150, order: 1, visible: false },
          { id: 'test3', width: 200, order: 2, visible: true }
        ];

        const success = await databaseSettingsService.saveUserSettings(
          'test_report',
          testColumns
        );

        if (!success) {
          throw new Error('Failed to save settings');
        }

        return `Saved ${testColumns.length} columns to database`;
      }
    );
    suite.tests.push(saveTest);

    // Test 3: Load Settings
    const loadTest = await this.runTest(
      'Load User Settings',
      async () => {
        const settings = await databaseSettingsService.loadUserSettings('test_report');

        if (!settings) {
          throw new Error('No settings returned');
        }

        if (!settings.columns || settings.columns.length !== 3) {
          throw new Error(`Expected 3 columns, got ${settings.columns?.length}`);
        }

        return `Loaded ${settings.columns.length} columns from database`;
      }
    );
    suite.tests.push(loadTest);

    // Test 4: Cache Performance
    const cacheTest = await this.runTest(
      'Cache Performance',
      async () => {
        // First load (should hit database)
        const start1 = performance.now();
        await databaseSettingsService.loadUserSettings('test_report');
        const dbTime = performance.now() - start1;

        // Second load (should hit cache)
        const start2 = performance.now();
        await databaseSettingsService.loadUserSettings('test_report');
        const cacheTime = performance.now() - start2;

        if (cacheTime >= dbTime) {
          throw new Error(`Cache not faster: DB=${dbTime.toFixed(2)}ms, Cache=${cacheTime.toFixed(2)}ms`);
        }

        return `Cache is ${(dbTime / cacheTime).toFixed(1)}x faster (DB: ${dbTime.toFixed(2)}ms, Cache: ${cacheTime.toFixed(2)}ms)`;
      }
    );
    suite.tests.push(cacheTest);

    suite.passed = suite.tests.filter(t => t.passed).length;
    suite.failed = suite.tests.filter(t => !t.passed).length;
    suite.totalDuration = suite.tests.reduce((sum, t) => sum + t.duration, 0);

    return suite;
  }

  /**
   * Test Hybrid Storage functionality
   */
  private async testHybridStorage(): Promise<TestSuite> {
    const suite: TestSuite = {
      name: 'Hybrid Storage Tests',
      tests: [],
      passed: 0,
      failed: 0,
      totalDuration: 0
    };

    // Test 1: Load Configuration
    const loadTest = await this.runTest(
      'Load Table Configuration',
      async () => {
        const config = await hybridTableStorage.loadTableConfig('MAIN_REPORT');
        // Should return either saved config or null (not error)
        return config ? `Loaded config with ${config.columns.length} columns` : 'No saved config (using defaults)';
      }
    );
    suite.tests.push(loadTest);

    // Test 2: Save Configuration
    const saveTest = await this.runTest(
      'Save Table Configuration',
      async () => {
        const testColumns = [
          { id: 'col1', width: 120, visible: true },
          { id: 'col2', width: 200, visible: false },
          { id: 'col3', width: 150, visible: true }
        ];

        await hybridTableStorage.saveTableConfig('MAIN_REPORT', testColumns);

        // Verify it was saved
        const loaded = await hybridTableStorage.loadTableConfig('MAIN_REPORT');
        if (!loaded || loaded.columns.length !== 3) {
          throw new Error('Configuration not saved correctly');
        }

        return `Saved and verified ${testColumns.length} columns`;
      }
    );
    suite.tests.push(saveTest);

    // Test 3: Update Column Visibility
    const visibilityTest = await this.runTest(
      'Update Column Visibility',
      async () => {
        const visibilityMap = { col1: true, col2: true, col3: false };
        const allColumns = [
          { id: 'col1', width: 120, visible: true },
          { id: 'col2', width: 200, visible: false },
          { id: 'col3', width: 150, visible: true }
        ];

        await hybridTableStorage.updateColumnVisibility('MAIN_REPORT', visibilityMap, allColumns);

        const loaded = await hybridTableStorage.loadTableConfig('MAIN_REPORT');
        const visibleCount = loaded?.columns.filter(c => c.visible).length || 0;

        return `Updated visibility: ${visibleCount} visible columns`;
      }
    );
    suite.tests.push(visibilityTest);

    // Test 4: System Status
    const statusTest = await this.runTest(
      'System Status Check',
      async () => {
        const status = await hybridTableStorage.getSystemStatus();

        const healthLevel = status.health.isHealthy ? 'healthy' : 'degraded';
        return `System ${healthLevel}: DB=${status.database}, Cache=${status.cache}, Legacy=${status.legacy}`;
      }
    );
    suite.tests.push(statusTest);

    suite.passed = suite.tests.filter(t => t.passed).length;
    suite.failed = suite.tests.filter(t => !t.passed).length;
    suite.totalDuration = suite.tests.reduce((sum, t) => sum + t.duration, 0);

    return suite;
  }

  /**
   * Test Error Handling and Fallback mechanisms
   */
  private async testErrorHandling(): Promise<TestSuite> {
    const suite: TestSuite = {
      name: 'Error Handling Tests',
      tests: [],
      passed: 0,
      failed: 0,
      totalDuration: 0
    };

    // Test 1: Load with fallback
    const fallbackLoadTest = await this.runTest(
      'Load with Fallback Chain',
      async () => {
        const result = await settingsErrorHandler.loadWithFallback('MAIN_REPORT');

        if (!result.success && !result.data) {
          throw new Error('Fallback chain completely failed');
        }

        return `Loaded from ${result.source}, warnings: ${result.warnings.length}`;
      }
    );
    suite.tests.push(fallbackLoadTest);

    // Test 2: Save with fallback
    const fallbackSaveTest = await this.runTest(
      'Save with Fallback',
      async () => {
        const testColumns = [
          { id: 'test1', width: 100, visible: true },
          { id: 'test2', width: 200, visible: false }
        ];

        const result = await settingsErrorHandler.saveWithFallback('MAIN_REPORT', testColumns);

        if (!result.success) {
          throw new Error(`All save methods failed: ${result.error}`);
        }

        return `Saved via ${result.source}, warnings: ${result.warnings.length}`;
      }
    );
    suite.tests.push(fallbackSaveTest);

    // Test 3: Health Check with Diagnostics
    const healthCheckTest = await this.runTest(
      'System Health Diagnostics',
      async () => {
        const health = await settingsErrorHandler.performHealthCheck();

        const issueCount = health.issues.length;
        const recCount = health.recommendations.length;

        return `Health: ${health.overall}, Issues: ${issueCount}, Recommendations: ${recCount}`;
      }
    );
    suite.tests.push(healthCheckTest);

    suite.passed = suite.tests.filter(t => t.passed).length;
    suite.failed = suite.tests.filter(t => !t.passed).length;
    suite.totalDuration = suite.tests.reduce((sum, t) => sum + t.duration, 0);

    return suite;
  }

  /**
   * Test Performance Optimizer
   */
  private async testPerformanceOptimizer(): Promise<TestSuite> {
    const suite: TestSuite = {
      name: 'Performance Optimizer Tests',
      tests: [],
      passed: 0,
      failed: 0,
      totalDuration: 0
    };

    // Test 1: Optimized Loading
    const optimizedLoadTest = await this.runTest(
      'Optimized Load Performance',
      async () => {
        const result = await performanceOptimizer.loadOptimized('MAIN_REPORT');

        if (result.metrics.loadTime > 2000) { // 2 seconds is too slow
          throw new Error(`Load too slow: ${result.metrics.loadTime}ms`);
        }

        return `Loaded in ${result.metrics.loadTime.toFixed(2)}ms from ${result.metrics.source}`;
      }
    );
    suite.tests.push(optimizedLoadTest);

    // Test 2: Batched Saves
    const batchedSaveTest = await this.runTest(
      'Batched Save Operations',
      async () => {
        const testColumns = [
          { id: 'batch1', width: 100, visible: true },
          { id: 'batch2', width: 150, visible: true }
        ];

        const operationId = await performanceOptimizer.saveBatched('MAIN_REPORT', testColumns, undefined, 'high');

        if (!operationId) {
          throw new Error('No operation ID returned');
        }

        return `Batched save queued: ${operationId}`;
      }
    );
    suite.tests.push(batchedSaveTest);

    // Test 3: Performance Analytics
    const analyticsTest = await this.runTest(
      'Performance Analytics',
      async () => {
        const insights = getPerformanceInsights();

        if (insights.totalOperations === 0) {
          throw new Error('No performance data available');
        }

        return `Analyzed ${insights.totalOperations} ops, avg: ${insights.averageLoadTime}ms, cache hit: ${insights.cacheHitRate}%`;
      }
    );
    suite.tests.push(analyticsTest);

    // Test 4: Cache Status
    const cacheStatusTest = await this.runTest(
      'Cache Status Check',
      async () => {
        const status = performanceOptimizer.getCacheStatus();

        const totalCached = status.preloadCache.size + status.compressionCache.size;
        return `Cache status: ${totalCached} items, ${status.batchQueue} queued, ${status.recentMetrics} metrics`;
      }
    );
    suite.tests.push(cacheStatusTest);

    suite.passed = suite.tests.filter(t => t.passed).length;
    suite.failed = suite.tests.filter(t => !t.passed).length;
    suite.totalDuration = suite.tests.reduce((sum, t) => sum + t.duration, 0);

    return suite;
  }

  /**
   * Test realistic integration scenarios
   */
  private async testIntegrationScenarios(): Promise<TestSuite> {
    const suite: TestSuite = {
      name: 'Integration Scenarios',
      tests: [],
      passed: 0,
      failed: 0,
      totalDuration: 0
    };

    // Test 1: User workflow simulation
    const workflowTest = await this.runTest(
      'Complete User Workflow',
      async () => {
        // 1. Load initial config
        let config = await hybridTableStorage.loadTableConfig('PRODUCTS_REPORT');

        // 2. Modify column settings
        const columns = [
          { id: 'product_name', width: 250, visible: true },
          { id: 'price', width: 100, visible: true },
          { id: 'category', width: 150, visible: false },
          { id: 'stock', width: 80, visible: true }
        ];

        // 3. Save changes
        await hybridTableStorage.saveTableConfig('PRODUCTS_REPORT', columns);

        // 4. Reload and verify
        config = await hybridTableStorage.loadTableConfig('PRODUCTS_REPORT');

        if (!config || config.columns.length !== 4) {
          throw new Error('Workflow failed: config not saved properly');
        }

        const visibleCols = config.columns.filter(c => c.visible).length;
        return `Workflow completed: ${visibleCols}/4 columns visible`;
      }
    );
    suite.tests.push(workflowTest);

    // Test 2: Multiple report types
    const multiReportTest = await this.runTest(
      'Multiple Report Types',
      async () => {
        // Save different configs for different reports
        const mainColumns = [{ id: 'main1', width: 100, visible: true }];
        const productsColumns = [
          { id: 'prod1', width: 200, visible: true },
          { id: 'prod2', width: 150, visible: false }
        ];

        await Promise.all([
          hybridTableStorage.saveTableConfig('MAIN_REPORT', mainColumns),
          hybridTableStorage.saveTableConfig('PRODUCTS_REPORT', productsColumns)
        ]);

        // Load both and verify they're different
        const [mainConfig, prodConfig] = await Promise.all([
          hybridTableStorage.loadTableConfig('MAIN_REPORT'),
          hybridTableStorage.loadTableConfig('PRODUCTS_REPORT')
        ]);

        if (!mainConfig || !prodConfig) {
          throw new Error('Failed to load one or both configs');
        }

        if (mainConfig.columns.length === prodConfig.columns.length) {
          throw new Error('Configs are not properly isolated');
        }

        return `Main: ${mainConfig.columns.length} cols, Products: ${prodConfig.columns.length} cols`;
      }
    );
    suite.tests.push(multiReportTest);

    // Test 3: Rapid updates (stress test)
    const stressTest = await this.runTest(
      'Rapid Updates Stress Test',
      async () => {
        const updates = 5; // Reduced for faster testing
        const promises = [];

        for (let i = 0; i < updates; i++) {
          const columns = [
            { id: 'stress1', width: 100 + i * 10, visible: i % 2 === 0 },
            { id: 'stress2', width: 200 + i * 5, visible: true }
          ];

          promises.push(
            performanceOptimizer.saveBatched('MAIN_REPORT', columns, undefined, 'medium')
          );
        }

        const results = await Promise.all(promises);

        if (results.some(r => !r)) {
          throw new Error('Some rapid updates failed');
        }

        return `Completed ${updates} rapid updates successfully`;
      }
    );
    suite.tests.push(stressTest);

    suite.passed = suite.tests.filter(t => t.passed).length;
    suite.failed = suite.tests.filter(t => !t.passed).length;
    suite.totalDuration = suite.tests.reduce((sum, t) => sum + t.duration, 0);

    return suite;
  }

  /**
   * Run a single test with error handling and timing
   */
  private async runTest(name: string, testFn: () => Promise<string>): Promise<TestResult> {
    const startTime = performance.now();

    try {
      const details = await testFn();
      const duration = performance.now() - startTime;

      console.log(`✅ ${name}: ${details} (${duration.toFixed(2)}ms)`);

      return {
        name,
        passed: true,
        duration,
        details
      };
    } catch (error) {
      const duration = performance.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      console.error(`❌ ${name}: ${errorMessage} (${duration.toFixed(2)}ms)`);

      return {
        name,
        passed: false,
        duration,
        details: 'Test failed',
        error: errorMessage
      };
    }
  }

  /**
   * Generate recommendations based on test results
   */
  private generateRecommendations(suites: TestSuite[]): string[] {
    const recommendations: string[] = [];

    // Check for failed tests
    const failedSuites = suites.filter(s => s.failed > 0);
    if (failedSuites.length > 0) {
      recommendations.push(`${failedSuites.length} test suite(s) have failures - review error details`);
    }

    // Check performance
    const totalDuration = suites.reduce((sum, s) => sum + s.totalDuration, 0);
    if (totalDuration > 10000) { // 10 seconds
      recommendations.push('Tests are running slowly - consider optimizing database queries');
    }

    // Check database health
    const dbSuite = suites.find(s => s.name === 'Database Service Tests');
    if (dbSuite && dbSuite.failed > 0) {
      recommendations.push('Database issues detected - check connection and permissions');
    }

    // Check error handling
    const errorSuite = suites.find(s => s.name === 'Error Handling Tests');
    if (errorSuite && errorSuite.failed > 0) {
      recommendations.push('Error handling issues - ensure fallback mechanisms are working');
    }

    if (recommendations.length === 0) {
      recommendations.push('All tests passed! System is working optimally.');
    }

    return recommendations;
  }

  /**
   * Generate detailed test report
   */
  generateDetailedReport(results: any): string {
    let report = '# Settings System Test Report\n\n';

    report += `## Summary\n`;
    report += `- **Overall Status**: ${results.overallSuccess ? '✅ PASSED' : '❌ FAILED'}\n`;
    report += `- **Total Duration**: ${results.suites.reduce((sum: number, s: TestSuite) => sum + s.totalDuration, 0).toFixed(2)}ms\n\n`;

    results.suites.forEach((suite: TestSuite) => {
      report += `## ${suite.name}\n`;
      report += `- Tests: ${suite.tests.length}\n`;
      report += `- Passed: ${suite.passed}\n`;
      report += `- Failed: ${suite.failed}\n`;
      report += `- Duration: ${suite.totalDuration.toFixed(2)}ms\n\n`;

      suite.tests.forEach((test: TestResult) => {
        const status = test.passed ? '✅' : '❌';
        report += `### ${status} ${test.name}\n`;
        report += `- **Duration**: ${test.duration.toFixed(2)}ms\n`;
        report += `- **Details**: ${test.details}\n`;
        if (test.error) {
          report += `- **Error**: ${test.error}\n`;
        }
        report += '\n';
      });
    });

    if (results.recommendations.length > 0) {
      report += `## Recommendations\n`;
      results.recommendations.forEach((rec: string) => {
        report += `- ${rec}\n`;
      });
      report += '\n';
    }

    return report;
  }
}

// Create singleton instance
export const settingsSystemTester = new SettingsSystemTester();

// Convenience functions
export async function runQuickTest() {
  console.log('🏃‍♂️ Running quick system test...');
  const results = await settingsSystemTester.runAllTests();
  return results.overallSuccess;
}

export async function runFullTestWithReport() {
  const results = await settingsSystemTester.runAllTests();
  const report = settingsSystemTester.generateDetailedReport(results);
  console.log(report);
  return results;
}