/**
 * Performance Monitoring Utility
 * Tracks component render times, database query performance, and user interactions
 */

interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private timers: Map<string, number> = new Map();
  private readonly MAX_METRICS = 100;

  /**
   * Start timing an operation
   */
  startTimer(name: string): void {
    this.timers.set(name, performance.now());
  }

  /**
   * End timing and record metric
   */
  endTimer(name: string, metadata?: Record<string, any>): number | null {
    const startTime = this.timers.get(name);
    if (!startTime) {
      // Silent fail in development mode with double-invoke effects
      if (import.meta.env.DEV) {
        return null;
      }
      console.warn(`Timer "${name}" was not started`);
      return null;
    }

    const duration = performance.now() - startTime;
    this.timers.delete(name);

    this.recordMetric(name, duration, metadata);
    return duration;
  }

  /**
   * Record a metric manually
   */
  recordMetric(name: string, duration: number, metadata?: Record<string, any>): void {
    const metric: PerformanceMetric = {
      name,
      duration,
      timestamp: Date.now(),
      metadata
    };

    this.metrics.push(metric);

    // Keep only recent metrics
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics.shift();
    }

    // Log slow operations
    if (duration > 1000) {
      console.warn(`Slow operation detected: ${name} took ${duration.toFixed(2)}ms`, metadata);
    }
  }

  /**
   * Get average duration for a specific metric
   */
  getAverage(name: string): number | null {
    const filtered = this.metrics.filter(m => m.name === name);
    if (filtered.length === 0) return null;

    const sum = filtered.reduce((acc, m) => acc + m.duration, 0);
    return sum / filtered.length;
  }

  /**
   * Get all metrics for a specific name
   */
  getMetrics(name: string): PerformanceMetric[] {
    return this.metrics.filter(m => m.name === name);
  }

  /**
   * Get summary statistics
   */
  getSummary(): Record<string, { avg: number; min: number; max: number; count: number }> {
    const summary: Record<string, { avg: number; min: number; max: number; count: number }> = {};

    const grouped = new Map<string, number[]>();
    this.metrics.forEach(metric => {
      if (!grouped.has(metric.name)) {
        grouped.set(metric.name, []);
      }
      grouped.get(metric.name)!.push(metric.duration);
    });

    grouped.forEach((durations, name) => {
      summary[name] = {
        avg: durations.reduce((a, b) => a + b, 0) / durations.length,
        min: Math.min(...durations),
        max: Math.max(...durations),
        count: durations.length
      };
    });

    return summary;
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
    this.timers.clear();
  }

  /**
   * Export metrics for analysis
   */
  export(): PerformanceMetric[] {
    return [...this.metrics];
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * Higher-order function to measure async function performance
 */
export function measureAsync<T>(
  name: string,
  fn: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<T> {
  performanceMonitor.startTimer(name);
  return fn()
    .then(result => {
      performanceMonitor.endTimer(name, metadata);
      return result;
    })
    .catch(error => {
      performanceMonitor.endTimer(name, { ...metadata, error: true });
      throw error;
    });
}

/**
 * Higher-order function to measure sync function performance
 */
export function measureSync<T>(
  name: string,
  fn: () => T,
  metadata?: Record<string, any>
): T {
  performanceMonitor.startTimer(name);
  try {
    const result = fn();
    performanceMonitor.endTimer(name, metadata);
    return result;
  } catch (error) {
    performanceMonitor.endTimer(name, { ...metadata, error: true });
    throw error;
  }
}

/**
 * React hook for measuring component render time
 */
export function useMeasureRender(componentName: string) {
  const renderStartTime = performance.now();

  return () => {
    const duration = performance.now() - renderStartTime;
    performanceMonitor.recordMetric(`render:${componentName}`, duration);
  };
}
