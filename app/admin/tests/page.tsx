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
  RefreshCw,
  Upload,
  Download,
  BookOpen,
  Settings,
  CheckCircle,
  XCircle,
  FileText,
  BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CrashPreventionBoundary } from '@/components/crash-prevention-system';
import { apiClient } from '@/lib/api-client';
import { EnhancedCsvUpload } from '@/components/questions/enhanced-csv-upload';
import { TestBuilder } from '@/components/tests/test-builder';

interface Test {
  _id: string;
  title: string;
  description?: string;
  subject: {
    _id: string;
    name: string;
  };
  classNumber: number;
  chapter?: string;
  duration: number;
  totalMarks: number;
  passingMarks: number;
  totalQuestions: number;
  isActive: boolean;
  isPublished: boolean;
  questions: string[];
  createdAt: string;
  attempts?: number;
  actualQuestionCount?: number;
}

interface ApiState {
  tests: Test[];
  loading: boolean;
  error: string | null;
  subjects: Array<{_id: string; name: string}>;
}

interface FilterState {
  searchTerm: string;
  selectedClass: string;
  selectedSubject: string;
  selectedStatus: string;
}

// Safe API call wrapper with proper error handling
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

// Ensure array helper
const ensureArray = <T>(data: any): T[] => {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.tests)) return data.tests;
  if (data && Array.isArray(data.data)) return data.data;
  return [];
};

// Format helpers
const formatDuration = (minutes: number): string => {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
};

const formatDate = (dateString: string): string => {
  if (!dateString) return 'Unknown';
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return 'Invalid Date';
  }
};

// Loading component
const LoadingSpinner = () => (
  <CrashPreventionBoundary fallback={<div className="text-center p-4">Loading failed</div>}>
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-2 text-muted-foreground">Loading tests...</p>
      </div>
    </div>
  </CrashPreventionBoundary>
);

// Error display component
const ErrorDisplay = ({ error, onRetry }: { error: string; onRetry: () => void }) => (
  <CrashPreventionBoundary fallback={<div className="text-center p-4">Error display failed</div>}>
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
  </CrashPreventionBoundary>
);

