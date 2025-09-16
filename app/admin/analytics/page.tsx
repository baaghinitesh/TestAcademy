'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  BarChart, 
  Users, 
  BookOpen, 
  Award, 
  TrendingUp, 
  Download, 
  Eye, 
  Filter,
  AlertTriangle,
  RefreshCw,
  PieChart,
  Activity
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ErrorBoundary } from '@/components/error-boundary';
import { apiClient } from '@/lib/api-client';

interface AnalyticsOverview {
  totalStudents: number;
  totalTests: number;
  totalQuestions: number;
  totalMaterials: number;
  averageScore: number;
  totalAttempts: number;
}

interface TestPerformance {
  testId: string;
  testTitle: string;
  totalAttempts: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  completionRate: number;
}

interface AnalyticsData {
  overview?: AnalyticsOverview;
  testPerformance?: TestPerformance[];
  studentPerformance?: any[];
  subjectWisePerformance?: any[];
  timeBasedAnalytics?: any[];
  questionAnalytics?: any[];
}

interface ApiState {
  data: AnalyticsData | null;
  loading: boolean;
  error: string | null;
}

// Safe API call wrapper
const safeApiCall = async <T>(
  apiCall: () => Promise<T>,
  fallback: T,
  onError?: (error: any) => void
): Promise<T> => {
  try {
    return await apiCall();
  } catch (error) {
    // API call failed silently
    onError?.(error);
    return fallback;
  }
};

// Loading component
const LoadingSpinner = () => (
  <ErrorBoundary fallback={<div className="text-center p-4">Loading failed</div>}>
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-2 text-muted-foreground">Loading analytics...</p>
      </div>
    </div>
  </ErrorBoundary>
);

// Error display component
const ErrorDisplay = ({ error, onRetry }: { error: string; onRetry: () => void }) => (
  <ErrorBoundary fallback={<div className="text-center p-4">Error display failed</div>}>
    <Card className="border-red-200">
      <CardContent className="p-6 text-center">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-red-600 mb-2">Error Loading Analytics</h3>
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={onRetry} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </CardContent>
    </Card>
  </ErrorBoundary>
);

// Safe overview stats component
const OverviewStats = ({ overview }: { overview?: AnalyticsOverview }) => (
  <ErrorBoundary fallback={<div className="grid gap-4 md:grid-cols-3"><div className="text-center p-4">Overview unavailable</div></div>}>
    <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            <div>
              <div className="text-xl font-bold">{overview?.totalStudents || 0}</div>
              <p className="text-xs text-muted-foreground">Students</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-green-600" />
            <div>
              <div className="text-xl font-bold">{overview?.totalTests || 0}</div>
              <p className="text-xs text-muted-foreground">Tests</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-purple-600" />
            <div>
              <div className="text-xl font-bold">{overview?.totalQuestions || 0}</div>
              <p className="text-xs text-muted-foreground">Questions</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-orange-600" />
            <div>
              <div className="text-xl font-bold">{overview?.totalMaterials || 0}</div>
              <p className="text-xs text-muted-foreground">Materials</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-yellow-600" />
            <div>
              <div className="text-xl font-bold">{overview?.averageScore?.toFixed(1) || '0.0'}%</div>
              <p className="text-xs text-muted-foreground">Avg Score</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-red-600" />
            <div>
              <div className="text-xl font-bold">{overview?.totalAttempts || 0}</div>
              <p className="text-xs text-muted-foreground">Attempts</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </ErrorBoundary>
);

