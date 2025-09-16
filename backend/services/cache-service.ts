import { createClient, RedisClientType } from 'redis';

interface CacheConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
  keyPrefix?: string;
}

export class CacheService {
  private static instance: CacheService;
  private client: RedisClientType | null = null;
  private isConnected: boolean = false;
  private config: CacheConfig;
  
  // Default TTL values (in seconds)
  public static readonly TTL = {
    SHORT: 300,      // 5 minutes
    MEDIUM: 1800,    // 30 minutes
    LONG: 3600,      // 1 hour
    VERY_LONG: 86400 // 24 hours
  };
  
  private constructor(config: CacheConfig) {
    this.config = {
      keyPrefix: 'lms:',
      ...config
    };
  }
  
  public static getInstance(config?: CacheConfig): CacheService {
    if (!CacheService.instance) {
      if (!config) {
        throw new Error('Cache configuration required for first initialization');
      }
      CacheService.instance = new CacheService(config);
    }
    return CacheService.instance;
  }
  
  /**
   * Initialize Redis connection
   */
  public async connect(): Promise<void> {
    if (this.isConnected) return;
    
    try {
      this.client = createClient({
        socket: {
          host: this.config.host,
          port: this.config.port
        },
        password: this.config.password,
        database: this.config.db || 0
      });
      
      this.client.on('error', (err) => {
        console.error('Redis Client Error:', err);
        this.isConnected = false;
      });
      
      this.client.on('connect', () => {
        console.log('Redis connected successfully');
        this.isConnected = true;
      });
      
      await this.client.connect();
      
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      throw error;
    }
  }
  
  /**
   * Disconnect from Redis
   */
  public async disconnect(): Promise<void> {
    if (this.client && this.isConnected) {
      await this.client.disconnect();
      this.isConnected = false;
    }
  }
  
  /**
   * Generate cache key with prefix
   */
  private getKey(key: string): string {
    return `${this.config.keyPrefix}${key}`;
  }
  
  /**
   * Set cache value
   */
  public async set(key: string, value: any, ttl?: number): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      console.warn('Cache not available, skipping set operation');
      return false;
    }
    
    try {
      const cacheKey = this.getKey(key);
      const serializedValue = JSON.stringify(value);
      
      if (ttl) {
        await this.client.setEx(cacheKey, ttl, serializedValue);
      } else {
        await this.client.set(cacheKey, serializedValue);
      }
      
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }
  
  /**
   * Get cache value
   */
  public async get<T>(key: string): Promise<T | null> {
    if (!this.client || !this.isConnected) {
      return null;
    }
    
    try {
      const cacheKey = this.getKey(key);
      const value = await this.client.get(cacheKey);
      
      if (value === null) {
        return null;
      }
      
      return JSON.parse(value) as T;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }
  
  /**
   * Delete cache key
   */
  public async delete(key: string): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      return false;
    }
    
    try {
      const cacheKey = this.getKey(key);
      const result = await this.client.del(cacheKey);
      return result > 0;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  }
  
  /**
   * Check if key exists
   */
  public async exists(key: string): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      return false;
    }
    
    try {
      const cacheKey = this.getKey(key);
      const result = await this.client.exists(cacheKey);
      return result > 0;
    } catch (error) {
      console.error('Cache exists error:', error);
      return false;
    }
  }
  
  /**
   * Set multiple keys
   */
  public async mset(keyValuePairs: Record<string, any>, ttl?: number): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      return false;
    }
    
    try {
      const pipeline = this.client.multi();
      
      Object.entries(keyValuePairs).forEach(([key, value]) => {
        const cacheKey = this.getKey(key);
        const serializedValue = JSON.stringify(value);
        
        if (ttl) {
          pipeline.setEx(cacheKey, ttl, serializedValue);
        } else {
          pipeline.set(cacheKey, serializedValue);
        }
      });
      
      await pipeline.exec();
      return true;
    } catch (error) {
      console.error('Cache mset error:', error);
      return false;
    }
  }
  
  /**
   * Get multiple keys
   */
  public async mget<T>(keys: string[]): Promise<(T | null)[]> {
    if (!this.client || !this.isConnected) {
      return keys.map(() => null);
    }
    
    try {
      const cacheKeys = keys.map(key => this.getKey(key));
      const values = await this.client.mGet(cacheKeys);
      
      return values.map(value => {
        if (value === null) return null;
        try {
          return JSON.parse(value) as T;
        } catch {
          return null;
        }
      });
    } catch (error) {
      console.error('Cache mget error:', error);
      return keys.map(() => null);
    }
  }
  
  /**
   * Cache with automatic expiration and refresh
   */
  public async getOrSet<T>(
    key: string, 
    fetcher: () => Promise<T>, 
    ttl: number = CacheService.TTL.MEDIUM
  ): Promise<T> {
    try {
      // Try to get from cache first
      const cached = await this.get<T>(key);
      if (cached !== null) {
        return cached;
      }
      
      // If not in cache, fetch and cache the result
      const result = await fetcher();
      await this.set(key, result, ttl);
      
      return result;
    } catch (error) {
      console.error('Cache getOrSet error:', error);
      // If cache fails, still return the fetched result
      return await fetcher();
    }
  }
  
  /**
   * Invalidate cache patterns (for cache busting)
   */
  public async invalidatePattern(pattern: string): Promise<number> {
    if (!this.client || !this.isConnected) {
      return 0;
    }
    
    try {
      const searchPattern = this.getKey(pattern);
      const keys = await this.client.keys(searchPattern);
      
      if (keys.length === 0) {
        return 0;
      }
      
      const result = await this.client.del(keys);
      return result;
    } catch (error) {
      console.error('Cache invalidate pattern error:', error);
      return 0;
    }
  }
  
  /**
   * Get cache statistics
   */
  public async getStats(): Promise<any> {
    if (!this.client || !this.isConnected) {
      return null;
    }
    
    try {
      const info = await this.client.info('memory');
      const keyCount = await this.client.dbSize();
      
      return {
        connected: this.isConnected,
        keyCount,
        memoryInfo: info
      };
    } catch (error) {
      console.error('Cache stats error:', error);
      return null;
    }
  }
}

