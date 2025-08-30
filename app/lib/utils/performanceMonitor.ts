// Performance monitoring utility for development
// Helps track the impact of optimizations

interface PerformanceMetrics {
  renderTime: number
  queryCount: number
  cacheHits: number
  cacheMisses: number
  totalDataSize: number
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    renderTime: 0,
    queryCount: 0,
    cacheHits: 0,
    cacheMisses: 0,
    totalDataSize: 0
  }

  private startTimes: Map<string, number> = new Map()

  startTimer(label: string): void {
    this.startTimes.set(label, performance.now())
  }

  endTimer(label: string): number {
    const startTime = this.startTimes.get(label)
    if (!startTime) return 0
    
    const duration = performance.now() - startTime
    this.startTimes.delete(label)
    
    if (label === 'render') {
      this.metrics.renderTime = duration
    }
    
    return duration
  }

  incrementQueryCount(): void {
    this.metrics.queryCount++
  }

  incrementCacheHit(): void {
    this.metrics.cacheHits++
  }

  incrementCacheMiss(): void {
    this.metrics.cacheMisses++
  }

  setDataSize(size: number): void {
    this.metrics.totalDataSize = size
  }

  getMetrics(): PerformanceMetrics & { cacheHitRatio: number } {
    const total = this.metrics.cacheHits + this.metrics.cacheMisses
    const cacheHitRatio = total > 0 ? this.metrics.cacheHits / total : 0
    
    return {
      ...this.metrics,
      cacheHitRatio
    }
  }

  logMetrics(): void {
    const metrics = this.getMetrics()
    console.group('🚀 Performance Metrics')
    console.log(`⏱️  Render Time: ${metrics.renderTime.toFixed(2)}ms`)
    console.log(`📊 Query Count: ${metrics.queryCount}`)
    console.log(`💾 Cache Hit Ratio: ${(metrics.cacheHitRatio * 100).toFixed(1)}%`)
    console.log(`📈 Data Size: ${(metrics.totalDataSize / 1024).toFixed(2)}KB`)
    console.groupEnd()
  }

  reset(): void {
    this.metrics = {
      renderTime: 0,
      queryCount: 0,
      cacheHits: 0,
      cacheMisses: 0,
      totalDataSize: 0
    }
    this.startTimes.clear()
  }
}

// Global performance monitor instance
export const perfMonitor = new PerformanceMonitor()

// Helper hook for React components
export const usePerformanceMonitor = (componentName: string) => {
  const startRender = () => perfMonitor.startTimer(`${componentName}-render`)
  const endRender = () => perfMonitor.endTimer(`${componentName}-render`)
  
  return { startRender, endRender }
}