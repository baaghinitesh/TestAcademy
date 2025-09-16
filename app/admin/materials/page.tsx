'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Upload, 
  Download, 
  Edit, 
  Trash2, 
  FileText, 
  Eye, 
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
  fileUrl: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  subject: {
    _id: string;
    name: string;
  } | string;
  classNumber: number;
  chapter?: string;
  topic?: string;
  materialType: 'pdf' | 'video' | 'document' | 'image' | 'other';
  tags: string[];
  isPublic: boolean;
  downloadCount: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface ApiState {
  materials: Material[];
  loading: boolean;
  error: string | null;
}

interface FilterState {
  search: string;
  subject: string;
  classNumber: string;
  materialType: string;
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
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {material.description}
                  </p>
                )}
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  <span>{material?.fileName || 'Unknown file'}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <FolderOpen className="h-4 w-4" />
                  <span>{formatFileSize(material?.fileSize || 0)}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Download className="h-4 w-4" />
                  <span>{material?.downloadCount || 0} downloads</span>
                </div>
              </div>
              
              <div className="text-xs text-muted-foreground">
                Created: {formatDate(material?.createdAt || '')}
              </div>
            </div>
            
            <ErrorBoundary fallback={<div className="text-sm text-muted-foreground">Actions unavailable</div>}>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (material?.fileUrl) {
                      window.open(material.fileUrl, '_blank');
                    }
                  }}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (material?.fileUrl) {
                      const link = document.createElement('a');
                      link.href = material.fileUrl;
                      link.download = material?.fileName || 'download';
                      link.click();
                    }
                  }}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onDelete(material?._id || '')}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
            </ErrorBoundary>
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
    error: null
  });

  const [filters, setFilters] = useState<FilterState>({
    search: '',
    subject: 'all',
    classNumber: 'all',
    materialType: 'all'
  });

  const classes = [5, 6, 7, 8, 9, 10];
  const subjects = ['Mathematics', 'Science', 'English', 'Social Studies', 'Hindi'];
  const materialTypes = ['pdf', 'video', 'document', 'image', 'other'];

  const fetchMaterials = useCallback(async () => {
    setApiState(prev => ({ ...prev, loading: true, error: null }));

    const result = await safeApiCall(
      async () => {
        let url = '/api/materials';
        const params = new URLSearchParams();
        
        if (filters.subject && filters.subject !== 'all') params.append('subject', filters.subject);
        if (filters.classNumber && filters.classNumber !== 'all') params.append('classNumber', filters.classNumber);
        if (filters.materialType && filters.materialType !== 'all') params.append('materialType', filters.materialType);
        if (filters.search) params.append('search', filters.search);
        
        if (params.toString()) {
          url += `?${params.toString()}`;
        }

        const response = await apiClient.get(url);
        return response.data?.materials || [];
      },
      [],
      (error) => {
        setApiState(prev => ({ 
          ...prev, 
          error: error?.message || 'Failed to fetch materials. Please check your connection and try again.' 
        }));
      }
    );

    setApiState(prev => ({
      ...prev,
      materials: result,
      loading: false
    }));
  }, [filters.subject, filters.classNumber, filters.materialType, filters.search]);

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
          materials: prev.materials.filter(material => material._id !== id)
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
    const searchLower = filters.search.toLowerCase();
    return (
      (material.title?.toLowerCase().includes(searchLower) || false) ||
      (material.description?.toLowerCase().includes(searchLower) || false) ||
      (material.fileName?.toLowerCase().includes(searchLower) || false)
    );
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Study Materials</h1>
              <p className="text-muted-foreground">
                Manage and organize study materials for your students
              </p>
            </div>
            <Button className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Upload Material
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
                    placeholder="Search materials..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="pl-10"
                  />
                </div>
                
                <select
                  value={filters.classNumber}
                  onChange={(e) => setFilters(prev => ({ ...prev, classNumber: e.target.value }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="all">All Classes</option>
                  {classes.map(cls => (
                    <option key={cls} value={cls.toString()}>Class {cls}</option>
                  ))}
                </select>
                
                <select
                  value={filters.subject}
                  onChange={(e) => setFilters(prev => ({ ...prev, subject: e.target.value }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="all">All Subjects</option>
                  {subjects.map(subject => (
                    <option key={subject} value={subject}>{subject}</option>
                  ))}
                </select>
                
                <select
                  value={filters.materialType}
                  onChange={(e) => setFilters(prev => ({ ...prev, materialType: e.target.value }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="all">All Types</option>
                  {materialTypes.map(type => (
                    <option key={type} value={type} className="capitalize">{type}</option>
                  ))}
                </select>
                
                <Button variant="outline" onClick={fetchMaterials}>
                  Apply Filters
                </Button>
              </div>
            </CardContent>
          </Card>
        </ErrorBoundary>

        {/* Stats */}
        <MaterialStats materials={apiState.materials} />

        {/* Materials List */}
        <ErrorBoundary fallback={<Card><CardContent className="p-8 text-center">Material list unavailable</CardContent></Card>}>
          <div className="space-y-4">
            {filteredMaterials.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="text-muted-foreground">
                    <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">No materials found</h3>
                    <p>Try adjusting your search criteria or upload a new material.</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              filteredMaterials.map((material) => (
                <MaterialItem
                  key={material?._id || Math.random()}
                  material={material}
                  onDelete={deleteMaterial}
                />
              ))
            )}
          </div>
        </ErrorBoundary>
      </div>
    </ErrorBoundary>
  );
}