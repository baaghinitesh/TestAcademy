'use client';

import { useState, useEffect } from 'react';
import { Activity, AlertTriangle, Shield, Database, Server, Clock, Eye, Download } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface LogEntry {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error' | 'critical';
  category: 'auth' | 'api' | 'db' | 'security' | 'performance' | 'user' | 'system';
  message: string;
  metadata?: Record<string, any>;
  userId?: string;
  requestId?: string;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

interface PerformanceMetrics {
  totalRequests: number;
  averageResponseTime: number;
  errorRate: number;
  slowRequests: number;
  averageDbQueries: number;
  averageDbDuration: number;
}

interface SecuritySummary {
  totalEvents: number;
  criticalEvents: number;
  highSeverityEvents: number;
  loginAttempts: number;
  failedLogins: number;
  unauthorizedAccess: number;
  rateLimitExceeded: number;
}

interface SystemMetrics {
  apiResponseTime: number;
  dbQueryTime: number;
  errorRate: number;
  uptime: number;
  memoryUsage: number;
  cpuUsage: number;
}

interface MonitoringDashboardProps {
  refreshInterval?: number; // milliseconds
}

export function MonitoringDashboard({ refreshInterval = 30000 }: MonitoringDashboardProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  const [securitySummary, setSecuritySummary] = useState<SecuritySummary | null>(null);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [logLevel, setLogLevel] = useState<string>('all');
  const [logCategory, setLogCategory] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<string>('1h');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState('overview');

  // Auto-refresh
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch monitoring data
  const fetchMonitoringData = async () => {
    try {
      setError(null);
      
      // Fetch performance metrics
      const perfResponse = await fetch(`/api/performance/monitor?timeRange=${timeRange}`);
      if (perfResponse.ok) {
        const perfData = await perfResponse.json();
        setPerformanceMetrics(perfData.metrics);
        setSystemMetrics(perfData.systemMetrics);
      }

      // Fetch security summary
      const securityResponse = await fetch(`/api/security/summary?timeRange=${timeRange}`);
      if (securityResponse.ok) {
        const securityData = await securityResponse.json();
        setSecuritySummary(securityData.summary);
      }

      // Fetch logs
      const logParams = new URLSearchParams({
        timeRange,
        limit: '100'
      });
      
      if (logLevel !== 'all') logParams.append('level', logLevel);
      if (logCategory !== 'all') logParams.append('category', logCategory);
      if (searchTerm) logParams.append('search', searchTerm);

      const logsResponse = await fetch(`/api/monitoring/logs?${logParams}`);
      if (logsResponse.ok) {
        const logsData = await logsResponse.json();
        setLogs(logsData.logs || []);
      }
    } catch (error) {
      // Error fetching monitoring data
      setError('Failed to fetch monitoring data');
    } finally {
      setLoading(false);
    }
  };

  // Export logs
  const handleExportLogs = async (format: 'json' | 'csv') => {
    try {
      const params = new URLSearchParams({
        format,
        timeRange,
        ...(logLevel !== 'all' && { level: logLevel }),
        ...(logCategory !== 'all' && { category: logCategory }),
        ...(searchTerm && { search: searchTerm })
      });

      const response = await fetch(`/api/monitoring/logs/export?${params}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `logs_${Date.now()}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      // Export error
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  // Get log level badge variant
  const getLogLevelBadge = (level: LogEntry['level']) => {
    switch (level) {
      case 'debug': return 'secondary';
      case 'info': return 'default';
      case 'warn': return 'destructive';
      case 'error': return 'destructive';
      case 'critical': return 'destructive';
      default: return 'outline';
    }
  };

  // Get log level color
  const getLogLevelColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'debug': return '#6b7280';
      case 'info': return '#3b82f6';
      case 'warn': return '#f59e0b';
      case 'error': return '#ef4444';
      case 'critical': return '#dc2626';
      default: return '#6b7280';
    }
  };

  useEffect(() => {
    fetchMonitoringData();
  }, [timeRange, logLevel, logCategory, searchTerm]);

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchMonitoringData();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, timeRange, logLevel, logCategory, searchTerm]);

  // Render system status cards
  const renderSystemStatus = () => {
    if (!systemMetrics) return null;

    const getStatusColor = (value: number, thresholds: { good: number; warning: number }) => {
      if (value <= thresholds.good) return 'text-green-600';
      if (value <= thresholds.warning) return 'text-yellow-600';
      return 'text-red-600';
    };

    const getStatusBadge = (value: number, thresholds: { good: number; warning: number }) => {
      if (value <= thresholds.good) return { variant: 'default', text: 'Good' };
      if (value <= thresholds.warning) return { variant: 'destructive', text: 'Warning' };
      return { variant: 'destructive', text: 'Critical' };
    };

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemMetrics.apiResponseTime}ms</div>
            <Badge 
              variant={getStatusBadge(systemMetrics.apiResponseTime, { good: 200, warning: 500 }).variant as any}
              className="mt-1"
            >
              {getStatusBadge(systemMetrics.apiResponseTime, { good: 200, warning: 500 }).text}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Database Query Time</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemMetrics.dbQueryTime}ms</div>
            <Badge 
              variant={getStatusBadge(systemMetrics.dbQueryTime, { good: 100, warning: 300 }).variant as any}
              className="mt-1"
            >
              {getStatusBadge(systemMetrics.dbQueryTime, { good: 100, warning: 300 }).text}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(systemMetrics.errorRate * 100).toFixed(2)}%</div>
            <Badge 
              variant={getStatusBadge(systemMetrics.errorRate, { good: 0.01, warning: 0.05 }).variant as any}
              className="mt-1"
            >
              {getStatusBadge(systemMetrics.errorRate, { good: 0.01, warning: 0.05 }).text}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemMetrics.uptime.toFixed(2)}%</div>
            <Badge 
              variant={getStatusBadge(100 - systemMetrics.uptime, { good: 1, warning: 5 }).variant as any}
              className="mt-1"
            >
              {getStatusBadge(100 - systemMetrics.uptime, { good: 1, warning: 5 }).text}
            </Badge>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Render performance metrics
  const renderPerformanceMetrics = () => {
    if (!performanceMetrics) return null;

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Request Performance</CardTitle>
            <CardDescription>API request metrics for the selected time range</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="font-medium">Total Requests</span>
                <span className="text-2xl font-bold">{performanceMetrics.totalRequests.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Average Response Time</span>
                <span className="text-lg">{performanceMetrics.averageResponseTime}ms</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Error Rate</span>
                <span className={`text-lg ${performanceMetrics.errorRate > 0.05 ? 'text-red-600' : 'text-green-600'}`}>
                  {(performanceMetrics.errorRate * 100).toFixed(2)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Slow Requests ({'>'}5s)</span>
                <span className="text-lg">{performanceMetrics.slowRequests}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Database Performance</CardTitle>
            <CardDescription>Database query metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="font-medium">Average Queries per Request</span>
                <span className="text-lg">{performanceMetrics.averageDbQueries}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Average Query Duration</span>
                <span className="text-lg">{performanceMetrics.averageDbDuration}ms</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Render security summary
  const renderSecuritySummary = () => {
    if (!securitySummary) return null;

    const hasSecurityIssues = securitySummary.criticalEvents > 0 || 
                             securitySummary.unauthorizedAccess > 0 ||
                             (securitySummary.failedLogins / Math.max(securitySummary.loginAttempts, 1)) > 0.1;

    return (
      <div className="space-y-4">
        {hasSecurityIssues && (
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertTitle>Security Attention Required</AlertTitle>
            <AlertDescription>
              There are security events that require your attention. Please review the details below.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Security Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{securitySummary.totalEvents}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Critical Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${securitySummary.criticalEvents > 0 ? 'text-red-600' : ''}`}>
                {securitySummary.criticalEvents}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Failed Logins</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{securitySummary.failedLogins}</div>
              <p className="text-xs text-muted-foreground">
                {securitySummary.loginAttempts > 0 && 
                  `${((securitySummary.failedLogins / securitySummary.loginAttempts) * 100).toFixed(1)}% of attempts`
                }
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Unauthorized Access</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${securitySummary.unauthorizedAccess > 0 ? 'text-red-600' : ''}`}>
                {securitySummary.unauthorizedAccess}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  // Render logs table
  const renderLogsTable = () => {
    const filteredLogs = logs.filter(log => 
      searchTerm === '' || 
      log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
      <div className="space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <Label htmlFor="search">Search Logs</Label>
            <Input
              id="search"
              placeholder="Search in messages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div>
            <Label>Log Level</Label>
            <Select value={logLevel} onValueChange={setLogLevel}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="debug">Debug</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="warn">Warning</SelectItem>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label>Category</Label>
            <Select value={logCategory} onValueChange={setLogCategory}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="api">API</SelectItem>
                <SelectItem value="auth">Auth</SelectItem>
                <SelectItem value="db">Database</SelectItem>
                <SelectItem value="security">Security</SelectItem>
                <SelectItem value="performance">Performance</SelectItem>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => handleExportLogs('json')}>
              <Download className="h-4 w-4 mr-2" />
              JSON
            </Button>
            <Button variant="outline" onClick={() => handleExportLogs('csv')}>
              <Download className="h-4 w-4 mr-2" />
              CSV
            </Button>
          </div>
        </div>

        {/* Logs Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Request</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log, index) => (
                <TableRow key={index}>
                  <TableCell className="text-xs font-mono">
                    {formatTimestamp(log.timestamp)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getLogLevelBadge(log.level) as any}>
                      {log.level}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{log.category}</Badge>
                  </TableCell>
                  <TableCell className="max-w-md">
                    <div className="truncate" title={log.message}>
                      {log.message}
                    </div>
                    {log.error && (
                      <div className="text-xs text-red-600 mt-1">
                        {log.error.name}: {log.error.message}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-xs">
                    {log.userId || '-'}
                  </TableCell>
                  <TableCell className="text-xs font-mono">
                    {log.requestId || '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredLogs.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No logs found matching your criteria.
          </div>
        )}
      </div>
    );
  };

  if (loading && !logs.length) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading monitoring data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">System Monitoring</h1>
          <p className="text-muted-foreground">
            Real-time monitoring and logging dashboard
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last Hour</SelectItem>
              <SelectItem value="1d">Last Day</SelectItem>
              <SelectItem value="1w">Last Week</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            variant={autoRefresh ? 'default' : 'outline'}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <Activity className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-pulse' : ''}`} />
            Auto Refresh
          </Button>
        </div>
      </div>

      {error && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* System Status */}
      {renderSystemStatus()}

      {/* Tabbed Content */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="overview">Performance</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          {renderPerformanceMetrics()}
        </TabsContent>
        
        <TabsContent value="security" className="space-y-6">
          {renderSecuritySummary()}
        </TabsContent>
        
        <TabsContent value="logs" className="space-y-6">
          {renderLogsTable()}
        </TabsContent>
      </Tabs>
    </div>
  );
}