/**
 * Specific cache keys and methods for LMS entities
 */
export class LMSCacheKeys {
  
  // Question cache keys
  static question = (id: string) => `question:${id}`;
  static questionList = (filters: string) => `questions:list:${filters}`;
  static questionSearch = (query: string, page: number) => `questions:search:${query}:${page}`;
  
  // Test cache keys
  static test = (id: string) => `test:${id}`;
  static testList = (classId: string, subjectId?: string) => 
    `tests:list:${classId}${subjectId ? `:${subjectId}` : ''}`;
  static testAnalytics = (id: string) => `test:analytics:${id}`;
  
  // Attempt cache keys
  static attempt = (id: string) => `attempt:${id}`;
  static userAttempts = (userId: string, testId?: string) => 
    `attempts:user:${userId}${testId ? `:${testId}` : ''}`;
  
  // Material cache keys
  static material = (id: string) => `material:${id}`;
  static materialList = (classId: string, subjectId?: string) => 
    `materials:list:${classId}${subjectId ? `:${subjectId}` : ''}`;
  
  // Session cache keys
  static userSession = (userId: string) => `session:${userId}`;
  static bulkUploadSession = (sessionId: string) => `bulk:upload:${sessionId}`;
  
  // Analytics cache keys
  static dashboardStats = (userId: string) => `dashboard:stats:${userId}`;
  static performanceReport = (userId: string, period: string) => `performance:${userId}:${period}`;
}

/**
 * Cache helper functions for common LMS operations
 */
export class LMSCache {
  private cache: CacheService;
  
  constructor(cacheService: CacheService) {
    this.cache = cacheService;
  }
  
  /**
   * Cache question with automatic invalidation on updates
   */
  async cacheQuestion(question: any): Promise<void> {
    await this.cache.set(
      LMSCacheKeys.question(question._id), 
      question, 
      CacheService.TTL.LONG
    );
  }
  
  /**
   * Get cached question or fetch from database
   */
  async getQuestion<T>(id: string, fetcher: () => Promise<T>): Promise<T> {
    return this.cache.getOrSet(
      LMSCacheKeys.question(id),
      fetcher,
      CacheService.TTL.LONG
    );
  }
  
  /**
   * Invalidate question-related caches
   */
  async invalidateQuestionCaches(questionId: string): Promise<void> {
    await this.cache.delete(LMSCacheKeys.question(questionId));
    await this.cache.invalidatePattern('questions:list:*');
    await this.cache.invalidatePattern('questions:search:*');
  }
  
  /**
   * Cache test results with shorter TTL due to frequent updates
   */
  async cacheTestResults(testId: string, results: any): Promise<void> {
    await this.cache.set(
      LMSCacheKeys.testAnalytics(testId),
      results,
      CacheService.TTL.MEDIUM
    );
  }
  
  /**
   * Cache user session data
   */
  async cacheUserSession(userId: string, sessionData: any): Promise<void> {
    await this.cache.set(
      LMSCacheKeys.userSession(userId),
      sessionData,
      CacheService.TTL.SHORT
    );
  }
  
  /**
   * Cache bulk upload progress
   */
  async cacheBulkUploadProgress(sessionId: string, progress: any): Promise<void> {
    await this.cache.set(
      LMSCacheKeys.bulkUploadSession(sessionId),
      progress,
      CacheService.TTL.MEDIUM
    );
  }
  
  /**
   * Cache dashboard statistics
   */
  async cacheDashboardStats(userId: string, stats: any): Promise<void> {
    await this.cache.set(
      LMSCacheKeys.dashboardStats(userId),
      stats,
      CacheService.TTL.MEDIUM
    );
  }
  
  /**
   * Warm up cache with frequently accessed data
   */
  async warmupCache(commonQueries: any[]): Promise<void> {
    console.log('Warming up cache with common queries...');
    
    const promises = commonQueries.map(async (query) => {
      try {
        const { key, fetcher, ttl } = query;
        await this.cache.getOrSet(key, fetcher, ttl);
      } catch (error) {
        console.error('Cache warmup error for key:', query.key, error);
      }
    });
    
    await Promise.allSettled(promises);
    console.log('Cache warmup completed');
  }
}

// Export singleton instance creator
export const createCacheService = (config: CacheConfig): CacheService => {
  return CacheService.getInstance(config);
};

export default CacheService;