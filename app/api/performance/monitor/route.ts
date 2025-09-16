import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/backend/config/db';
import QuestionEnhanced from '@/backend/models/QuestionEnhanced';
import TestEnhanced from '@/backend/models/TestEnhanced';
import AttemptEnhanced from '@/backend/models/AttemptEnhanced';
import MaterialEnhanced from '@/backend/models/MaterialEnhanced';
import CacheService from '@/backend/services/cache-service';
import DatabaseOptimizer from '@/backend/utils/database-optimizer';

interface PerformanceMetrics {
  system: {
    timestamp: string;
    uptime: number;
    memoryUsage: NodeJS.MemoryUsage;
    cpuUsage: number;
  };
  database: {
    connections: number;
    queryCount: number;
    averageQueryTime: number;
    slowQueries: any[];
    collections: Record<string, any>;
  };
  cache: {
    hitRate: number;
    keyCount: number;
    memoryUsage: string;
    connected: boolean;
  };
  api: {
    totalRequests: number;
    averageResponseTime: number;
    errorRate: number;
    endpoints: Record<string, any>;
  };
  application: {
    totalUsers: number;
    totalQuestions: number;
    totalTests: number;
    totalAttempts: number;
    totalMaterials: number;
    activeUsers: number;
  };
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: any = {};
  private cache: CacheService;
  