// Safe test performance component
const TestPerformanceTable = ({ tests }: { tests?: TestPerformance[] }) => (
  <ErrorBoundary fallback={<Card><CardContent className="p-4">Test performance unavailable</CardContent></Card>}>
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart className="h-5 w-5" />
          Test Performance
        </CardTitle>
      </CardHeader>
      <CardContent>
        {(!tests || tests.length === 0) ? (
          <div className="text-center py-8 text-muted-foreground">
            <BarChart className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No test data available</h3>
            <p>Test performance data will appear here once tests are created and attempted.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {tests.map((test) => (
              <ErrorBoundary key={test?.testId || Math.random()} fallback={<div className="p-2 text-muted-foreground">Test item unavailable</div>}>
                <div className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-semibold">{test?.testTitle || 'Unknown Test'}</h4>
                    <div className="text-sm text-muted-foreground">
                      {test?.completionRate?.toFixed(1) || '0'}% completion
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Attempts:</span>
                      <div className="font-semibold">{test?.totalAttempts || 0}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Average:</span>
                      <div className="font-semibold">{test?.averageScore?.toFixed(1) || '0'}%</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Highest:</span>
                      <div className="font-semibold text-green-600">{test?.highestScore || 0}%</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Lowest:</span>
                      <div className="font-semibold text-red-600">{test?.lowestScore || 0}%</div>
                    </div>
                  </div>
                  
                  {/* Progress bar for average score */}
                  <div className="mt-3">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(test?.averageScore || 0, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </ErrorBoundary>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  </ErrorBoundary>
);

export default function AnalyticsManagement() {
  const [apiState, setApiState] = useState<ApiState>({
    data: null,
    loading: true,
    error: null
  });

  const [filters, setFilters] = useState({
    dateRange: '7days',
    selectedSubject: 'all',
    selectedClass: 'all'
  });

  const fetchAnalytics = useCallback(async () => {
    setApiState(prev => ({ ...prev, loading: true, error: null }));

    const result = await safeApiCall(
      async () => {
        const params = new URLSearchParams({
          dateRange: filters.dateRange,
          subject: filters.selectedSubject,
          class: filters.selectedClass
        });

        const response = await apiClient.get(`/api/analytics?${params.toString()}`);
        return response.data || {};
      },
      {},
      (error) => {
        setApiState(prev => ({ 
          ...prev, 
          error: error?.message || 'Failed to fetch analytics data. Please check your connection and try again.' 
        }));
      }
    );

    setApiState(prev => ({
      ...prev,
      data: result,
      loading: false
    }));
  }, [filters.dateRange, filters.selectedSubject, filters.selectedClass]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const exportReport = async (type: 'pdf' | 'csv') => {
    await safeApiCall(
      async () => {
        const params = new URLSearchParams({
          format: type,
          dateRange: filters.dateRange,
          subject: filters.selectedSubject,
          class: filters.selectedClass
        });

        const response = await apiClient.get(`/api/analytics/export?${params.toString()}`, {
          responseType: 'blob'
        });
        
        const blob = new Blob([response.data]);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-report.${type}`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      null,
      () => {
        console.error('Failed to export report');
      }
    );
  };

  if (apiState.loading) {
    return <LoadingSpinner />;
  }

  if (apiState.error) {
    return <ErrorDisplay error={apiState.error} onRetry={fetchAnalytics} />;
  }

  return (
    <ErrorBoundary fallback={<div className="text-center p-8">Analytics is temporarily unavailable</div>}>
      <div className="space-y-6">
        {/* Header */}
        <ErrorBoundary fallback={<div className="p-4">Header unavailable</div>}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Analytics & Reports</h1>
              <p className="text-muted-foreground">
                Comprehensive performance insights and data analytics
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={() => exportReport('csv')}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
              <Button 
                onClick={() => exportReport('pdf')}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export PDF
              </Button>
            </div>
          </div>
        </ErrorBoundary>

        {/* Filters */}
        <ErrorBoundary fallback={<Card><CardContent className="p-4">Filters unavailable</CardContent></Card>}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <select
                  value={filters.dateRange}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="7days">Last 7 Days</option>
                  <option value="30days">Last 30 Days</option>
                  <option value="90days">Last 90 Days</option>
                  <option value="1year">Last Year</option>
                </select>
                
                <select
                  value={filters.selectedSubject}
                  onChange={(e) => setFilters(prev => ({ ...prev, selectedSubject: e.target.value }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="all">All Subjects</option>
                  <option value="Mathematics">Mathematics</option>
                  <option value="Science">Science</option>
                  <option value="English">English</option>
                  <option value="Social Studies">Social Studies</option>
                  <option value="Hindi">Hindi</option>
                </select>
                
                <select
                  value={filters.selectedClass}
                  onChange={(e) => setFilters(prev => ({ ...prev, selectedClass: e.target.value }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="all">All Classes</option>
                  <option value="5">Class 5</option>
                  <option value="6">Class 6</option>
                  <option value="7">Class 7</option>
                  <option value="8">Class 8</option>
                  <option value="9">Class 9</option>
                  <option value="10">Class 10</option>
                </select>
                
                <Button variant="outline" onClick={fetchAnalytics}>
                  Apply Filters
                </Button>
              </div>
            </CardContent>
          </Card>
        </ErrorBoundary>

        {/* Overview Stats */}
        <OverviewStats overview={apiState.data?.overview} />

        {/* Detailed Analytics Tabs */}
        <ErrorBoundary fallback={<Card><CardContent className="p-8 text-center">Detailed analytics unavailable</CardContent></Card>}>
          <Tabs defaultValue="performance" className="space-y-4">
            <TabsList>
              <TabsTrigger value="performance">Test Performance</TabsTrigger>
              <TabsTrigger value="students">Student Analytics</TabsTrigger>
              <TabsTrigger value="subjects">Subject Insights</TabsTrigger>
              <TabsTrigger value="trends">Trends & Patterns</TabsTrigger>
            </TabsList>

            <TabsContent value="performance">
              <TestPerformanceTable tests={apiState.data?.testPerformance} />
            </TabsContent>

            <TabsContent value="students">
              <Card>
                <CardHeader>
                  <CardTitle>Student Performance Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">Student Analytics</h3>
                    <p>Detailed student performance data will appear here.</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="subjects">
              <Card>
                <CardHeader>
                  <CardTitle>Subject-wise Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <PieChart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">Subject Insights</h3>
                    <p>Subject performance breakdowns will appear here.</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="trends">
              <Card>
                <CardHeader>
                  <CardTitle>Performance Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">Trends & Patterns</h3>
                    <p>Performance trends over time will appear here.</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </ErrorBoundary>
      </div>
    </ErrorBoundary>
  );
}