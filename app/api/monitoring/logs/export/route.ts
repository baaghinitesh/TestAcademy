import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../../../../lib/auth/middleware-mongo';
import { logger } from '../../../../../lib/monitoring/logger';

export async function GET(request: NextRequest) {
  try {
    // Check authentication and authorization
    const authResult = await auth(request);
    if (!authResult.authenticated || authResult.user?.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const format = searchParams.get('format') || 'json';
    
    // Parse filters (same as logs route)
    const filters = {
      level: searchParams.get('level')?.split(',').filter(l => l !== 'all') as any[],
      category: searchParams.get('category')?.split(',').filter(c => c !== 'all') as any[],
      userId: searchParams.get('userId') || undefined,
      startTime: searchParams.get('startTime') || getStartTimeFromRange(searchParams.get('timeRange') || '1h'),
      endTime: searchParams.get('endTime') || undefined,
      limit: parseInt(searchParams.get('limit') || '1000'), // Higher limit for export
      search: searchParams.get('search') || undefined
    };

    // Get logs
    let logs = logger.getLogs({
      level: filters.level?.length ? filters.level : undefined,
      category: filters.category?.length ? filters.category : undefined,
      userId: filters.userId,
      startTime: filters.startTime,
      endTime: filters.endTime,
      limit: filters.limit
    });

    // Apply search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      logs = logs.filter(log => 
        log.message.toLowerCase().includes(searchTerm) ||
        log.category.toLowerCase().includes(searchTerm) ||
        (log.metadata && JSON.stringify(log.metadata).toLowerCase().includes(searchTerm))
      );
    }

    // Export logs using logger's export functionality
    const exportedData = logger.exportLogs(format as 'json' | 'csv', {
      level: filters.level,
      category: filters.category,
      userId: filters.userId,
      startTime: filters.startTime,
      endTime: filters.endTime,
      limit: filters.limit
    });

    // Log the export action
    logger.logUserActivity(
      authResult.user.id,
      'export_monitoring_logs',
      { 
        format, 
        filters, 
        recordCount: logs.length,
        exportSize: exportedData.length 
      },
      request.headers.get('x-request-id') || undefined
    );

    // Set appropriate headers
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `logs_${timestamp}.${format}`;
    
    const headers = new Headers();
    headers.set('Content-Disposition', `attachment; filename="${filename}"`);
    
    if (format === 'csv') {
      headers.set('Content-Type', 'text/csv');
    } else {
      headers.set('Content-Type', 'application/json');
    }

    return new NextResponse(exportedData, {
      status: 200,
      headers
    });

  } catch (error) {
    console.error('Error exporting logs:', error);
    
    logger.error('api', 'Error exporting monitoring logs', {
      error: error instanceof Error ? error.message : 'Unknown error'
    }, {
      error: error instanceof Error ? error : undefined,
      requestId: request.headers.get('x-request-id') || undefined
    });

    return NextResponse.json(
      { 
        success: false, 
        error: { message: 'Failed to export logs' } 
      },
      { status: 500 }
    );
  }
}

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