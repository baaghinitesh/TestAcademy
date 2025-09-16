'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Filter,
  Eye,
  MoreHorizontal,
  Play,
  Pause,
  Users,
  Clock,
  Target,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ErrorBoundary } from '@/components/error-boundary';
import { apiClient } from '@/lib/api-client';

interface Test {
  _id: string;
  title: string;
  description?: string;
  subject: string;
  classNumber: number;
  chapter?: string;
  duration: number;
  totalMarks: number;
  passingMarks: number;
  isActive: boolean;
  questions: string[];
  createdAt: string;
  attempts?: number;
}

interface ApiState {
  tests: Test[];
  loading: boolean;
  error: string | null;
}

interface FilterState {
  searchTerm: string;
  selectedClass: string;
  selectedSubject: string;
  selectedStatus: string;
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
    console.error('API call failed:', error);
    onError?.(error);
    return fallback;
  }
};

// Loading component with error boundary
const LoadingSpinner = () => (
  <ErrorBoundary fallback={<div className="text-center p-4">Loading failed</div>}>
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-2 text-muted-foreground">Loading tests...</p>
      </div>
    </div>
  </ErrorBoundary>
);

// Error display component with retry
const ErrorDisplay = ({ error, onRetry }: { error: string; onRetry: () => void }) => (
  <ErrorBoundary fallback={<div className="text-center p-4">Error display failed</div>}>
    <Card className="border-red-200">
      <CardContent className="p-6 text-center">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-red-600 mb-2">Error Loading Tests</h3>
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={onRetry} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </CardContent>
    </Card>
  </ErrorBoundary>
);

// Safe stats component
const TestStats = ({ tests }: { tests: Test[] }) => (
  <ErrorBoundary fallback={<div className="grid gap-4 md:grid-cols-4"><div className="text-center p-4">Stats unavailable</div></div>}>
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardContent className="p-4">
          <div className="text-2xl font-bold text-foreground">{tests?.length || 0}</div>
          <p className="text-xs text-muted-foreground">Total Tests</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="text-2xl font-bold text-green-600">
            {tests?.filter(test => test?.isActive)?.length || 0}
          </div>
          <p className="text-xs text-muted-foreground">Published</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="text-2xl font-bold text-gray-600">
            {tests?.filter(test => !test?.isActive)?.length || 0}
          </div>
          <p className="text-xs text-muted-foreground">Drafts</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="text-2xl font-bold text-blue-600">
            {tests?.reduce((sum, test) => sum + (test?.attempts || 0), 0) || 0}
          </div>
          <p className="text-xs text-muted-foreground">Total Attempts</p>
        </CardContent>
      </Card>
    </div>
  </ErrorBoundary>
);

// Safe test item component
const TestItem = ({ 
  test, 
  onToggleStatus, 
  onDelete 
}: { 
  test: Test; 
  onToggleStatus: (id: string, currentStatus: boolean) => void; 
  onDelete: (id: string) => void; 
}) => {
  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'bg-green-500' : 'bg-gray-400';
  };

  const getStatusText = (isActive: boolean) => {
    return isActive ? 'Published' : 'Draft';
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'Invalid Date';
    }
  };

  return (
    <ErrorBoundary fallback={<Card><CardContent className="p-4">Test item unavailable</CardContent></Card>}>
      <Card key={test?._id} className="hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary">Class {test?.classNumber || 'N/A'}</Badge>
                <Badge variant="outline">{test?.subject || 'N/A'}</Badge>
                <div className="flex items-center gap-1">
                  <div className={`h-2 w-2 rounded-full ${getStatusColor(test?.isActive || false)}`}></div>
                  <span className="text-xs text-muted-foreground">
                    {getStatusText(test?.isActive || false)}
                  </span>
                </div>
                {test?.chapter && (
                  <Badge variant="secondary">{test.chapter}</Badge>
                )}
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-1">
                  {test?.title || 'Untitled Test'}
                </h3>
                {test?.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {test.description}
                  </p>
                )}
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{test?.duration || 0} mins</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Target className="h-4 w-4" />
                  <span>{test?.totalMarks || 0} marks</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Eye className="h-4 w-4" />
                  <span>{test?.questions?.length || 0} questions</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{test?.attempts || 0} attempts</span>
                </div>
              </div>
              
              <div className="text-xs text-muted-foreground">
                Created: {formatDate(test?.createdAt || '')}
              </div>
            </div>
            
            <ErrorBoundary fallback={<div className="text-sm text-muted-foreground">Actions unavailable</div>}>
              <div className="flex items-center gap-2">
                <Button
                  variant={test?.isActive ? "destructive" : "default"}
                  size="sm"
                  onClick={() => onToggleStatus(test?._id || '', test?.isActive || false)}
                >
                  {test?.isActive ? (
                    <>
                      <Pause className="h-4 w-4 mr-1" />
                      Unpublish
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-1" />
                      Publish
                    </>
                  )}
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      View Test
                    </DropdownMenuItem>
                    <DropdownMenuItem className="flex items-center gap-2">
                      <Edit className="h-4 w-4" />
                      Edit Test
                    </DropdownMenuItem>
                    <DropdownMenuItem className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      View Attempts
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="flex items-center gap-2 text-red-600"
                      onClick={() => onDelete(test?._id || '')}
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </ErrorBoundary>
          </div>
        </CardContent>
      </Card>
    </ErrorBoundary>
  );
};