  private constructor() {
    // Initialize cache service for monitoring
    try {
      this.cache = CacheService.getInstance({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD
      });
    } catch (error) {
      console.warn('Cache service not available for monitoring');
    }
  }
  
  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }
  
  /**
   * Collect system metrics
   */
  async collectSystemMetrics(): Promise<any> {
    const memoryUsage = process.memoryUsage();
    
    // CPU usage calculation (simplified)
    const startUsage = process.cpuUsage();
    await new Promise(resolve => setTimeout(resolve, 100));
    const endUsage = process.cpuUsage(startUsage);
    const cpuPercent = ((endUsage.user + endUsage.system) / 100000); // Convert to percentage
    
    return {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memoryUsage: {
        rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
        external: Math.round(memoryUsage.external / 1024 / 1024), // MB
      },
      cpuUsage: Math.round(cpuPercent * 100) / 100
    };
  }
  
  /**
   * Collect database metrics
   */
  async collectDatabaseMetrics(): Promise<any> {
    try {
      await connectDB();
      
      // Get database statistics
      const dbStats = await DatabaseOptimizer.analyzeQueryPerformance();
      
      // Count documents in each collection
      const collections = {
        questions: await QuestionEnhanced.countDocuments(),
        tests: await TestEnhanced.countDocuments(),
        attempts: await AttemptEnhanced.countDocuments(),
        materials: await MaterialEnhanced.countDocuments()
      };
      
      // Get connection information
      const connectionState = {
        readyState: require('mongoose').connection.readyState,
        host: require('mongoose').connection.host,
        port: require('mongoose').connection.port,
        name: require('mongoose').connection.name
      };
      
      return {
        connection: connectionState,
        collections,
        stats: dbStats,
        queryMetrics: await this.getQueryMetrics()
      };
      
    } catch (error) {
      console.error('Database metrics collection failed:', error);
      return {
        error: 'Failed to collect database metrics',
        collections: {},
        queryMetrics: {}
      };
    }
  }
  
  /**
   * Collect cache metrics
   */
  async collectCacheMetrics(): Promise<any> {
    try {
      if (!this.cache) {
        return { connected: false, error: 'Cache service not available' };
      }
      
      const stats = await this.cache.getStats();
      
      return {
        connected: true,
        ...stats,
        hitRate: this.calculateCacheHitRate() // Would need to be tracked separately
      };
      
    } catch (error) {
      console.error('Cache metrics collection failed:', error);
      return {
        connected: false,
        error: 'Failed to collect cache metrics'
      };
    }
  }
  
  /**
   * Collect application-specific metrics
   */
  async collectApplicationMetrics(): Promise<any> {
    try {
      await connectDB();
      
      const [
        totalUsers,
        totalQuestions,
        totalTests,
        totalAttempts,
        totalMaterials,
        activeUsers
      ] = await Promise.all([
        // These would need proper User model - using placeholder counts
        1000, // User.countDocuments(),
        QuestionEnhanced.countDocuments({ isActive: true }),
        TestEnhanced.countDocuments({ isActive: true }),
        AttemptEnhanced.countDocuments(),
        MaterialEnhanced.countDocuments({ isActive: true }),
        // Active users in last 24 hours
        AttemptEnhanced.distinct('userId', {
          createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        }).then(users => users.length)
      ]);
      
      // Get recent activity
      const recentActivity = await this.getRecentActivity();
      
      return {
        totalUsers,
        totalQuestions,
        totalTests,
        totalAttempts,
        totalMaterials,
        activeUsers,
        recentActivity,
        growthMetrics: await this.calculateGrowthMetrics()
      };
      
    } catch (error) {
      console.error('Application metrics collection failed:', error);
      return {
        error: 'Failed to collect application metrics'
      };
    }
  }
  
  /**
   * Get query performance metrics
   */
  private async getQueryMetrics(): Promise<any> {
    // This would typically integrate with MongoDB profiler
    // For now, return simulated metrics
    return {
      averageQueryTime: 50, // ms
      slowQueryCount: 0,
      totalQueries: 1000,
      queryTypes: {
        find: 800,
        aggregate: 150,
        update: 30,
        insert: 20
      }
    };
  }
  
  /**
   * Calculate cache hit rate (would need proper tracking)
   */
  private calculateCacheHitRate(): number {
    // This would need to be tracked in the cache service
    return 85.5; // Placeholder percentage
  }
  
  /**
   * Get recent activity metrics
   */
  private async getRecentActivity(): Promise<any> {
    try {
      const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      const [
        questionsCreated,
        testsCreated,
        attemptsStarted,
        materialsUploaded
      ] = await Promise.all([
        QuestionEnhanced.countDocuments({ createdAt: { $gte: last24Hours } }),
        TestEnhanced.countDocuments({ createdAt: { $gte: last24Hours } }),
        AttemptEnhanced.countDocuments({ createdAt: { $gte: last24Hours } }),
        MaterialEnhanced.countDocuments({ createdAt: { $gte: last24Hours } })
      ]);
      
      return {
        questionsCreated,
        testsCreated,
        attemptsStarted,
        materialsUploaded,
        timeframe: '24 hours'
      };
      
    } catch (error) {
      console.error('Recent activity collection failed:', error);
      return {};
    }
  }
  
  /**
   * Calculate growth metrics
   */
  private async calculateGrowthMetrics(): Promise<any> {
    try {
      const now = new Date();
      const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      
      const [currentWeekAttempts, previousWeekAttempts] = await Promise.all([
        AttemptEnhanced.countDocuments({ createdAt: { $gte: lastWeek } }),
        AttemptEnhanced.countDocuments({ 
          createdAt: { $gte: twoWeeksAgo, $lt: lastWeek } 
        })
      ]);
      
      const attemptsGrowth = previousWeekAttempts > 0 
        ? ((currentWeekAttempts - previousWeekAttempts) / previousWeekAttempts) * 100
        : 0;
      
      return {
        weeklyAttempts: {
          current: currentWeekAttempts,
          previous: previousWeekAttempts,
          growth: Math.round(attemptsGrowth * 100) / 100
        }
      };
      
    } catch (error) {
      console.error('Growth metrics calculation failed:', error);
      return {};
    }
  }
  
  /**
   * Generate performance recommendations
   */
  generateRecommendations(metrics: any): string[] {
    const recommendations = [];
    
    // Memory usage recommendations
    if (metrics.system?.memoryUsage?.heapUsed > 500) { // > 500MB
      recommendations.push('High memory usage detected. Consider implementing garbage collection optimization.');
    }
    
    // Database recommendations
    if (metrics.database?.collections?.questions > 100000) {
      recommendations.push('Large question collection detected. Consider implementing data archiving strategy.');
    }
    
    // Cache recommendations
    if (metrics.cache?.hitRate < 80) {
      recommendations.push('Low cache hit rate. Review caching strategy and key TTL values.');
    }
    
    // Performance recommendations
    if (metrics.database?.queryMetrics?.averageQueryTime > 100) { // > 100ms
      recommendations.push('Slow database queries detected. Review indexes and query optimization.');
    }
    
    return recommendations;
  }
  
  /**
   * Collect all performance metrics
   */
  async collectAllMetrics(): Promise<PerformanceMetrics> {
    const [system, database, cache, application] = await Promise.all([
      this.collectSystemMetrics(),
      this.collectDatabaseMetrics(),
      this.collectCacheMetrics(),
      this.collectApplicationMetrics()
    ]);
    
    return {
      system,
      database,
      cache,
      api: {
        totalRequests: 0, // Would need proper API tracking
        averageResponseTime: 0,
        errorRate: 0,
        endpoints: {}
      },
      application
    } as PerformanceMetrics;
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const metric = url.searchParams.get('metric');
    const timeRange = url.searchParams.get('timeRange') || '1h';
    
    const monitor = PerformanceMonitor.getInstance();
    
    if (metric) {
      // Return specific metric
      let result;
      switch (metric) {
        case 'system':
          result = await monitor.collectSystemMetrics();
          break;
        case 'database':
          result = await monitor.collectDatabaseMetrics();
          break;
        case 'cache':
          result = await monitor.collectCacheMetrics();
          break;
        case 'application':
          result = await monitor.collectApplicationMetrics();
          break;
        default:
          result = { error: 'Unknown metric type' };
      }
      
      return NextResponse.json({
        success: true,
        metric,
        data: result
      });
    } else {
      // Return all metrics
      const metrics = await monitor.collectAllMetrics();
      const recommendations = monitor.generateRecommendations(metrics);
      
      return NextResponse.json({
        success: true,
        timestamp: new Date().toISOString(),
        metrics,
        recommendations,
        status: 'healthy' // Would implement proper health checks
      });
    }
    
  } catch (error: any) {
    console.error('Performance monitoring error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Monitoring failed' },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();
    
    if (action === 'health-check') {
      const monitor = PerformanceMonitor.getInstance();
      
      // Quick health checks
      const healthChecks = {
        database: false,
        cache: false,
        memory: false,
        disk: false
      };
      
      // Database check
      try {
        await connectDB();
        await QuestionEnhanced.findOne().limit(1);
        healthChecks.database = true;
      } catch (error) {
        console.error('Database health check failed:', error);
      }
      
      // Cache check
      try {
        const cache = CacheService.getInstance({
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379')
        });
        await cache.set('health-check', 'ok', 60);
        healthChecks.cache = true;
      } catch (error) {
        console.error('Cache health check failed:', error);
      }
      
      // Memory check
      const memUsage = process.memoryUsage();
      healthChecks.memory = (memUsage.heapUsed / memUsage.heapTotal) < 0.9; // < 90% usage
      
      // Overall health
      const isHealthy = Object.values(healthChecks).every(check => check === true);
      
      return NextResponse.json({
        success: true,
        healthy: isHealthy,
        checks: healthChecks,
        timestamp: new Date().toISOString()
      });
    }
    
    if (action === 'optimize') {
      // Trigger optimization tasks
      try {
        await DatabaseOptimizer.createOptimizedIndexes();
        await DatabaseOptimizer.performMaintenance();
        
        return NextResponse.json({
          success: true,
          message: 'Optimization tasks completed',
          timestamp: new Date().toISOString()
        });
      } catch (error: any) {
        return NextResponse.json({
          success: false,
          message: error.message || 'Optimization failed'
        }, { status: 500 });
      }
    }
    
    return NextResponse.json(
      { success: false, message: 'Unknown action' },
      { status: 400 }
    );
    
  } catch (error: any) {
    console.error('Performance action error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Action failed' },
      { status: 500 }
    );
  }
}