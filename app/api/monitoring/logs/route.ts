import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../../../lib/auth/middleware-mongo';
import { logger } from '../../../../lib/monitoring/logger';

export async function GET(request: NextRequest) {
  try {
    // Check authentication and authorization
    const authResult = await auth(request);
    if (!authResult.authenticated || authResult.user?.role !== 'admin') {
      logger.logSecurity({
        type: 'unauthorized_access',
        userId: authResult.user?.id,
        ip: request.ip || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        details: { endpoint: '/api/monitoring/logs', action: 'view_logs' },
        severity: 'medium'
      });
      
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    
    // Parse query parameters
    const filters = {
      level: searchParams.get('level')?.split(',').filter(l => l !== 'all') as any[],
      category: searchParams.get('category')?.split(',').filter(c => c !== 'all') as any[],
      userId: searchParams.get('userId') || undefined,
      startTime: searchParams.get('startTime') || getStartTimeFromRange(searchParams.get('timeRange') || '1h'),
      endTime: searchParams.get('endTime') || undefined,
      limit: parseInt(searchParams.get('limit') || '100'),
      search: searchParams.get('search') || undefined
    };

    // Get logs from logger
    let logs = logger.getLogs({
      level: filters.level?.length ? filters.level : undefined,
      category: filters.category?.length ? filters.category : undefined,
      userId: filters.userId,
      startTime: filters.startTime,
      endTime: filters.endTime,
      limit: filters.limit
    });

    // Apply search filter if provided
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      logs = logs.filter(log => 
        log.message.toLowerCase().includes(searchTerm) ||
        log.category.toLowerCase().includes(searchTerm) ||
        (log.metadata && JSON.stringify(log.metadata).toLowerCase().includes(searchTerm))
      );
    }

    // Log the access
    logger.logUserActivity(
      authResult.user.id,
      'view_monitoring_logs',
      { filters, resultCount: logs.length },
      request.headers.get('x-request-id') || undefined
    );

    return NextResponse.json({
      success: true,
      logs,
      total: logs.length,
      filters: {
        ...filters,
        search: filters.search
      }
    });

  } catch (error) {
    console.error('Error fetching logs:', error);
    
    logger.error('api', 'Error fetching monitoring logs', {
      error: error instanceof Error ? error.message : 'Unknown error'
    }, {
      error: error instanceof Error ? error : undefined,
      requestId: request.headers.get('x-request-id') || undefined
    });

    return NextResponse.json(
      { 
        success: false, 
        error: { message: 'Failed to fetch logs' } 
      },
      { status: 500 }
    );
  }
}

// Helper function to get start time based on time range
function getStartTimeFromRange(timeRange: string): string {
  const now = new Date();
  
  switch (timeRange) {
    case '1h':
      return new Date(now.getTime() - 60 * 60 * 1000).toISOString();
    case '1d':
      return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    case '1w':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    default:
      return new Date(now.getTime() - 60 * 60 * 1000).toISOString();
  }
}