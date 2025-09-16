/**
 * Performance debugging and monitoring utilities
 */
import React from 'react';

export class PerformanceDebugger {
  private static instance: PerformanceDebugger;
  private metrics: Map<string, any> = new Map();
  private enabled: boolean = process.env.NODE_ENV === 'development';

  static getInstance(): PerformanceDebugger {
    if (!PerformanceDebugger.instance) {
      PerformanceDebugger.instance = new PerformanceDebugger();
    }
    return PerformanceDebugger.instance;
  }

  // Measure function execution time
  measureExecutionTime<T>(name: string, fn: () => T): T {
    if (!this.enabled) return fn();
    
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    
    this.logMetric(name, {
      duration: end - start,
      timestamp: new Date().toISOString(),
      type: 'execution_time'
    });
    
    return result;
  }

  // Measure async function execution time
  async measureAsyncExecutionTime<T>(name: string, fn: () => Promise<T>): Promise<T> {
    if (!this.enabled) return await fn();
    
    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    
    this.logMetric(name, {
      duration: end - start,
      timestamp: new Date().toISOString(),
      type: 'async_execution_time'
    });
    
    return result;
  }

  // Start timing a process
  startTimer(name: string): string {
    if (!this.enabled) return '';
    
    const timerId = `${name}_${Date.now()}`;
    this.metrics.set(timerId, {
      start: performance.now(),
      name,
      type: 'timer'
    });
    return timerId;
  }

  // End timing a process
  endTimer(timerId: string): void {
    if (!this.enabled || !timerId) return;
    
    const metric = this.metrics.get(timerId);
    if (!metric) return;
    
    const end = performance.now();
    const duration = end - metric.start;
    
    this.logMetric(metric.name, {
      duration,
      timestamp: new Date().toISOString(),
      type: 'timer_result'
    });
    
    this.metrics.delete(timerId);
  }

  // Log API call performance
  logApiCall(endpoint: string, method: string, duration: number, status: number): void {
    if (!this.enabled) return;
    
    this.logMetric(`API_${method}_${endpoint}`, {
      duration,
      status,
      method,
      endpoint,
      timestamp: new Date().toISOString(),
      type: 'api_call'
    });
  }

  // Log component render time
  logComponentRender(componentName: string, duration: number, props?: any): void {
    if (!this.enabled) return;
    
    this.logMetric(`RENDER_${componentName}`, {
      duration,
      props: props ? Object.keys(props) : [],
      timestamp: new Date().toISOString(),
      type: 'component_render'
    });
  }

  // Log memory usage
  logMemoryUsage(label: string): void {
    if (!this.enabled) return;
    
    if (typeof window !== 'undefined' && 'memory' in performance) {
      const memory = (performance as any).memory;
      this.logMetric(`MEMORY_${label}`, {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
        timestamp: new Date().toISOString(),
        type: 'memory_usage'
      });
    }
  }

  // Log database query performance
  logDatabaseQuery(query: string, duration: number, recordCount?: number): void {
    if (!this.enabled) return;
    
    this.logMetric(`DB_QUERY`, {
      query,
      duration,
      recordCount,
      timestamp: new Date().toISOString(),
      type: 'database_query'
    });
  }

  // Get performance summary
  getPerformanceSummary(): any {
    const summary = {
      slowApiCalls: [] as any[],
      slowComponents: [] as any[],
      memoryUsage: [] as any[],
      databaseQueries: [] as any[],
      totalMetrics: this.metrics.size
    };

    this.metrics.forEach((metric, key) => {
      if (metric.type === 'api_call' && metric.duration > 1000) {
        summary.slowApiCalls.push({ key, ...metric });
      } else if (metric.type === 'component_render' && metric.duration > 100) {
        summary.slowComponents.push({ key, ...metric });
      } else if (metric.type === 'memory_usage') {
        summary.memoryUsage.push({ key, ...metric });
      } else if (metric.type === 'database_query' && metric.duration > 500) {
        summary.databaseQueries.push({ key, ...metric });
      }
    });

    return summary;
  }

  // Clear all metrics
  clearMetrics(): void {
    this.metrics.clear();
  }

  // Export metrics for analysis
  exportMetrics(): string {
    const metricsArray = Array.from(this.metrics.entries()).map(([key, value]) => ({
      key,
      ...value
    }));
    return JSON.stringify(metricsArray, null, 2);
  }

  private logMetric(name: string, data: any): void {
    if (!this.enabled) return;
    
    console.group(`🚀 Performance: ${name}`);
    console.log('Duration:', `${data.duration?.toFixed(2)}ms`);
    console.log('Details:', data);
    console.groupEnd();
    
    // Store metric for later analysis
    this.metrics.set(`${name}_${Date.now()}`, data);
  }
}

// React Hook for performance monitoring
export function usePerformanceMonitor(componentName: string) {
  const perfDebugger = PerformanceDebugger.getInstance();
  
  const measureRender = (fn: () => void) => {
    perfDebugger.measureExecutionTime(`${componentName}_render`, fn);
  };

  const logComponentMount = () => {
    perfDebugger.logMetric(`${componentName}_mount`, {
      timestamp: new Date().toISOString(),
      type: 'component_lifecycle'
    });
  };

  const logComponentUnmount = () => {
    perfDebugger.logMetric(`${componentName}_unmount`, {
      timestamp: new Date().toISOString(),
      type: 'component_lifecycle'
    });
  };

  return {
    measureRender,
    logComponentMount,
    logComponentUnmount,
    debugger: perfDebugger
  };
}

// HOC for automatic performance monitoring
export function withPerformanceMonitor<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName?: string
) {
  const displayName = componentName || WrappedComponent.displayName || WrappedComponent.name || 'Component';
  
  const MemoizedComponent = React.memo((props: P) => {
    const perfDebugger = PerformanceDebugger.getInstance();
    
    React.useEffect(() => {
      perfDebugger.logComponentRender(displayName, 0, props);
      
      return () => {
        perfDebugger.logMetric(`${displayName}_unmount`, {
          timestamp: new Date().toISOString(),
          type: 'component_lifecycle'
        });
      };
    }, []);

    const renderStart = performance.now();
    const result = React.createElement(WrappedComponent, props);
    const renderEnd = performance.now();
    
    perfDebugger.logComponentRender(displayName, renderEnd - renderStart, props);
    
    return result;
  });

  MemoizedComponent.displayName = `withPerformanceMonitor(${displayName})`;
  return MemoizedComponent;
}

// Export singleton instance
export const performanceDebugger = PerformanceDebugger.getInstance();