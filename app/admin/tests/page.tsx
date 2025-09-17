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
const safeApiCall = async <T,>(
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
  onToggleStatus: (id: string) => void;
  onDelete: (id: string) => void;
}) => {
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'Invalid Date';
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <ErrorBoundary fallback={<Card><CardContent className="p-4">Test item unavailable</CardContent></Card>}>
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary">Class {test?.classNumber || 'N/A'}</Badge>
                <Badge variant="outline">{test?.subject || 'Unknown Subject'}</Badge>
                {test?.chapter && (
                  <Badge variant="secondary">{test.chapter}</Badge>
                )}
                <Badge 
                  variant={test?.isActive ? "default" : "secondary"}
                  className={test?.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                >
                  {test?.isActive ? 'Published' : 'Draft'}
                </Badge>
              </div>
              
              <CardTitle className="text-lg">
                {test?.title || 'Untitled Test'}
              </CardTitle>
              
              {test?.description && (
                <CardDescription className="line-clamp-2">
                  {test.description}
                </CardDescription>
              )}
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => window.open(`/admin/tests/${test?._id}/edit`, '_blank')}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Test
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.open(`/test/preview/${test?._id}`, '_blank')}>
                  <Eye className="mr-2 h-4 w-4" />
                  Preview Test
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onToggleStatus(test?._id)}>
                  {test?.isActive ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
                  {test?.isActive ? 'Unpublish' : 'Publish'}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onDelete(test?._id)}
                  className="text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Test
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>{formatDuration(test?.duration || 0)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <span>{test?.totalMarks || 0} marks</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>{test?.attempts || 0} attempts</span>
            </div>
            <div className="text-muted-foreground">
              Created: {formatDate(test?.createdAt || '')}
            </div>
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

  const fetchTests = useCallback(async () => {
    setApiState(prev => ({ ...prev, loading: true, error: null }));

    const result = await safeApiCall(
      async () => {
        const params = new URLSearchParams({
          class: filters.selectedClass,
          subject: filters.selectedSubject,
          status: filters.selectedStatus
        });

        const response = await apiClient.get(`/api/tests?${params.toString()}`);
        const data = response.data;
        
        // Ensure we always return an array
        if (Array.isArray(data)) {
          return data;
        } else if (data && Array.isArray(data.tests)) {
          return data.tests;
        } else {
          console.warn('API returned non-array data:', data);
          return [];
        }
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

  const toggleTestStatus = async (id: string) => {
    if (!id) return;

    await safeApiCall(
      async () => {
        const test = apiState.tests.find(t => t._id === id);
        const newStatus = !test?.isActive;
        
        await apiClient.patch(`/api/tests/${id}`, { isActive: newStatus });
        setApiState(prev => ({
          ...prev,
          tests: prev.tests.map(test =>
            test._id === id ? { ...test, isActive: newStatus } : test
          )
        }));
      },
      null,
      () => {
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
        console.error('Failed to delete test');
      }
    );
  };

  // Ensure tests is always an array with proper safety checks
  const testsArray = Array.isArray(apiState.tests) ? apiState.tests : [];
  
  const filteredTests = testsArray.filter(test => {
    if (!test) return false;
    
    const matchesSearch = !filters.searchTerm || 
      test.title?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      test.description?.toLowerCase().includes(filters.searchTerm.toLowerCase());
    
    const matchesClass = filters.selectedClass === 'all' || 
      test.classNumber?.toString() === filters.selectedClass;
    
    const matchesSubject = filters.selectedSubject === 'all' || 
      test.subject === filters.selectedSubject;
    
    const matchesStatus = filters.selectedStatus === 'all' || 
      (filters.selectedStatus === 'published' && test.isActive) ||
      (filters.selectedStatus === 'draft' && !test.isActive);
    
    return matchesSearch && matchesClass && matchesSubject && matchesStatus;
  });

  if (apiState.loading) {
    return <LoadingSpinner />;
  }

  if (apiState.error) {
    return <ErrorDisplay error={apiState.error} onRetry={fetchTests} />;
  }

  return (
    <ErrorBoundary fallback={<div className="text-center p-8">Test management is temporarily unavailable</div>}>
      <div className="space-y-6">
        {/* Header */}
        <ErrorBoundary fallback={<div className="p-4">Header unavailable</div>}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Test Management</h1>
              <p className="text-muted-foreground">
                Create, manage, and analyze student assessments
              </p>
            </div>
            
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create Test
            </Button>
          </div>
        </ErrorBoundary>

        {/* Stats */}
        <TestStats tests={testsArray} />

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
                  <option value="5">Class 5</option>
                  <option value="6">Class 6</option>
                  <option value="7">Class 7</option>
                  <option value="8">Class 8</option>
                  <option value="9">Class 9</option>
                  <option value="10">Class 10</option>
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
                  value={filters.selectedStatus}
                  onChange={(e) => setFilters(prev => ({ ...prev, selectedStatus: e.target.value }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                </select>
                
                <Button 
                  onClick={fetchTests}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </Button>
              </div>
            </CardContent>
          </Card>
        </ErrorBoundary>

        {/* Tests List */}
        <ErrorBoundary fallback={<div className="text-center p-8">Tests list unavailable</div>}>
          {filteredTests.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No tests found</h3>
                <p className="text-muted-foreground mb-6">
                  {testsArray.length === 0 
                    ? "No tests have been created yet. Create your first test to get started."
                    : "No tests match your current filters. Try adjusting your search criteria."
                  }
                </p>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Create First Test
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredTests.map((test) => (
                <TestItem 
                  key={test._id}
                  test={test} 
                  onToggleStatus={toggleTestStatus}
                  onDelete={deleteTest}
                />
              ))}
            </div>
          )}
        </ErrorBoundary>
      </div>
    </ErrorBoundary>
  );
}