export default function TestsManagement() {
  const [apiState, setApiState] = useState<ApiState>({
    tests: [],
    loading: true,
    error: null
  });

  const [filters, setFilters] = useState<FilterState>({
    searchTerm: '',
    selectedClass: 'all',
    selectedSubject: 'all',
    selectedStatus: 'all'
  });

  const classes = [5, 6, 7, 8, 9, 10];
  const subjects = ['Mathematics', 'Science', 'English', 'Social Studies', 'Hindi'];

  const fetchTests = useCallback(async () => {
    setApiState(prev => ({ ...prev, loading: true, error: null }));

    const result = await safeApiCall(
      async () => {
        let url = '/api/tests';
        const params = new URLSearchParams();
        
        if (filters.selectedClass !== 'all') {
          params.append('classNumber', filters.selectedClass);
        }
        if (filters.selectedSubject !== 'all') {
          params.append('subject', filters.selectedSubject);
        }
        if (filters.selectedStatus !== 'all') {
          params.append('isActive', filters.selectedStatus);
        }
        
        if (params.toString()) {
          url += `?${params.toString()}`;
        }

        const response = await apiClient.get(url);
        return response.data?.tests || [];
      },
      [],
      (error) => {
        setApiState(prev => ({ 
          ...prev, 
          error: error?.message || 'Failed to fetch tests. Please check your connection and try again.' 
        }));
      }
    );

    setApiState(prev => ({
      ...prev,
      tests: result,
      loading: false
    }));
  }, [filters.selectedClass, filters.selectedSubject, filters.selectedStatus]);

  useEffect(() => {
    fetchTests();
  }, [fetchTests]);

  const toggleTestStatus = async (id: string, currentStatus: boolean) => {
    if (!id) return;

    await safeApiCall(
      async () => {
        await apiClient.patch(`/api/tests/${id}`, { isActive: !currentStatus });
        setApiState(prev => ({
          ...prev,
          tests: prev.tests.map(test => 
            test._id === id ? { ...test, isActive: !currentStatus } : test
          )
        }));
      },
      null,
      () => {
        // Optionally show error notification
        console.error('Failed to update test status');
      }
    );
  };

  const deleteTest = async (id: string) => {
    if (!id || !confirm('Are you sure you want to delete this test?')) return;
    
    await safeApiCall(
      async () => {
        await apiClient.delete(`/api/tests/${id}`);
        setApiState(prev => ({
          ...prev,
          tests: prev.tests.filter(test => test._id !== id)
        }));
      },
      null,
      () => {
        // Optionally show error notification
        console.error('Failed to delete test');
      }
    );
  };

  const filteredTests = apiState.tests.filter(test => {
    if (!test) return false;
    const searchLower = filters.searchTerm.toLowerCase();
    return (
      (test.title?.toLowerCase().includes(searchLower) || false) ||
      (test.subject?.toLowerCase().includes(searchLower) || false) ||
      (test.description?.toLowerCase().includes(searchLower) || false)
    );
  });

  if (apiState.loading) {
    return <LoadingSpinner />;
  }

  if (apiState.error) {
    return <ErrorDisplay error={apiState.error} onRetry={fetchTests} />;
  }

  return (
    <ErrorBoundary fallback={<div className="text-center p-8">Tests management is temporarily unavailable</div>}>
      <div className="space-y-6">
        {/* Header */}
        <ErrorBoundary fallback={<div className="p-4">Header unavailable</div>}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Manage Tests</h1>
              <p className="text-muted-foreground">
                Create and manage tests for your students
              </p>
            </div>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create New Test
            </Button>
          </div>
        </ErrorBoundary>

        {/* Filters and Search */}
        <ErrorBoundary fallback={<Card><CardContent className="p-4">Filters unavailable</CardContent></Card>}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters & Search
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-5">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search tests..."
                    value={filters.searchTerm}
                    onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                    className="pl-10"
                  />
                </div>
                
                <select
                  value={filters.selectedClass}
                  onChange={(e) => setFilters(prev => ({ ...prev, selectedClass: e.target.value }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="all">All Classes</option>
                  {classes.map(cls => (
                    <option key={cls} value={cls.toString()}>Class {cls}</option>
                  ))}
                </select>
                
                <select
                  value={filters.selectedSubject}
                  onChange={(e) => setFilters(prev => ({ ...prev, selectedSubject: e.target.value }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="all">All Subjects</option>
                  {subjects.map(subject => (
                    <option key={subject} value={subject}>{subject}</option>
                  ))}
                </select>
                
                <select
                  value={filters.selectedStatus}
                  onChange={(e) => setFilters(prev => ({ ...prev, selectedStatus: e.target.value }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="true">Published</option>
                  <option value="false">Draft</option>
                </select>
                
                <Button variant="outline" onClick={fetchTests}>
                  Apply Filters
                </Button>
              </div>
            </CardContent>
          </Card>
        </ErrorBoundary>

        {/* Stats */}
        <TestStats tests={apiState.tests} />

        {/* Tests List */}
        <ErrorBoundary fallback={<Card><CardContent className="p-8 text-center">Test list unavailable</CardContent></Card>}>
          <div className="space-y-4">
            {filteredTests.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="text-muted-foreground">
                    <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">No tests found</h3>
                    <p>Try adjusting your search criteria or create a new test.</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              filteredTests.map((test) => (
                <TestItem
                  key={test?._id || Math.random()}
                  test={test}
                  onToggleStatus={toggleTestStatus}
                  onDelete={deleteTest}
                />
              ))
            )}
          </div>
        </ErrorBoundary>
      </div>
    </ErrorBoundary>
  );
}