// Stats component
const TestStats = ({ tests }: { tests: Test[] }) => {
  const safeTests = ensureArray<Test>(tests);
  
  return (
    <CrashPreventionBoundary fallback={<div className="grid gap-4 md:grid-cols-4"><div className="text-center p-4">Stats unavailable</div></div>}>
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-foreground">{safeTests.length}</div>
            <p className="text-xs text-muted-foreground">Total Tests</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {safeTests.filter(test => test?.isActive && test?.isPublished).length}
            </div>
            <p className="text-xs text-muted-foreground">Published</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">
              {safeTests.filter(test => test?.isActive && !test?.isPublished).length}
            </div>
            <p className="text-xs text-muted-foreground">Active Drafts</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {safeTests.reduce((sum, test) => sum + (test?.totalQuestions || test?.actualQuestionCount || 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground">Total Questions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">
              {safeTests.reduce((sum, test) => sum + (test?.attempts || 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground">Total Attempts</p>
          </CardContent>
        </Card>
      </div>
    </CrashPreventionBoundary>
  );
};

// Test item component with enhanced features
const TestItem = ({ 
  test, 
  onToggleStatus, 
  onDelete,
  onEdit,
  onViewQuestions,
  onAnalytics
}: { 
  test: Test; 
  onToggleStatus: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (test: Test) => void;
  onViewQuestions: (test: Test) => void;
  onAnalytics: (test: Test) => void;
}) => {
  if (!test) return null;

  const getStatusColor = () => {
    if (test.isActive && test.isPublished) return 'bg-green-500';
    if (test.isActive && !test.isPublished) return 'bg-yellow-500';
    return 'bg-gray-500';
  };

  const getStatusText = () => {
    if (test.isActive && test.isPublished) return 'Published';
    if (test.isActive && !test.isPublished) return 'Draft';
    return 'Inactive';
  };

  return (
    <CrashPreventionBoundary fallback={<Card><CardContent className="p-4">Test item unavailable</CardContent></Card>}>
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="font-semibold text-lg">{test.title}</h3>
                <div className={`h-2 w-2 rounded-full ${getStatusColor()}`} />
                <Badge variant="outline" className="text-xs">
                  {getStatusText()}
                </Badge>
              </div>
              
              {test.description && (
                <p className="text-muted-foreground text-sm mb-2">{test.description}</p>
              )}
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <BookOpen className="h-4 w-4" />
                  Class {test.classNumber}
                </span>
                <span>{typeof test.subject === 'object' ? test.subject.name : test.subject}</span>
                {test.chapter && <span>• {test.chapter}</span>}
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => onEdit(test)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Test
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onViewQuestions(test)}>
                  <FileText className="mr-2 h-4 w-4" />
                  Manage Questions
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.open(`/test/preview/${test._id}`, '_blank')}>
                  <Eye className="mr-2 h-4 w-4" />
                  Preview Test
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAnalytics(test)}>
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Analytics
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onToggleStatus(test._id)}>
                  {test.isActive ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
                  {test.isActive ? 'Deactivate' : 'Activate'}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onDelete(test._id)}
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
              <span>{formatDuration(test.duration || 0)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <span>{test.totalMarks || 0} marks</span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span>{test.totalQuestions || test.actualQuestionCount || 0} questions</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>{test.attempts || 0} attempts</span>
            </div>
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            Created: {formatDate(test.createdAt)}
          </div>
        </CardContent>
      </Card>
    </CrashPreventionBoundary>
  );
};

function TestsManagement() {
  const [apiState, setApiState] = useState<ApiState>({
    tests: [],
    loading: true,
    error: null,
    subjects: []
  });

  const [filters, setFilters] = useState<FilterState>({
    searchTerm: '',
    selectedClass: 'all',
    selectedSubject: 'all',
    selectedStatus: 'all'
  });

  const [showCreateTest, setShowCreateTest] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [selectedTest, setSelectedTest] = useState<Test | null>(null);

  // Fetch tests with proper error handling
  const fetchTests = useCallback(async () => {
    setApiState(prev => ({ ...prev, loading: true, error: null }));

    const result = await safeApiCall(
      async () => {
        const params = new URLSearchParams();
        if (filters.selectedClass !== 'all') params.append('class', filters.selectedClass);
        if (filters.selectedSubject !== 'all') params.append('subject', filters.selectedSubject);
        
        const response = await apiClient.get(`/api/tests?${params.toString()}`);
        return ensureArray<Test>(response.data);
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
  }, [filters.selectedClass, filters.selectedSubject]);

  // Fetch subjects
  const fetchSubjects = useCallback(async () => {
    const result = await safeApiCall(
      async () => {
        const response = await apiClient.get('/api/subjects');
        return ensureArray(response.data);
      },
      [],
      () => console.error('Failed to fetch subjects')
    );

    setApiState(prev => ({ ...prev, subjects: result }));
  }, []);

  useEffect(() => {
    fetchTests();
    fetchSubjects();
  }, [fetchTests, fetchSubjects]);

  // Toggle test status with proper array handling
  const toggleTestStatus = async (id: string) => {
    if (!id) return;

    await safeApiCall(
      async () => {
        const testsArray = ensureArray<Test>(apiState.tests);
        const test = testsArray.find(t => t._id === id);
        const newStatus = !test?.isActive;
        
        await apiClient.patch(`/api/tests/${id}`, { isActive: newStatus });
        
        setApiState(prev => ({
          ...prev,
          tests: ensureArray<Test>(prev.tests).map(test =>
            test._id === id ? { ...test, isActive: newStatus } : test
          )
        }));
      },
      null,
      () => console.error('Failed to update test status')
    );
  };

  // Delete test with proper array handling
  const deleteTest = async (id: string) => {
    if (!id || !confirm('Are you sure you want to delete this test? This action cannot be undone.')) return;

    await safeApiCall(
      async () => {
        await apiClient.delete(`/api/tests/${id}`);
        
        setApiState(prev => ({
          ...prev,
          tests: ensureArray<Test>(prev.tests).filter(test => test._id !== id)
        }));
      },
      null,
      () => console.error('Failed to delete test')
    );
  };

  // Handle test editing
  const handleEditTest = (test: Test) => {
    setSelectedTest(test);
    setShowCreateTest(true);
  };

  // Handle viewing questions
  const handleViewQuestions = (test: Test) => {
    window.open(`/admin/tests/${test._id}/questions`, '_blank');
  };

  // Handle analytics
  const handleAnalytics = (test: Test) => {
    window.open(`/admin/tests/${test._id}/analytics`, '_blank');
  };

  // Ensure tests is always an array
  const testsArray = ensureArray<Test>(apiState.tests);
  
  const filteredTests = testsArray.filter(test => {
    if (!test) return false;
    
    const matchesSearch = !filters.searchTerm || 
      test.title?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      test.description?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      test.chapter?.toLowerCase().includes(filters.searchTerm.toLowerCase());
    
    const matchesClass = filters.selectedClass === 'all' || 
      test.classNumber?.toString() === filters.selectedClass;
    
    const subjectName = typeof test.subject === 'object' ? test.subject.name : test.subject;
    const matchesSubject = filters.selectedSubject === 'all' || 
      subjectName === filters.selectedSubject;
    
    const matchesStatus = filters.selectedStatus === 'all' || 
      (filters.selectedStatus === 'published' && test.isActive && test.isPublished) ||
      (filters.selectedStatus === 'draft' && test.isActive && !test.isPublished) ||
      (filters.selectedStatus === 'inactive' && !test.isActive);
    
    return matchesSearch && matchesClass && matchesSubject && matchesStatus;
  });

  if (apiState.loading) {
    return <LoadingSpinner />;
  }

  if (apiState.error) {
    return <ErrorDisplay error={apiState.error} onRetry={fetchTests} />;
  }

  return (
    <CrashPreventionBoundary 
      level="page" 
      context="Admin Test Management"
      fallback={<div className="text-center p-8">Test management is temporarily unavailable</div>}
    >
      <div className="space-y-6">
        {/* Header */}
        <CrashPreventionBoundary fallback={<div className="p-4">Header unavailable</div>}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Test Management</h1>
              <p className="text-muted-foreground">
                Create, manage, and analyze student assessments with advanced tools
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Dialog open={showBulkUpload} onOpenChange={setShowBulkUpload}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    Bulk Questions
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Bulk Upload Questions</DialogTitle>
                    <DialogDescription>
                      Upload questions in CSV or Excel format to quickly populate your tests
                    </DialogDescription>
                  </DialogHeader>
                  <EnhancedCsvUpload onClose={() => {
                    setShowBulkUpload(false);
                    fetchTests();
                  }} />
                </DialogContent>
              </Dialog>

              <Dialog open={showCreateTest} onOpenChange={(open) => {
                setShowCreateTest(open);
                if (!open) setSelectedTest(null);
              }}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Create Test
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{selectedTest ? 'Edit Test' : 'Create New Test'}</DialogTitle>
                    <DialogDescription>
                      Build a comprehensive test with questions, settings, and publishing options
                    </DialogDescription>
                  </DialogHeader>
                  <TestBuilder 
                    initialTest={selectedTest}
                    subjects={apiState.subjects}
                    onTestSaved={() => {
                      setShowCreateTest(false);
                      setSelectedTest(null);
                      fetchTests();
                    }}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CrashPreventionBoundary>

        {/* Stats */}
        <TestStats tests={testsArray} />

        {/* Filters */}
        <CrashPreventionBoundary fallback={<Card><CardContent className="p-4">Filters unavailable</CardContent></Card>}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters & Search
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-6">
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
                  <option value="11">Class 11</option>
                  <option value="12">Class 12</option>
                </select>
                
                <select
                  value={filters.selectedSubject}
                  onChange={(e) => setFilters(prev => ({ ...prev, selectedSubject: e.target.value }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="all">All Subjects</option>
                  {apiState.subjects.map(subject => (
                    <option key={subject._id} value={subject.name}>{subject.name}</option>
                  ))}
                </select>
                
                <select
                  value={filters.selectedStatus}
                  onChange={(e) => setFilters(prev => ({ ...prev, selectedStatus: e.target.value }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                  <option value="inactive">Inactive</option>
                </select>
                
                <Button 
                  onClick={fetchTests}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </Button>

                <Button 
                  onClick={() => setFilters({ searchTerm: '', selectedClass: 'all', selectedSubject: 'all', selectedStatus: 'all' })}
                  variant="ghost"
                  className="flex items-center gap-2"
                >
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>
        </CrashPreventionBoundary>

        {/* Tests List */}
        <CrashPreventionBoundary fallback={<div className="text-center p-8">Tests list unavailable</div>}>
          {filteredTests.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Target className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-semibold mb-2">No tests found</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  {testsArray.length === 0 
                    ? "No tests have been created yet. Create your first test to get started with assessments."
                    : "No tests match your current filters. Try adjusting your search criteria or create a new test."
                  }
                </p>
                <div className="flex items-center justify-center gap-3">
                  <Button 
                    onClick={() => setShowCreateTest(true)}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Create Test
                  </Button>
                  {testsArray.length > 0 && (
                    <Button 
                      variant="outline"
                      onClick={() => setFilters({ searchTerm: '', selectedClass: 'all', selectedSubject: 'all', selectedStatus: 'all' })}
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {filteredTests.length} of {testsArray.length} tests
                </p>
              </div>
              <div className="grid gap-4">
                {filteredTests.map((test) => (
                  <TestItem 
                    key={test._id || Math.random()}
                    test={test} 
                    onToggleStatus={toggleTestStatus}
                    onDelete={deleteTest}
                    onEdit={handleEditTest}
                    onViewQuestions={handleViewQuestions}
                    onAnalytics={handleAnalytics}
                  />
                ))}
              </div>
            </div>
          )}
        </CrashPreventionBoundary>
      </div>
    </CrashPreventionBoundary>
  );
}