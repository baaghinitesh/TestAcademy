'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { performanceDebugger } from '@/lib/performance/debug';
import { Eye, Download, Trash2, Activity, Clock, Database, Zap } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface PerformanceMonitorProps {
  className?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function PerformanceMonitor({ 
  className,
  autoRefresh = true,
  refreshInterval = 5000
}: PerformanceMonitorProps) {
  const [summary, setSummary] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [metrics, setMetrics] = useState<any[]>([]);

  const refreshData = () => {
    const newSummary = performanceDebugger.getPerformanceSummary();
    setSummary(newSummary);
    
    // Get recent metrics (last 50)
    const exportedMetrics = JSON.parse(performanceDebugger.exportMetrics());
    setMetrics(exportedMetrics.slice(-50));
  };

  useEffect(() => {
    refreshData();
    
    if (autoRefresh) {
      const interval = setInterval(refreshData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  const exportMetrics = () => {
    const data = performanceDebugger.exportMetrics();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-metrics-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearMetrics = () => {
    performanceDebugger.clearMetrics();
    refreshData();
  };

  const getMetricIcon = (type: string) => {
    switch (type) {
      case 'api_call':
        return <Zap className="w-4 h-4" />;
      case 'component_render':
        return <Eye className="w-4 h-4" />;
      case 'database_query':
        return <Database className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const getPerformanceColor = (duration: number, type: string) => {
    let threshold = 100; // Default threshold
    
    switch (type) {
      case 'api_call':
        threshold = 1000;
        break;
      case 'component_render':
        threshold = 100;
        break;
      case 'database_query':
        threshold = 500;
        break;
    }

    if (duration < threshold * 0.5) return 'text-green-600';
    if (duration < threshold) return 'text-yellow-600';
    return 'text-red-600';
  };

  const averageMetrics = useMemo(() => {
    const grouped = metrics.reduce((acc, metric) => {
      if (!acc[metric.type]) {
        acc[metric.type] = { total: 0, count: 0, durations: [] };
      }
      if (metric.duration) {
        acc[metric.type].total += metric.duration;
        acc[metric.type].count++;
        acc[metric.type].durations.push(metric.duration);
      }
      return acc;
    }, {} as Record<string, { total: number; count: number; durations: number[] }>);

    return Object.entries(grouped).map(([type, data]) => ({
      type,
      average: data.count > 0 ? data.total / data.count : 0,
      count: data.count,
      min: Math.min(...data.durations),
      max: Math.max(...data.durations)
    }));
  }, [metrics]);

  if (process.env.NODE_ENV !== 'development') {
    return null; // Only show in development
  }

  // Temporarily disable on admin routes to prevent loading issues
  if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <>
      {/* Toggle Button */}
      <Button
        onClick={() => setIsVisible(!isVisible)}
        size="sm"
        variant="outline"
        className="fixed bottom-4 right-4 z-50 bg-background shadow-lg"
      >
        <Activity className="w-4 h-4 mr-2" />
        Performance
      </Button>

      {/* Performance Monitor Panel */}
      {isVisible && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Performance Monitor</CardTitle>
                  <CardDescription>
                    Real-time performance metrics and debugging information
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={refreshData}>
                    Refresh
                  </Button>
                  <Button size="sm" variant="outline" onClick={exportMetrics}>
                    <Download className="w-4 h-4 mr-1" />
                    Export
                  </Button>
                  <Button size="sm" variant="destructive" onClick={clearMetrics}>
                    <Trash2 className="w-4 h-4 mr-1" />
                    Clear
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setIsVisible(false)}>
                    ×
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <Tabs defaultValue="summary">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="summary">Summary</TabsTrigger>
                  <TabsTrigger value="api">API Calls</TabsTrigger>
                  <TabsTrigger value="components">Components</TabsTrigger>
                  <TabsTrigger value="metrics">All Metrics</TabsTrigger>
                </TabsList>
                
                <TabsContent value="summary" className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Quick Stats</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Total Metrics:</span>
                          <Badge>{summary?.totalMetrics || 0}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Slow API Calls:</span>
                          <Badge variant={summary?.slowApiCalls?.length > 0 ? 'destructive' : 'secondary'}>
                            {summary?.slowApiCalls?.length || 0}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Slow Components:</span>
                          <Badge variant={summary?.slowComponents?.length > 0 ? 'destructive' : 'secondary'}>
                            {summary?.slowComponents?.length || 0}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Average Performance</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {averageMetrics.map(metric => (
                          <div key={metric.type} className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <span className="capitalize">{metric.type.replace('_', ' ')}</span>
                              <span className={getPerformanceColor(metric.average, metric.type)}>
                                {metric.average.toFixed(1)}ms
                              </span>
                            </div>
                            <Progress 
                              value={Math.min(100, (metric.average / 1000) * 100)} 
                              className="h-1"
                            />
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
                
                <TabsContent value="api" className="space-y-2">
                  <div className="space-y-2 max-h-96 overflow-auto">
                    {summary?.slowApiCalls?.map((call: any, index: number) => (
                      <Card key={index} className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Zap className="w-4 h-4" />
                            <span className="text-sm font-medium">
                              {call.method} {call.endpoint}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={getPerformanceColor(call.duration, 'api_call')}>
                              {call.duration.toFixed(1)}ms
                            </Badge>
                            <Badge variant={call.status < 400 ? 'secondary' : 'destructive'}>
                              {call.status}
                            </Badge>
                          </div>
                        </div>
                      </Card>
                    )) || (
                      <p className="text-center text-muted-foreground py-8">
                        No slow API calls detected
                      </p>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="components" className="space-y-2">
                  <div className="space-y-2 max-h-96 overflow-auto">
                    {summary?.slowComponents?.map((component: any, index: number) => (
                      <Card key={index} className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Eye className="w-4 h-4" />
                            <span className="text-sm font-medium">{component.key}</span>
                          </div>
                          <Badge className={getPerformanceColor(component.duration, 'component_render')}>
                            {component.duration.toFixed(1)}ms
                          </Badge>
                        </div>
                      </Card>
                    )) || (
                      <p className="text-center text-muted-foreground py-8">
                        No slow components detected
                      </p>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="metrics" className="space-y-2">
                  <div className="space-y-2 max-h-96 overflow-auto">
                    {metrics.map((metric, index) => (
                      <Collapsible key={index}>
                        <CollapsibleTrigger className="w-full">
                          <Card className="p-3 hover:bg-muted/50">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {getMetricIcon(metric.type)}
                                <span className="text-sm font-medium">{metric.key}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                {metric.duration && (
                                  <Badge className={getPerformanceColor(metric.duration, metric.type)}>
                                    {metric.duration.toFixed(1)}ms
                                  </Badge>
                                )}
                                <Badge variant="outline" className="text-xs">
                                  {metric.type}
                                </Badge>
                              </div>
                            </div>
                          </Card>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <Card className="mt-2 p-3 bg-muted/30">
                            <pre className="text-xs text-muted-foreground overflow-auto">
                              {JSON.stringify(metric, null, 2)}
                            </pre>
                          </Card>
                        </CollapsibleContent>
                      </Collapsible>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}