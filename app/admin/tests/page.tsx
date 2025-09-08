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
  Play,
  Pause,
  Users,
  Clock,
  Target
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

export default function TestsManagement() {
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const classes = [5, 6, 7, 8, 9, 10];
  const subjects = ['Mathematics', 'Science', 'English', 'Social Studies', 'Hindi'];

  useEffect(() => {
    fetchTests();
  }, [selectedClass, selectedSubject, selectedStatus]);

  const fetchTests = async () => {
    try {
      let url = '/api/tests';
      const params = new URLSearchParams();
      
      if (selectedClass !== 'all') {
        params.append('classNumber', selectedClass);
      }
      if (selectedSubject !== 'all') {
        params.append('subject', selectedSubject);
      }
      if (selectedStatus !== 'all') {
        params.append('isActive', selectedStatus);
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setTests(data.tests || []);
      }
    } catch (error) {
      console.error('Error fetching tests:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleTestStatus = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/tests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      
      if (response.ok) {
        setTests(tests.map(test => 
          test._id === id ? { ...test, isActive: !currentStatus } : test
        ));
      }
    } catch (error) {
      console.error('Error updating test status:', error);
    }
  };

  const deleteTest = async (id: string) => {
    if (!confirm('Are you sure you want to delete this test?')) return;
    
    try {
      const response = await fetch(`/api/tests/${id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setTests(tests.filter(test => test._id !== id));
      }
    } catch (error) {
      console.error('Error deleting test:', error);
    }
  };

  const filteredTests = tests.filter(test =>
    test.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    test.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (test.description && test.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'bg-green-500' : 'bg-gray-400';
  };

  const getStatusText = (isActive: boolean) => {
    return isActive ? 'Published' : 'Draft';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading tests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
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
                placeholder="Search tests..."
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
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
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

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-foreground">{tests.length}</div>
            <p className="text-xs text-muted-foreground">Total Tests</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {tests.filter(test => test.isActive).length}
            </div>
            <p className="text-xs text-muted-foreground">Published</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-gray-600">
              {tests.filter(test => !test.isActive).length}
            </div>
            <p className="text-xs text-muted-foreground">Drafts</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {tests.reduce((sum, test) => sum + (test.attempts || 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground">Total Attempts</p>
          </CardContent>
        </Card>
      </div>

      {/* Tests List */}
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
            <Card key={test._id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary">Class {test.classNumber}</Badge>
                      <Badge variant="outline">{test.subject}</Badge>
                      <div className="flex items-center gap-1">
                        <div className={`h-2 w-2 rounded-full ${getStatusColor(test.isActive)}`}></div>
                        <span className="text-xs text-muted-foreground">
                          {getStatusText(test.isActive)}
                        </span>
                      </div>
                      {test.chapter && (
                        <Badge variant="secondary">{test.chapter}</Badge>
                      )}
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-1">
                        {test.title}
                      </h3>
                      {test.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {test.description}
                        </p>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{test.duration} mins</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Target className="h-4 w-4" />
                        <span>{test.totalMarks} marks</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Eye className="h-4 w-4" />
                        <span>{test.questions.length} questions</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>{test.attempts || 0} attempts</span>
                      </div>
                    </div>
                    
                    <div className="text-xs text-muted-foreground">
                      Created: {new Date(test.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant={test.isActive ? "destructive" : "default"}
                      size="sm"
                      onClick={() => toggleTestStatus(test._id, test.isActive)}
                    >
                      {test.isActive ? (
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
                          onClick={() => deleteTest(test._id)}
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
          ))
        )}
      </div>
    </div>
  );
}