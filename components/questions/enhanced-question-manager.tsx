'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Filter, Upload, Download, Edit, Trash2, Eye, Copy, RefreshCw, BarChart3, FileText } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import { Progress } from '../ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

interface EnhancedQuestion {
  _id: string;
  question: string;
  questionType: 'single-choice' | 'multiple-choice' | 'true-false' | 'numerical' | 'fill-in-blank';
  subject: string;
  classNumber: number;
  chapter: string;
  topic: string;
  subtopic?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  marks: number;
  options: {
    text: string;
    isCorrect: boolean;
    imageUrl?: string;
  }[];
  explanation?: string;
  questionImageUrl?: string;
  explanationImageUrl?: string;
  tags: string[];
  bloomsTaxonomy?: 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create';
  estimatedTime?: number;
  prerequisites?: string[];
  learningOutcomes?: string[];
  isActive: boolean;
  isVerified: boolean;
  verificationStatus: 'pending' | 'approved' | 'rejected';
  verificationNotes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  usageCount?: number;
  correctAnswerRate?: number;
  avgTimeSpent?: number;
}

interface HierarchyStats {
  totalQuestions: number;
  byClass: Record<number, number>;
  bySubject: Record<string, number>;
  byDifficulty: Record<string, number>;
  byStatus: Record<string, number>;
  hierarchicalBreakdown: {
    [className: string]: {
      [subject: string]: {
        [chapter: string]: {
          [topic: string]: number;
        }
      }
    }
  };
}

interface BulkUploadSession {
  sessionId: string;
  status: 'processing' | 'completed' | 'failed';
  progress: number;
  totalRows: number;
  processedRows: number;
  successCount: number;
  errorCount: number;
  errors: Array<{
    row: number;
    field: string;
    message: string;
  }>;
  autoTestsCreated?: Array<{
    className: number;
    subject: string;
    chapter: string;
    testId: string;
    testTitle: string;
    questionsCount: number;
  }>;
}

