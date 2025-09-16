import { CacheService, LMSCache } from '../services/cache-service';
import { CloudStorageService } from '../services/cloud-storage-service';
import { DatabaseOptimizer } from '../utils/database-optimizer';

/**
 * Performance Configuration for LMS System
 * This file contains all performance-related configurations and setup
 */

export interface PerformanceConfig {
  database: {
    enableOptimization: boolean;
    maxPoolSize: number;
    queryTimeout: number;
    enableProfiling: boolean;
  };
  cache: {
    enabled: boolean;
    host: string;
    port: number;
    password?: string;
    defaultTTL: number;
  };
  storage: {
    provider: 'aws' | 'local';
    maxFileSize: number;
    allowedFileTypes: string[];
    thumbnailGeneration: boolean;
  };
  api: {
    rateLimit: {
      windowMs: number;
      max: number;
    };
    compression: boolean;
    cors: {
      origin: string[];
      credentials: boolean;
    };
  };
  monitoring: {
    enabled: boolean;
    metricsInterval: number;
    alertThresholds: {
      memoryUsage: number;
      cpuUsage: number;
      responseTime: number;
    };
  };
}

export class PerformanceManager {
  private static instance: PerformanceManager;
  private config: PerformanceConfig;
  private cacheService?: CacheService;
  private storageService?: CloudStorageService;
  private lmsCache?: LMSCache;
  
  private constructor(config: PerformanceConfig) {
    this.config = config;
  }
  
  public static getInstance(config?: PerformanceConfig): PerformanceManager {
    if (!PerformanceManager.instance) {
      if (!config) {
        throw new Error('Performance configuration required for first initialization');
      }
      PerformanceManager.instance = new PerformanceManager(config);
    }
    return PerformanceManager.instance;
  }
  
  /**
   * Initialize all performance services
   */
  public async initialize(): Promise<void> {
    console.log('Initializing performance services...');
    
    try {
      // Initialize database optimizations
      if (this.config.database.enableOptimization) {
        await this.initializeDatabaseOptimization();
      }
      
      // Initialize cache service
      if (this.config.cache.enabled) {
        await this.initializeCacheService();
      }
      
      // Initialize storage service
      await this.initializeStorageService();
      
      // Set up monitoring
      if (this.config.monitoring.enabled) {
        this.setupMonitoring();
      }
      
      console.log('Performance services initialized successfully');
      
    } catch (error) {
      console.error('Failed to initialize performance services:', error);
      throw error;
    }
  }
  
  /**
   * Initialize database optimization
   */
  private async initializeDatabaseOptimization(): Promise<void> {
    try {
      console.log('Setting up database optimization...');
      
      // Create optimized indexes
      await DatabaseOptimizer.createOptimizedIndexes();
      
      // Schedule regular maintenance
      setInterval(async () => {
        try {
          await DatabaseOptimizer.performMaintenance();
        } catch (error) {
          console.error('Scheduled database maintenance failed:', error);
        }
      }, 24 * 60 * 60 * 1000); // Daily maintenance
      
      console.log('Database optimization configured');
      
    } catch (error) {
      console.error('Database optimization setup failed:', error);
      throw error;
    }
  }
  
  /**
   * Initialize cache service
   */
  private async initializeCacheService(): Promise<void> {
    try {
      console.log('Setting up cache service...');
      
      this.cacheService = CacheService.getInstance({
        host: this.config.cache.host,
        port: this.config.cache.port,
        password: this.config.cache.password
      });
      
      await this.cacheService.connect();
      
      this.lmsCache = new LMSCache(this.cacheService);
      
      // Warm up cache with common queries
      await this.warmupCache();
      
      console.log('Cache service configured');
      
    } catch (error) {
      console.error('Cache service setup failed:', error);
      // Don't throw error - cache is optional
      console.warn('Continuing without cache service');
    }
  }
  
  /**
   * Initialize storage service
   */
  private async initializeStorageService(): Promise<void> {
    try {
      console.log('Setting up storage service...');
      
      const storageConfig = this.getStorageConfig();
      this.storageService = CloudStorageService.getInstance(storageConfig);
      
      console.log(`Storage service configured for ${this.config.storage.provider}`);
      
    } catch (error) {
      console.error('Storage service setup failed:', error);
      throw error;
    }
  }
  
  /**
   * Get storage configuration based on environment
   */
  private getStorageConfig(): any {
    if (this.config.storage.provider === 'aws') {
      return {
        provider: 'aws',
        aws: {
          region: process.env.AWS_REGION || 'us-east-1',
          bucketName: process.env.AWS_S3_BUCKET || 'lms-uploads',
          accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
          cloudFrontUrl: process.env.AWS_CLOUDFRONT_URL
        }
      };
    } else {
      return {
        provider: 'local',
        local: {
          uploadDir: process.env.UPLOAD_DIR || './uploads',
          baseUrl: process.env.BASE_URL || 'http://localhost:3000/uploads'
        }
      };
    }
  }
  
