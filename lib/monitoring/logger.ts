/**
 * Enhanced Logging System for TestAcademy LMS
 * 
 * Features:
 * - Structured logging with different levels
 * - Request/Response tracking
 * - Performance monitoring
 * - Error tracking and alerting
 * - User activity logging
 * - Database query monitoring
 * - Security event logging
 */

interface LogEntry {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error' | 'critical';
  category: 'auth' | 'api' | 'db' | 'security' | 'performance' | 'user' | 'system';
  message: string;
  metadata?: Record<string, any>;
  userId?: string;
  requestId?: string;
  traceId?: string;
  duration?: number;
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
  };
}

interface PerformanceMetrics {
  requestId: string;
  method: string;
  url: string;
  statusCode: number;
  duration: number;
  dbQueries: number;
  dbDuration: number;
  memoryUsage: number;
  cpuUsage?: number;
  timestamp: string;
  userId?: string;
}

interface SecurityEvent {
  type: 'login_attempt' | 'login_success' | 'login_failure' | 'unauthorized_access' | 'suspicious_activity' | 'rate_limit_exceeded';
  userId?: string;
  ip: string;
  userAgent: string;
  details: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
}

class EnhancedLogger {
  private logs: LogEntry[] = [];
  private performanceMetrics: PerformanceMetrics[] = [];
  private securityEvents: SecurityEvent[] = [];
  private maxLogsInMemory = 1000;
  private alertThresholds = {
    errorRate: 0.05, // 5%
    responseTime: 5000, // 5 seconds
    memoryUsage: 0.85, // 85%
    dbQueryTime: 1000 // 1 second
  };

  constructor() {
    // Initialize log cleanup interval
    this.startCleanupInterval();
  }

