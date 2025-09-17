'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  FileText, 
  Upload, 
  Filter, 
  Plus, 
  Download, 
  Trash2, 
  Eye, 
  Search,
  FolderOpen,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ErrorBoundary } from '@/components/error-boundary';
import { apiClient } from '@/lib/api-client';

interface Material {
  _id: string;
  title: string;
  description?: string;
  subject: any;
  classNumber: number;
  chapter?: string;
  materialType: 'pdf' | 'video' | 'document' | 'other';
  filePath: string;
  fileName: string;
  fileSize: number;
  isPublic: boolean;
  downloadCount: number;
  uploadedBy: string;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
}

interface ApiState {
  materials: Material[];
  loading: boolean;
  error: string | null;
  totalCount: number;
}

interface Filters {
  search: string;
  class: string;
  subject: string;
  type: string;
  isPublic: string;
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
        <p className="mt-2 text-muted-foreground">Loading materials...</p>
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
        <h3 className="text-lg font-semibold text-red-600 mb-2">Error Loading Materials</h3>
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
const MaterialStats = ({ materials }: { materials: Material[] }) => (
  <ErrorBoundary fallback={<div className="grid gap-4 md:grid-cols-4"><div className="text-center p-4">Stats unavailable</div></div>}>
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardContent className="p-4">
          <div className="text-2xl font-bold text-foreground">{materials?.length || 0}</div>
          <p className="text-xs text-muted-foreground">Total Materials</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="text-2xl font-bold text-green-600">
            {materials?.filter(material => material?.isPublic)?.length || 0}
          </div>
          <p className="text-xs text-muted-foreground">Public</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="text-2xl font-bold text-blue-600">
            {materials?.filter(material => material?.materialType === 'pdf')?.length || 0}
          </div>
          <p className="text-xs text-muted-foreground">PDFs</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="text-2xl font-bold text-purple-600">
            {materials?.reduce((sum, material) => sum + (material?.downloadCount || 0), 0) || 0}
          </div>
          <p className="text-xs text-muted-foreground">Downloads</p>
        </CardContent>
      </Card>
    </div>
  </ErrorBoundary>
);

// Safe material item component
const MaterialItem = ({ 
  material, 
  onDelete 
}: { 
  material: Material; 
  onDelete: (id: string) => void; 
}) => {
  const formatFileSize = (bytes: number) => {
    try {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    } catch {
      return 'Unknown size';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'Invalid Date';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'pdf': return <FileText className="h-4 w-4" />;
      case 'video': return <Eye className="h-4 w-4" />;
      default: return <FolderOpen className="h-4 w-4" />;
    }
  };

  const getSubjectName = (subject: any) => {
    if (typeof subject === 'string') return subject;
    return subject?.name || 'Unknown Subject';
  };

  return (
    <ErrorBoundary fallback={<Card><CardContent className="p-4">Material item unavailable</CardContent></Card>}>
      <Card key={material?._id} className="hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary">Class {material?.classNumber || 'N/A'}</Badge>
                <Badge variant="outline">{getSubjectName(material?.subject)}</Badge>
                <div className="flex items-center gap-1">
                  {getTypeIcon(material?.materialType || 'other')}
                  <span className="text-xs text-muted-foreground capitalize">
                    {material?.materialType || 'Unknown'}
                  </span>
                </div>
                {material?.chapter && (
                  <Badge variant="secondary">{material.chapter}</Badge>
                )}
                {material?.isPublic && (
                  <Badge variant="default" className="bg-green-100 text-green-800">Public</Badge>
                )}
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-1">
                  {material?.title || 'Untitled Material'}
                </h3>
                {material?.description && (
                  <p className="text-muted-foreground text-sm line-clamp-2">
                    {material.description}
                  </p>
                )}
              </div>
              
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>Size: {formatFileSize(material?.fileSize || 0)}</span>
                <span>Downloads: {material?.downloadCount || 0}</span>
                <span>Created: {formatDate(material?.createdAt || '')}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2 ml-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => window.open(`/api/materials/${material?._id}/download`, '_blank')}
                className="h-8 w-8 p-0"
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => window.open(`/study/materials/${material?._id}`, '_blank')}
                className="h-8 w-8 p-0"
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => onDelete(material?._id)}
                className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </ErrorBoundary>
  );
};

