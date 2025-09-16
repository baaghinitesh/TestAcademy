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
        details: { endpoint: '/api/security/summary', action: 'view_security_summary' },
        severity: 'medium'
      });
      
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const timeRange = searchParams.get('timeRange') || '1d';

    // Get security summary from logger
    const summary = logger.getSecuritySummary(timeRange as '1h' | '1d' | '1w');

    // Calculate additional metrics
    const failureRate = summary.loginAttempts > 0 
      ? (summary.failedLogins / summary.loginAttempts) * 100 
      : 0;

    const enhancedSummary = {
      ...summary,
      failureRate: parseFloat(failureRate.toFixed(2)),
      riskLevel: getRiskLevel(summary),
      recommendations: getSecurityRecommendations(summary)
    };

    // Log the access
    logger.logUserActivity(
      authResult.user.id,
      'view_security_summary',
      { timeRange, summary: enhancedSummary },
      request.headers.get('x-request-id') || undefined
    );

    return NextResponse.json({
      success: true,
      summary: enhancedSummary,
      timeRange
    });

  } catch (error) {
    console.error('Error fetching security summary:', error);
    
    logger.error('api', 'Error fetching security summary', {
      error: error instanceof Error ? error.message : 'Unknown error'
    }, {
      error: error instanceof Error ? error : undefined,
      requestId: request.headers.get('x-request-id') || undefined
    });

    return NextResponse.json(
      { 
        success: false, 
        error: { message: 'Failed to fetch security summary' } 
      },
      { status: 500 }
    );
  }
}

function getRiskLevel(summary: any): 'low' | 'medium' | 'high' | 'critical' {
  // Calculate risk score based on security metrics
  let riskScore = 0;
  
  // Critical events add significant risk
  riskScore += summary.criticalEvents * 10;
  
  // High severity events add moderate risk
  riskScore += summary.highSeverityEvents * 5;
  
  // Unauthorized access attempts
  riskScore += summary.unauthorizedAccess * 3;
  
  // Failed login rate
  const failureRate = summary.loginAttempts > 0 
    ? (summary.failedLogins / summary.loginAttempts) * 100 
    : 0;
  
  if (failureRate > 30) riskScore += 8;
  else if (failureRate > 20) riskScore += 5;
  else if (failureRate > 10) riskScore += 2;
  
  // Rate limit exceeded events
  riskScore += summary.rateLimitExceeded * 1;
  
  // Determine risk level
  if (riskScore >= 20) return 'critical';
  if (riskScore >= 10) return 'high';
  if (riskScore >= 5) return 'medium';
  return 'low';
}

function getSecurityRecommendations(summary: any): string[] {
  const recommendations: string[] = [];
  
  if (summary.criticalEvents > 0) {
    recommendations.push('Immediate investigation required for critical security events');
  }
  
  if (summary.unauthorizedAccess > 0) {
    recommendations.push('Review access controls and authentication mechanisms');
  }
  
  const failureRate = summary.loginAttempts > 0 
    ? (summary.failedLogins / summary.loginAttempts) * 100 
    : 0;
    
  if (failureRate > 20) {
    recommendations.push('High login failure rate detected - consider implementing account lockout policies');
  } else if (failureRate > 10) {
    recommendations.push('Elevated login failure rate - monitor for potential brute force attacks');
  }
  
  if (summary.rateLimitExceeded > 10) {
    recommendations.push('Multiple rate limit violations - review API usage patterns');
  }
  
  if (summary.totalEvents === 0) {
    recommendations.push('No security events detected - ensure monitoring is properly configured');
  }
  
  // Default recommendations
  if (recommendations.length === 0) {
    recommendations.push('Security posture appears normal - continue regular monitoring');
    recommendations.push('Consider regular security audits and penetration testing');
  }
  
  return recommendations;
}