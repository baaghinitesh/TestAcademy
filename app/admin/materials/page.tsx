'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Filter,
  Eye,
  MoreHorizontal,
  Upload,
  Download,
  FileText,
  Book,
  Clipboard
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

interface Material {
  _id: string;
  title: string;
  description?: string;
  subject: string;
  classNumber: number;
  chapter?: string;
  type: 'notes' | 'book' | 'sample-paper' | 'reference';
  fileUrl: string;
  fileName: string;
  fileSize?: number;
  isViewOnly: boolean;
  downloadCount: number;
  createdAt: string;
}

export default function MaterialsManagement() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');

  const classes = [5, 6, 7, 8, 9, 10];
  const subjects = ['Mathematics', 'Science', 'English', 'Social Studies', 'Hindi'];
  const types = [
    { value: 'notes', label: 'Notes' },
    { value: 'book', label: 'Book' },
    { value: 'sample-paper', label: 'Sample Paper' },
    { value: 'reference', label: 'Reference' }
  ];

  useEffect(() => {
    fetchMaterials();
  }, [selectedClass, selectedSubject, selectedType]);

  const fetchMaterials = async () => {
    try {
      let url = '/api/materials';
      const params = new URLSearchParams();
      
      if (selectedClass !== 'all') {
        params.append('classNumber', selectedClass);
      }
      if (selectedSubject !== 'all') {
        params.append('subject', selectedSubject);
      }
      if (selectedType !== 'all') {
        params.append('type', selectedType);
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setMaterials(data.materials || []);
      }
    } catch (error) {
      console.error('Error fetching materials:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteMaterial = async (id: string) => {
    if (!confirm('Are you sure you want to delete this material?')) return;
    
    try {
      const response = await fetch(`/api/materials/${id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setMaterials(materials.filter(material => material._id !== id));
      }
    } catch (error) {
      console.error('Error deleting material:', error);
    }
  };

  const toggleViewOnlyStatus = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/materials/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isViewOnly: !currentStatus }),
      });
      
      if (response.ok) {
        setMaterials(materials.map(material => 
          material._id === id ? { ...material, isViewOnly: !currentStatus } : material
        ));
      }
    } catch (error) {
      console.error('Error updating material status:', error);
    }
  };

  const filteredMaterials = materials.filter(material =>
    material.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    material.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (material.description && material.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'notes': return FileText;
      case 'book': return Book;
      case 'sample-paper': return Clipboard;
      default: return FileText;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'notes': return 'bg-blue-500';
      case 'book': return 'bg-green-500';
      case 'sample-paper': return 'bg-purple-500';
      case 'reference': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return 'Unknown size';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading materials...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Study Materials</h1>
          <p className="text-muted-foreground">
            Upload and manage study materials for students
          </p>
        </div>
        <Button className="flex items-center gap-2">
          <Upload className="h-4 w-4" />
          Upload Material
        </Button>
      </div>

      {/* Filters and Search */}
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
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="all">All Classes</option>
              {classes.map(cls => (
                <option key={cls} value={cls.toString()}>Class {cls}</option>
              ))}
            </select>
            
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="all">All Subjects</option>
              {subjects.map(subject => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
            
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="all">All Types</option>
              {types.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
            
            <Button variant="outline" onClick={fetchMaterials}>
              Apply Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-foreground">{materials.length}</div>
            <p className="text-xs text-muted-foreground">Total Materials</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {materials.filter(m => m.type === 'notes').length}
            </div>
            <p className="text-xs text-muted-foreground">Notes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {materials.filter(m => m.type === 'book').length}
            </div>
            <p className="text-xs text-muted-foreground">Books</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">
              {materials.reduce((sum, m) => sum + (m.downloadCount || 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground">Total Downloads</p>
          </CardContent>
        </Card>
      </div>

      {/* Materials List */}
      <div className="space-y-4">
        {filteredMaterials.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="text-muted-foreground">
                <Upload className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No materials found</h3>
                <p>Try adjusting your search criteria or upload new materials.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredMaterials.map((material) => {
            const TypeIcon = getTypeIcon(material.type);
            
            return (
              <Card key={material._id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`p-3 rounded-lg ${getTypeColor(material.type)} bg-opacity-10`}>
                        <TypeIcon className={`h-6 w-6 ${getTypeColor(material.type).replace('bg-', 'text-')}`} />
                      </div>
                      
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="secondary">Class {material.classNumber}</Badge>
                          <Badge variant="outline">{material.subject}</Badge>
                          <Badge className={getTypeColor(material.type)}>
                            {material.type.charAt(0).toUpperCase() + material.type.slice(1).replace('-', ' ')}
                          </Badge>
                          {material.isViewOnly && (
                            <Badge variant="destructive">View Only</Badge>
                          )}
                          {material.chapter && (
                            <Badge variant="secondary">{material.chapter}</Badge>
                          )}
                        </div>
                        
                        <div>
                          <h3 className="text-lg font-semibold text-foreground mb-1">
                            {material.title}
                          </h3>
                          {material.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {material.description}
                            </p>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                          <div>
                            <span className="font-medium">File:</span> {material.fileName}
                          </div>
                          <div>
                            <span className="font-medium">Size:</span> {formatFileSize(material.fileSize || 0)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Download className="h-4 w-4" />
                            <span>{material.downloadCount || 0} downloads</span>
                          </div>
                          <div>
                            <span className="font-medium">Uploaded:</span> {new Date(material.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant={material.isViewOnly ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleViewOnlyStatus(material._id, material.isViewOnly)}
                      >
                        {material.isViewOnly ? 'Enable Download' : 'View Only'}
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
                            Preview
                          </DropdownMenuItem>
                          <DropdownMenuItem className="flex items-center gap-2">
                            <Download className="h-4 w-4" />
                            Download
                          </DropdownMenuItem>
                          <DropdownMenuItem className="flex items-center gap-2">
                            <Edit className="h-4 w-4" />
                            Edit Material
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="flex items-center gap-2 text-red-600"
                            onClick={() => deleteMaterial(material._id)}
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}