  /**
   * Log a message with specified level and category
   */
  log(
    level: LogEntry['level'],
    category: LogEntry['category'],
    message: string,
    metadata?: Record<string, any>,
    options?: {
      userId?: string;
      requestId?: string;
      traceId?: string;
      error?: Error;
    }
  ) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      metadata,
      userId: options?.userId,
      requestId: options?.requestId,
      traceId: options?.traceId
    };

    if (options?.error) {
      entry.error = {
        name: options.error.name,
        message: options.error.message,
        stack: options.error.stack,
        code: (options.error as any).code
      };
    }

    this.addLog(entry);

    // Console output for development
    if (process.env.NODE_ENV === 'development') {
      const color = this.getConsoleColor(level);
      console.log(
        `${color}[${entry.timestamp}] ${level.toUpperCase()} (${category}): ${message}${
          metadata ? ' | ' + JSON.stringify(metadata) : ''
        }\x1b[0m`
      );
    }

    // Check for alerts
    this.checkAlerts(entry);
  }

  /**
   * Convenience methods for different log levels
   */
  debug(category: LogEntry['category'], message: string, metadata?: Record<string, any>, options?: any) {
    this.log('debug', category, message, metadata, options);
  }

  info(category: LogEntry['category'], message: string, metadata?: Record<string, any>, options?: any) {
    this.log('info', category, message, metadata, options);
  }

  warn(category: LogEntry['category'], message: string, metadata?: Record<string, any>, options?: any) {
    this.log('warn', category, message, metadata, options);
  }

  error(category: LogEntry['category'], message: string, metadata?: Record<string, any>, options?: any) {
    this.log('error', category, message, metadata, options);
  }

  critical(category: LogEntry['category'], message: string, metadata?: Record<string, any>, options?: any) {
    this.log('critical', category, message, metadata, options);
  }

  /**
   * Log performance metrics
   */
  logPerformance(metrics: Omit<PerformanceMetrics, 'timestamp'>) {
    const perfMetrics: PerformanceMetrics = {
      ...metrics,
      timestamp: new Date().toISOString()
    };

    this.performanceMetrics.push(perfMetrics);
    
    // Keep only recent metrics in memory
    if (this.performanceMetrics.length > this.maxLogsInMemory) {
      this.performanceMetrics = this.performanceMetrics.slice(-this.maxLogsInMemory);
    }

    // Log slow requests
    if (metrics.duration > this.alertThresholds.responseTime) {
      this.warn('performance', `Slow request detected`, {
        url: metrics.url,
        duration: metrics.duration,
        dbQueries: metrics.dbQueries
      }, { requestId: metrics.requestId });
    }

    // Log slow database queries
    if (metrics.dbDuration > this.alertThresholds.dbQueryTime) {
      this.warn('db', `Slow database query detected`, {
        duration: metrics.dbDuration,
        queries: metrics.dbQueries,
        url: metrics.url
      }, { requestId: metrics.requestId });
    }
  }

  /**
   * Log security events
   */
  logSecurity(event: Omit<SecurityEvent, 'timestamp'>) {
    const securityEvent: SecurityEvent = {
      ...event,
      timestamp: new Date().toISOString()
    };

    this.securityEvents.push(securityEvent);
    
    // Keep only recent events in memory
    if (this.securityEvents.length > this.maxLogsInMemory) {
      this.securityEvents = this.securityEvents.slice(-this.maxLogsInMemory);
    }

    // Log security event
    const level = event.severity === 'critical' || event.severity === 'high' ? 'error' : 'warn';
    this.log(level, 'security', `Security event: ${event.type}`, {
      severity: event.severity,
      ip: event.ip,
      details: event.details
    }, { userId: event.userId });
  }

  /**
   * User activity logging
   */
  logUserActivity(
    userId: string,
    action: string,
    details?: Record<string, any>,
    requestId?: string
  ) {
    this.info('user', `User activity: ${action}`, {
      userId,
      action,
      ...details
    }, { userId, requestId });
  }

  /**
   * Database operation logging
   */
  logDatabaseOperation(
    operation: string,
    collection: string,
    duration: number,
    recordsAffected?: number,
    error?: Error,
    requestId?: string
  ) {
    const level = error ? 'error' : duration > this.alertThresholds.dbQueryTime ? 'warn' : 'debug';
    
    this.log(level, 'db', `Database ${operation}`, {
      operation,
      collection,
      duration,
      recordsAffected,
      error: error?.message
    }, { requestId, error });
  }

  /**
   * API request/response logging
   */
  logApiRequest(
    method: string,
    url: string,
    statusCode: number,
    duration: number,
    userId?: string,
    requestId?: string,
    error?: Error
  ) {
    const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
    
    this.log(level, 'api', `${method} ${url}`, {
      method,
      url,
      statusCode,
      duration,
      error: error?.message
    }, { userId, requestId, error });
  }

  /**
   * Get logs with filtering
   */
  getLogs(filters?: {
    level?: LogEntry['level'][];
    category?: LogEntry['category'][];
    userId?: string;
    startTime?: string;
    endTime?: string;
    limit?: number;
  }): LogEntry[] {
    let filteredLogs = [...this.logs];

    if (filters?.level) {
      filteredLogs = filteredLogs.filter(log => filters.level!.includes(log.level));
    }

    if (filters?.category) {
      filteredLogs = filteredLogs.filter(log => filters.category!.includes(log.category));
    }

    if (filters?.userId) {
      filteredLogs = filteredLogs.filter(log => log.userId === filters.userId);
    }

    if (filters?.startTime) {
      filteredLogs = filteredLogs.filter(log => log.timestamp >= filters.startTime!);
    }

    if (filters?.endTime) {
      filteredLogs = filteredLogs.filter(log => log.timestamp <= filters.endTime!);
    }

    // Sort by timestamp (newest first)
    filteredLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    if (filters?.limit) {
      filteredLogs = filteredLogs.slice(0, filters.limit);
    }

    return filteredLogs;
  }

  /**
   * Get performance metrics with aggregation
   */
  getPerformanceMetrics(timeRange: '1h' | '1d' | '1w' = '1h') {
    const now = new Date();
    const startTime = new Date();
    
    switch (timeRange) {
      case '1h':
        startTime.setHours(now.getHours() - 1);
        break;
      case '1d':
        startTime.setDate(now.getDate() - 1);
        break;
      case '1w':
        startTime.setDate(now.getDate() - 7);
        break;
    }

    const metricsInRange = this.performanceMetrics.filter(
      m => new Date(m.timestamp) >= startTime
    );

    if (metricsInRange.length === 0) {
      return {
        totalRequests: 0,
        averageResponseTime: 0,
        errorRate: 0,
        slowRequests: 0,
        averageDbQueries: 0,
        averageDbDuration: 0
      };
    }

    const totalRequests = metricsInRange.length;
    const errorRequests = metricsInRange.filter(m => m.statusCode >= 400).length;
    const slowRequests = metricsInRange.filter(m => m.duration > this.alertThresholds.responseTime).length;
    
    const averageResponseTime = metricsInRange.reduce((sum, m) => sum + m.duration, 0) / totalRequests;
    const averageDbQueries = metricsInRange.reduce((sum, m) => sum + m.dbQueries, 0) / totalRequests;
    const averageDbDuration = metricsInRange.reduce((sum, m) => sum + m.dbDuration, 0) / totalRequests;
    
    return {
      totalRequests,
      averageResponseTime: Math.round(averageResponseTime),
      errorRate: errorRequests / totalRequests,
      slowRequests,
      averageDbQueries: Math.round(averageDbQueries * 10) / 10,
      averageDbDuration: Math.round(averageDbDuration)
    };
  }

  /**
   * Get security events summary
   */
  getSecuritySummary(timeRange: '1h' | '1d' | '1w' = '1d') {
    const now = new Date();
    const startTime = new Date();
    
    switch (timeRange) {
      case '1h':
        startTime.setHours(now.getHours() - 1);
        break;
      case '1d':
        startTime.setDate(now.getDate() - 1);
        break;
      case '1w':
        startTime.setDate(now.getDate() - 7);
        break;
    }

    const eventsInRange = this.securityEvents.filter(
      e => new Date(e.timestamp) >= startTime
    );

    const summary = {
      totalEvents: eventsInRange.length,
      criticalEvents: eventsInRange.filter(e => e.severity === 'critical').length,
      highSeverityEvents: eventsInRange.filter(e => e.severity === 'high').length,
      loginAttempts: eventsInRange.filter(e => e.type === 'login_attempt').length,
      failedLogins: eventsInRange.filter(e => e.type === 'login_failure').length,
      unauthorizedAccess: eventsInRange.filter(e => e.type === 'unauthorized_access').length,
      rateLimitExceeded: eventsInRange.filter(e => e.type === 'rate_limit_exceeded').length
    };

    return summary;
  }

  /**
   * Export logs for external analysis
   */
  exportLogs(format: 'json' | 'csv' = 'json', filters?: any): string {
    const logs = this.getLogs(filters);
    
    if (format === 'csv') {
      const headers = ['timestamp', 'level', 'category', 'message', 'userId', 'requestId'];
      const csvRows = logs.map(log => [
        log.timestamp,
        log.level,
        log.category,
        log.message.replace(/"/g, '""'),
        log.userId || '',
        log.requestId || ''
      ]);
      
      return [headers.join(','), ...csvRows.map(row => row.join(','))].join('\n');
    }
    
    return JSON.stringify(logs, null, 2);
  }

  private addLog(entry: LogEntry) {
    this.logs.push(entry);
    
    // Keep only recent logs in memory
    if (this.logs.length > this.maxLogsInMemory) {
      this.logs = this.logs.slice(-this.maxLogsInMemory);
    }
  }

  private getConsoleColor(level: LogEntry['level']): string {
    switch (level) {
      case 'debug': return '\x1b[36m'; // Cyan
      case 'info': return '\x1b[32m';  // Green
      case 'warn': return '\x1b[33m';  // Yellow
      case 'error': return '\x1b[31m'; // Red
      case 'critical': return '\x1b[35m'; // Magenta
      default: return '\x1b[0m';       // Reset
    }
  }

  private checkAlerts(entry: LogEntry) {
    // Check error rate alert
    if (entry.level === 'error' || entry.level === 'critical') {
      const recentLogs = this.logs.slice(-100);
      const errorLogs = recentLogs.filter(log => log.level === 'error' || log.level === 'critical');
      const errorRate = errorLogs.length / recentLogs.length;
      
      if (errorRate > this.alertThresholds.errorRate) {
        this.sendAlert('High error rate detected', {
          errorRate: errorRate * 100,
          threshold: this.alertThresholds.errorRate * 100,
          recentErrors: errorLogs.length
        });
      }
    }
  }

  private sendAlert(message: string, data: Record<string, any>) {
    // In production, this would send alerts via email, Slack, etc.
    console.warn(`🚨 ALERT: ${message}`, data);
    
    // Log the alert
    this.critical('system', `Alert triggered: ${message}`, data);
  }

  private startCleanupInterval() {
    // Clean up old logs every hour
    setInterval(() => {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      
      // Keep only logs from the last hour in memory for active monitoring
      // Older logs should be persisted to database or external logging service
      this.logs = this.logs.filter(log => log.timestamp > oneHourAgo);
      this.performanceMetrics = this.performanceMetrics.filter(metric => metric.timestamp > oneHourAgo);
      this.securityEvents = this.securityEvents.filter(event => event.timestamp > oneHourAgo);
      
      this.info('system', 'Log cleanup completed', {
        logsInMemory: this.logs.length,
        metricsInMemory: this.performanceMetrics.length,
        securityEventsInMemory: this.securityEvents.length
      });
    }, 60 * 60 * 1000); // Every hour
  }
}

// Singleton instance
export const logger = new EnhancedLogger();

// Middleware for request logging
export function createRequestLogger() {
  return (req: any, res: any, next: any) => {
    const startTime = Date.now();
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Add requestId to request for use in other parts of the application
    req.requestId = requestId;
    
    // Log request start
    logger.info('api', `Request started: ${req.method} ${req.url}`, {
      method: req.method,
      url: req.url,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress
    }, { 
      requestId,
      userId: req.user?.id 
    });

    // Override res.end to log response
    const originalEnd = res.end;
    res.end = function(...args: any[]) {
      const duration = Date.now() - startTime;
      
      // Log API request completion
      logger.logApiRequest(
        req.method,
        req.url,
        res.statusCode,
        duration,
        req.user?.id,
        requestId
      );

      // Log performance metrics
      logger.logPerformance({
        requestId,
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration,
        dbQueries: req.dbQueries || 0,
        dbDuration: req.dbDuration || 0,
        memoryUsage: process.memoryUsage().heapUsed / process.memoryUsage().heapTotal,
        userId: req.user?.id
      });

      originalEnd.apply(res, args);
    };

    next();
  };
}