  /**
   * Setup monitoring and alerting
   */
  private setupMonitoring(): void {
    console.log('Setting up performance monitoring...');
    
    // Monitor memory usage
    setInterval(() => {
      const memUsage = process.memoryUsage();
      const heapUsedMB = memUsage.heapUsed / 1024 / 1024;
      
      if (heapUsedMB > this.config.monitoring.alertThresholds.memoryUsage) {
        console.warn(`High memory usage detected: ${heapUsedMB.toFixed(2)}MB`);
        // In production, this would trigger alerts
      }
    }, this.config.monitoring.metricsInterval);
    
    // Monitor event loop lag
    const startTime = process.hrtime();
    setInterval(() => {
      const delta = process.hrtime(startTime);
      const lag = (delta[0] * 1000) + (delta[1] * 1e-6) - this.config.monitoring.metricsInterval;
      
      if (lag > this.config.monitoring.alertThresholds.responseTime) {
        console.warn(`Event loop lag detected: ${lag.toFixed(2)}ms`);
      }
    }, this.config.monitoring.metricsInterval);
    
    console.log('Performance monitoring configured');
  }
  
  /**
   * Warm up cache with common queries
   */
  private async warmupCache(): Promise<void> {
    if (!this.lmsCache) return;
    
    try {
      console.log('Warming up cache...');
      
      const commonQueries = [
        {
          key: 'dashboard:popular_tests',
          fetcher: async () => {
            // This would fetch popular tests
            return { tests: [] };
          },
          ttl: CacheService.TTL.LONG
        },
        {
          key: 'dashboard:recent_questions',
          fetcher: async () => {
            // This would fetch recent questions
            return { questions: [] };
          },
          ttl: CacheService.TTL.MEDIUM
        }
      ];
      
      await this.lmsCache.warmupCache(commonQueries);
      
    } catch (error) {
      console.error('Cache warmup failed:', error);
    }
  }
  
  /**
   * Get performance recommendations based on current metrics
   */
  public getPerformanceRecommendations(): string[] {
    const recommendations = [];
    
    // Check memory usage
    const memUsage = process.memoryUsage();
    const heapUsedMB = memUsage.heapUsed / 1024 / 1024;
    
    if (heapUsedMB > 500) {
      recommendations.push('Consider implementing memory optimization strategies');
    }
    
    // Check cache availability
    if (!this.cacheService) {
      recommendations.push('Enable Redis caching for better performance');
    }
    
    // Check storage configuration
    if (this.config.storage.provider === 'local') {
      recommendations.push('Consider using cloud storage (AWS S3) for better scalability');
    }
    
    return recommendations;
  }
  
  /**
   * Graceful shutdown of performance services
   */
  public async shutdown(): Promise<void> {
    console.log('Shutting down performance services...');
    
    try {
      if (this.cacheService) {
        await this.cacheService.disconnect();
      }
      
      console.log('Performance services shut down successfully');
      
    } catch (error) {
      console.error('Error during performance services shutdown:', error);
    }
  }
  
  /**
   * Get service status
   */
  public getServiceStatus(): any {
    return {
      database: this.config.database.enableOptimization,
      cache: {
        enabled: this.config.cache.enabled,
        connected: this.cacheService ? true : false
      },
      storage: {
        provider: this.config.storage.provider,
        configured: this.storageService ? true : false
      },
      monitoring: this.config.monitoring.enabled
    };
  }
}

/**
 * Default performance configuration
 */
export const defaultPerformanceConfig: PerformanceConfig = {
  database: {
    enableOptimization: true,
    maxPoolSize: 10,
    queryTimeout: 30000,
    enableProfiling: process.env.NODE_ENV === 'development'
  },
  cache: {
    enabled: process.env.REDIS_URL ? true : false,
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    defaultTTL: 3600
  },
  storage: {
    provider: (process.env.AWS_S3_BUCKET ? 'aws' : 'local') as 'aws' | 'local',
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedFileTypes: [
      'image/jpeg',
      'image/png', 
      'image/gif',
      'application/pdf',
      'video/mp4',
      'audio/mpeg',
      'text/plain',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ],
    thumbnailGeneration: true
  },
  api: {
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100 // limit each IP to 100 requests per windowMs
    },
    compression: true,
    cors: {
      origin: [process.env.FRONTEND_URL || 'http://localhost:3000'],
      credentials: true
    }
  },
  monitoring: {
    enabled: true,
    metricsInterval: 60000, // 1 minute
    alertThresholds: {
      memoryUsage: 500, // MB
      cpuUsage: 80, // %
      responseTime: 1000 // ms
    }
  }
};

/**
 * Initialize performance services with default config
 */
export async function initializePerformanceServices(
  customConfig?: Partial<PerformanceConfig>
): Promise<PerformanceManager> {
  const config = { ...defaultPerformanceConfig, ...customConfig };
  const manager = PerformanceManager.getInstance(config);
  await manager.initialize();
  return manager;
}

export default PerformanceManager;