export function EnhancedQuestionManager() {
  const [questions, setQuestions] = useState<EnhancedQuestion[]>([]);
  const [hierarchyStats, setHierarchyStats] = useState<HierarchyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Advanced filters
  const [filters, setFilters] = useState({
    search: '',
    classNumber: '',
    subject: '',
    chapter: '',
    topic: '',
    difficulty: '',
    questionType: '',
    bloomsTaxonomy: '',
    verificationStatus: '',
    isActive: '',
    tags: '',
    dateRange: { start: '', end: '' }
  });

  // Pagination and sorting
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Selection and bulk operations
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [bulkOperation, setBulkOperation] = useState<'activate' | 'deactivate' | 'verify' | 'delete' | null>(null);

  // CSV Upload
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [uploadSession, setUploadSession] = useState<BulkUploadSession | null>(null);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);

  // Dialogs
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<EnhancedQuestion | null>(null);

  // Form data for creating/editing questions
  const [formData, setFormData] = useState({
    question: '',
    questionType: 'single-choice' as EnhancedQuestion['questionType'],
    subject: '',
    classNumber: '',
    chapter: '',
    topic: '',
    subtopic: '',
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
    marks: 1,
    options: [
      { text: '', isCorrect: false, imageUrl: '' },
      { text: '', isCorrect: false, imageUrl: '' }
    ],
    explanation: '',
    questionImageUrl: '',
    explanationImageUrl: '',
    tags: [] as string[],
    bloomsTaxonomy: 'understand' as EnhancedQuestion['bloomsTaxonomy'],
    estimatedTime: 60,
    prerequisites: [] as string[],
    learningOutcomes: [] as string[]
  });

  // Fetch questions with enhanced filtering
  const fetchQuestions = async () => {
    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sortBy,
        sortOrder,
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => 
            value && (typeof value === 'string' ? value.trim() : true)
          )
        )
      });

      const response = await fetch(`/api/questions/enhanced-v2?${queryParams}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch questions: ${response.status}`);
      }

      const data = await response.json();
      
      setQuestions(data.questions || []);
      setTotalQuestions(data.total || 0);
      setTotalPages(Math.ceil((data.total || 0) / limit));
      setHierarchyStats(data.hierarchyStats || null);
    } catch (error) {
      console.error('Error fetching questions:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch questions');
    } finally {
      setLoading(false);
    }
  };

  // Handle CSV upload
  const handleCsvUpload = async () => {
    if (!csvFile) return;

    try {
      setLoading(true);
      setError(null);
      
      // Parse CSV file
      const csvText = await csvFile.text();
      const csvData = parseCSVData(csvText);
      
      if (csvData.length === 0) {
        throw new Error('CSV file is empty or contains no valid data');
      }

      const response = await fetch('/api/questions/bulk-upload-v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          csvData,
          autoCreateTest: true,
          testTitle: `Bulk Upload Test - ${new Date().toLocaleDateString()}`,
          testDescription: 'Automatically created from bulk question upload',
          testDuration: Math.max(60, csvData.length * 2), // 2 minutes per question minimum
          validateOnly: false
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Upload failed: ${response.status}`);
      }

      const session = await response.json();
      setUploadSession(session);

      // Poll for progress
      pollUploadProgress(session.sessionId);
    } catch (error) {
      console.error('Upload error:', error);
      setError(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setLoading(false);
    }
  };
  
  // Parse CSV data from text
  const parseCSVData = (csvText: string) => {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const expectedHeaders = [
      'questionText', 'questionType', 'options', 'correctAnswers', 
      'classNumber', 'subject', 'chapter', 'topic', 'subtopic', 
      'difficulty', 'marks', 'explanation', 'hint', 'tags', 
      'source', 'language', 'questionImageUrl', 'explanationImageUrl', 
      'hintImageUrl', 'estimatedTime', 'testTypes'
    ];
    
    // Validate headers
    const requiredHeaders = ['questionText', 'questionType', 'options', 'correctAnswers', 'classNumber', 'subject', 'chapter', 'topic'];
    const missingRequired = requiredHeaders.filter(h => !headers.includes(h));
    
    if (missingRequired.length > 0) {
      throw new Error(`Missing required columns: ${missingRequired.join(', ')}`);
    }
    
    const csvData = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Parse CSV line with proper quote handling
      const values = parseCSVLine(line);
      
      if (values.length < headers.length) {
        console.warn(`Row ${i + 1} has fewer values than headers, skipping`);
        continue;
      }
      
      const row: any = {};
      headers.forEach((header, index) => {
        const value = values[index]?.trim() || '';
        
        // Type conversions
        if (header === 'classNumber') {
          row[header] = parseInt(value) || 0;
        } else if (header === 'marks') {
          row[header] = parseFloat(value) || 1;
        } else if (header === 'estimatedTime') {
          row[header] = parseInt(value) || 60;
        } else {
          row[header] = value;
        }
      });
      
      // Skip empty rows
      if (!row.questionText || !row.questionType) {
        continue;
      }
      
      csvData.push(row);
    }
    
    return csvData;
  };
  
  // Parse a single CSV line with quote handling
  const parseCSVLine = (line: string): string[] => {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++; // Skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current);
    return result;
  };

  // Poll upload progress
  const pollUploadProgress = async (sessionId: string) => {
    const poll = async () => {
      try {
        const response = await fetch(`/api/questions/bulk-upload-v2?sessionId=${sessionId}`);
        if (response.ok) {
          const session = await response.json();
          setUploadSession(session);
          
          if (session.status === 'processing') {
            setTimeout(poll, 2000); // Poll every 2 seconds
          } else {
            // Upload completed, refresh questions
            fetchQuestions();
          }
        }
      } catch (error) {
        console.error('Progress polling error:', error);
      }
    };
    
    poll();
  };

  // Handle bulk operations
  const handleBulkOperation = async (operation: string, questionIds: string[]) => {
    try {
      const response = await fetch('/api/questions/enhanced-v2', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation,
          questionIds
        })
      });

      if (response.ok) {
        setSelectedQuestions([]);
        fetchQuestions();
      } else {
        throw new Error(`Bulk operation failed: ${response.status}`);
      }
    } catch (error) {
      console.error('Bulk operation error:', error);
      setError(error instanceof Error ? error.message : 'Bulk operation failed');
    }
  };

  // Export questions
  const handleExport = async (format: 'csv' | 'json' | 'pdf') => {
    try {
      const queryParams = new URLSearchParams({
        format,
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => 
            value && (typeof value === 'string' ? value.trim() : true)
          )
        )
      });

      const response = await fetch(`/api/questions/enhanced-v2/export?${queryParams}`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `questions_export.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Export error:', error);
      setError(error instanceof Error ? error.message : 'Export failed');
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [page, limit, sortBy, sortOrder, filters]);

  // Render hierarchy statistics
  const renderHierarchyStats = () => {
    if (!hierarchyStats) return null;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{hierarchyStats.totalQuestions}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {hierarchyStats.byStatus.active || 0}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Verification</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {hierarchyStats.byStatus.pending || 0}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Classes Covered</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.keys(hierarchyStats.byClass).length}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Render advanced filters
  const renderAdvancedFilters = () => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg">Advanced Filters</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <Label htmlFor="search">Search</Label>
            <Input
              id="search"
              placeholder="Search questions..."
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
            />
          </div>
          
          <div>
            <Label htmlFor="classNumber">Class</Label>
            <Select value={filters.classNumber} onValueChange={(value) => setFilters({...filters, classNumber: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Select class" />
              </SelectTrigger>
              <SelectContent>
                {[6, 7, 8, 9, 10, 11, 12].map(cls => (
                  <SelectItem key={cls} value={cls.toString()}>Class {cls}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="subject">Subject</Label>
            <Select value={filters.subject} onValueChange={(value) => setFilters({...filters, subject: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Select subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Mathematics">Mathematics</SelectItem>
                <SelectItem value="Physics">Physics</SelectItem>
                <SelectItem value="Chemistry">Chemistry</SelectItem>
                <SelectItem value="Biology">Biology</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="difficulty">Difficulty</Label>
            <Select value={filters.difficulty} onValueChange={(value) => setFilters({...filters, difficulty: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Select difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="verificationStatus">Status</Label>
            <Select value={filters.verificationStatus} onValueChange={(value) => setFilters({...filters, verificationStatus: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="bloomsTaxonomy">Bloom's Level</Label>
            <Select value={filters.bloomsTaxonomy} onValueChange={(value) => setFilters({...filters, bloomsTaxonomy: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Select level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="remember">Remember</SelectItem>
                <SelectItem value="understand">Understand</SelectItem>
                <SelectItem value="apply">Apply</SelectItem>
                <SelectItem value="analyze">Analyze</SelectItem>
                <SelectItem value="evaluate">Evaluate</SelectItem>
                <SelectItem value="create">Create</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-end">
            <Button 
              variant="outline" 
              onClick={() => setFilters({
                search: '', classNumber: '', subject: '', chapter: '', topic: '',
                difficulty: '', questionType: '', bloomsTaxonomy: '', verificationStatus: '',
                isActive: '', tags: '', dateRange: { start: '', end: '' }
              })}
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Render bulk upload dialog
  const renderBulkUploadDialog = () => (
    <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Enhanced CSV Bulk Upload</DialogTitle>
          <DialogDescription>
            Upload questions with automatic hierarchy validation and test creation
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="csvFile">CSV File</Label>
            <Input
              id="csvFile"
              type="file"
              accept=".csv"
              onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
            />
            <p className="text-sm text-muted-foreground mt-1">
              Use our enhanced CSV template for best results. Auto-tests will be created for each chapter.
            </p>
          </div>
          
          {uploadSession && (
            <div className="space-y-3">
              <div>
                <Label>Upload Progress</Label>
                <Progress value={uploadSession.progress} className="mt-1" />
                <p className="text-sm text-muted-foreground mt-1">
                  {uploadSession.processedRows}/{uploadSession.totalRows} rows processed
                </p>
              </div>
              
              {uploadSession.status === 'completed' && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600">Success: {uploadSession.successCount}</span>
                    <span className="text-red-600">Errors: {uploadSession.errorCount}</span>
                  </div>
                  
                  {uploadSession.autoTestsCreated && uploadSession.autoTestsCreated.length > 0 && (
                    <div>
                      <Label className="text-sm font-semibold">Auto-Created Tests:</Label>
                      <div className="max-h-32 overflow-y-auto space-y-1 mt-1">
                        {uploadSession.autoTestsCreated.map((test, index) => (
                          <div key={index} className="text-sm bg-green-50 p-2 rounded">
                            <strong>Class {test.className} - {test.subject}</strong><br />
                            {test.testTitle} ({test.questionsCount} questions)
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {uploadSession.errors.length > 0 && (
                    <div>
                      <Label className="text-sm font-semibold text-red-600">Errors:</Label>
                      <div className="max-h-32 overflow-y-auto space-y-1 mt-1">
                        {uploadSession.errors.slice(0, 5).map((error, index) => (
                          <div key={index} className="text-sm bg-red-50 p-2 rounded">
                            Row {error.row}: {error.field} - {error.message}
                          </div>
                        ))}
                        {uploadSession.errors.length > 5 && (
                          <p className="text-sm text-muted-foreground">
                            ...and {uploadSession.errors.length - 5} more errors
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>
            Close
          </Button>
          <Button 
            onClick={handleCsvUpload} 
            disabled={!csvFile || (uploadSession?.status === 'processing')}
          >
            {uploadSession?.status === 'processing' ? 'Uploading...' : 'Upload Questions'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          <span>Loading enhanced question manager...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 border rounded-lg bg-destructive/10 text-destructive">
        <h3 className="font-semibold">Error Loading Questions</h3>
        <p>{error}</p>
        <Button onClick={fetchQuestions} variant="outline" className="mt-2">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Enhanced Question Manager</h1>
          <p className="text-muted-foreground">
            Manage questions with hierarchical structure and advanced features
          </p>
        </div>
        
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => handleExport('csv')}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={() => setIsUploadDialogOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Bulk Upload
          </Button>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Question
          </Button>
        </div>
      </div>

      {/* Statistics */}
      {renderHierarchyStats()}

      {/* Advanced Filters */}
      {renderAdvancedFilters()}

      {/* Bulk Operations */}
      {selectedQuestions.length > 0 && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">
                {selectedQuestions.length} questions selected
              </span>
              <div className="flex space-x-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleBulkOperation('activate', selectedQuestions)}
                >
                  Activate
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleBulkOperation('verify', selectedQuestions)}
                >
                  Verify
                </Button>
                <Button 
                  size="sm" 
                  variant="destructive"
                  onClick={() => handleBulkOperation('delete', selectedQuestions)}
                >
                  Delete
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Questions Table */}
      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedQuestions.length === questions.length && questions.length > 0}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedQuestions(questions.map(q => q._id));
                      } else {
                        setSelectedQuestions([]);
                      }
                    }}
                  />
                </TableHead>
                <TableHead>Question</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Chapter</TableHead>
                <TableHead>Topic</TableHead>
                <TableHead>Difficulty</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {questions.map((question) => (
                <TableRow key={question._id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedQuestions.includes(question._id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedQuestions([...selectedQuestions, question._id]);
                        } else {
                          setSelectedQuestions(selectedQuestions.filter(id => id !== question._id));
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <div className="truncate" title={question.question}>
                      {question.question}
                    </div>
                    <div className="flex space-x-1 mt-1">
                      {question.tags.slice(0, 2).map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>{question.classNumber}</TableCell>
                  <TableCell>{question.subject}</TableCell>
                  <TableCell>{question.chapter}</TableCell>
                  <TableCell>{question.topic}</TableCell>
                  <TableCell>
                    <Badge variant={
                      question.difficulty === 'easy' ? 'secondary' :
                      question.difficulty === 'medium' ? 'default' : 'destructive'
                    }>
                      {question.difficulty}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <Badge variant={question.isActive ? 'default' : 'secondary'}>
                        {question.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      <Badge variant={
                        question.verificationStatus === 'approved' ? 'default' :
                        question.verificationStatus === 'pending' ? 'secondary' : 'destructive'
                      }>
                        {question.verificationStatus}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>Uses: {question.usageCount || 0}</div>
                      {question.correctAnswerRate && (
                        <div>Accuracy: {Math.round(question.correctAnswerRate * 100)}%</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedQuestion(question);
                          setIsEditDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedQuestion(question);
                          // Open preview dialog
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {/* Pagination */}
          <div className="flex justify-between items-center mt-4">
            <div className="text-sm text-muted-foreground">
              Showing {Math.min((page - 1) * limit + 1, totalQuestions)} to{' '}
              {Math.min(page * limit, totalQuestions)} of {totalQuestions} questions
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Upload Dialog */}
      {renderBulkUploadDialog()}
    </div>
  );
}