export default function MaterialsManagement() {
  const [apiState, setApiState] = useState<ApiState>({
    materials: [],
    loading: true,
    error: null,
    totalCount: 0
  });

  const [filters, setFilters] = useState<Filters>({
    search: '',
    class: 'all',
    subject: 'all',
    type: 'all',
    isPublic: 'all'
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12
  });

  const fetchMaterials = useCallback(async () => {
    setApiState(prev => ({ ...prev, loading: true, error: null }));

    const result = await safeApiCall(
      async () => {
        const params = new URLSearchParams({
          page: pagination.page.toString(),
          limit: pagination.limit.toString(),
          search: filters.search,
          class: filters.class,
          subject: filters.subject,
          type: filters.type,
          isPublic: filters.isPublic
        });

        const response = await apiClient.get(`/api/materials?${params.toString()}`);
        return response.data || { materials: [], totalCount: 0 };
      },
      { materials: [], totalCount: 0 },
      (error) => {
        setApiState(prev => ({ 
          ...prev, 
          error: error?.message || 'Failed to fetch materials. Please check your connection and try again.' 
        }));
      }
    );

    setApiState(prev => ({
      ...prev,
      materials: result.materials || [],
      totalCount: result.totalCount || 0,
      loading: false
    }));
  }, [pagination.page, pagination.limit, filters.search, filters.class, filters.subject, filters.type, filters.isPublic]);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  const deleteMaterial = async (id: string) => {
    if (!id || !confirm('Are you sure you want to delete this material?')) return;

    await safeApiCall(
      async () => {
        await apiClient.delete(`/api/materials/${id}`);
        setApiState(prev => ({
          ...prev,
          materials: prev.materials.filter(material => material._id !== id),
          totalCount: prev.totalCount - 1
        }));
      },
      null,
      () => {
        console.error('Failed to delete material');
      }
    );
  };

  const filteredMaterials = apiState.materials.filter(material => {
    if (!material) return false;
    
    const matchesSearch = !filters.search || 
      material.title?.toLowerCase().includes(filters.search.toLowerCase()) ||
      material.description?.toLowerCase().includes(filters.search.toLowerCase());
    
    return matchesSearch;
  });

  if (apiState.loading) {
    return <LoadingSpinner />;
  }

  if (apiState.error) {
    return <ErrorDisplay error={apiState.error} onRetry={fetchMaterials} />;
  }

  return (
    <ErrorBoundary fallback={<div className="text-center p-8">Materials management is temporarily unavailable</div>}>
      <div className="space-y-6">
        {/* Header */}
        <ErrorBoundary fallback={<div className="p-4">Header unavailable</div>}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Learning Materials</h1>
              <p className="text-muted-foreground">
                Manage study materials, PDFs, and educational content
              </p>
            </div>
            
            <Button className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Upload Material
            </Button>
          </div>
        </ErrorBoundary>

        {/* Stats */}
        <MaterialStats materials={apiState.materials} />

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
              <div className="grid gap-4 md:grid-cols-6">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search materials..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="pl-10"
                  />
                </div>
                
                <select
                  value={filters.class}
                  onChange={(e) => setFilters(prev => ({ ...prev, class: e.target.value }))}
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
                  value={filters.subject}
                  onChange={(e) => setFilters(prev => ({ ...prev, subject: e.target.value }))}
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
                  value={filters.type}
                  onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="all">All Types</option>
                  <option value="pdf">PDF</option>
                  <option value="video">Video</option>
                  <option value="document">Document</option>
                  <option value="other">Other</option>
                </select>
                
                <select
                  value={filters.isPublic}
                  onChange={(e) => setFilters(prev => ({ ...prev, isPublic: e.target.value }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="all">All Visibility</option>
                  <option value="true">Public</option>
                  <option value="false">Private</option>
                </select>
                
                <Button 
                  onClick={fetchMaterials}
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

        {/* Materials List */}
        <ErrorBoundary fallback={<div className="text-center p-8">Materials list unavailable</div>}>
          {filteredMaterials.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No materials found</h3>
                <p className="text-muted-foreground mb-6">
                  {apiState.materials.length === 0 
                    ? "No materials have been uploaded yet. Upload your first material to get started."
                    : "No materials match your current filters. Try adjusting your search criteria."
                  }
                </p>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Upload First Material
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredMaterials.map((material) => (
                <MaterialItem 
                  key={material._id}
                  material={material} 
                  onDelete={deleteMaterial}
                />
              ))}
            </div>
          )}
        </ErrorBoundary>

        {/* Pagination */}
        {apiState.totalCount > pagination.limit && (
          <ErrorBoundary fallback={<div className="p-4 text-center">Pagination unavailable</div>}>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                    {Math.min(pagination.page * pagination.limit, apiState.totalCount)} of{' '}
                    {apiState.totalCount} materials
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                      disabled={pagination.page === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                      disabled={pagination.page * pagination.limit >= apiState.totalCount}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </ErrorBoundary>
        )}
      </div>
    </ErrorBoundary>
  );
}