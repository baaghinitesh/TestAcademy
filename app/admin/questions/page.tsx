'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Filter, Upload, Download, Edit, Trash2, Image as ImageIcon, Eye, Copy } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Textarea } from '../../../components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { ErrorBoundary } from '../../../components/error-boundary';
import { apiClient, useSafeApiCall } from '../../../lib/api-client';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Checkbox } from '../../../components/ui/checkbox';
import { Badge } from '../../../components/ui/badge';

interface Question {
  _id: string;
  question: string;
  questionType: 'single-choice' | 'multiple-choice';
  subject: {
    _id: string;
    name: string;
  };
  classNumber: number;
  chapter?: string;
  topic?: string;
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
  order: number;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  test?: {
    _id: string;
    title: string;
  };
}

interface Subject {
  _id: string;
  name: string;
  code: string;
  classes: Array<{
    classNumber: number;
    chapters: Array<{
      name: string;
      topics: string[];
    }>;
  }>;
}

// Error fallback component for specific sections
function SectionErrorFallback({ error, retry }: { error?: Error; retry: () => void }) {
  return (
    <div className="min-h-[200px] flex items-center justify-center p-4 border rounded-lg bg-muted/50">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Unable to load section</h3>
        <p className="text-muted-foreground mb-4">
          {error?.message || 'An unexpected error occurred'}
        </p>
        <Button onClick={retry} variant="outline">
          Try Again
        </Button>
      </div>
    </div>
  );
}

// Loading component
function LoadingSpinner({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="flex items-center space-x-2">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        <span className="text-muted-foreground">{message}</span>
      </div>
    </div>
  );
}

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Filters
  const [filters, setFilters] = useState({
    subject: '',
    classNumber: '',
    chapter: '',
    topic: '',
    difficulty: '',
    questionType: '',
    search: ''
  });

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(0);

  // Form data
  const [formData, setFormData] = useState({
    question: '',
    questionType: 'single-choice' as 'single-choice' | 'multiple-choice',
    subject: '',
    classNumber: '',
    chapter: '',
    topic: '',
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
    marks: 1,
    options: [
      { text: '', isCorrect: false, imageUrl: '' },
      { text: '', isCorrect: false, imageUrl: '' }
    ],
    explanation: '',
    questionImageUrl: '',
    explanationImageUrl: '',
    tags: [] as string[]
  });

  // CSV Upload
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResults, setUploadResults] = useState<any>(null);

  const { safeCall } = useSafeApiCall();

  // Safe fetch functions with error handling
  const fetchQuestions = async () => {
    setError(null);
    
    const result = await safeCall(
      async () => {
        const queryParams = {
          page: page.toString(),
          limit: '20',
          ...Object.fromEntries(Object.entries(filters).filter(([_, value]) => value))
        };
        
        return await apiClient.get('/api/questions', queryParams);
      },
      (data) => {
        setQuestions(data.questions || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalQuestions(data.pagination?.totalCount || 0);
      },
      (error) => {
        setError(error);
        setQuestions([]);
      }
    );

    setLoading(false);
  };

  const fetchSubjects = async () => {
    await safeCall(
      async () => await apiClient.get('/api/subjects'),
      (data) => {
        setSubjects(data.subjects || data || []);
      },
      (error) => {
        console.error('Failed to fetch subjects:', error);
        setSubjects([]);
      }
    );
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchQuestions(), fetchSubjects()]);
    };
    
    loadData();
  }, [page, filters]);

  // Safe form handlers
  const addOption = () => {
    try {
      setFormData(prev => ({
        ...prev,
        options: [...prev.options, { text: '', isCorrect: false, imageUrl: '' }]
      }));
    } catch (error) {
      console.error('Error adding option:', error);
    }
  };

  const removeOption = (index: number) => {
    try {
      if (formData.options.length > 2) {
        setFormData(prev => ({
          ...prev,
          options: prev.options.filter((_, i) => i !== index)
        }));
      }
    } catch (error) {
      console.error('Error removing option:', error);
    }
  };

  const updateOption = (index: number, field: string, value: any) => {
    try {
      setFormData(prev => ({
        ...prev,
        options: prev.options.map((option, i) => 
          i === index ? { ...option, [field]: value } : option
        )
      }));
    } catch (error) {
      console.error('Error updating option:', error);
    }
  };

  const handleCorrectAnswerChange = (index: number, isCorrect: boolean) => {
    try {
      if (formData.questionType === 'single-choice') {
        // For single choice, only one can be correct
        setFormData(prev => ({
          ...prev,
          options: prev.options.map((option, i) => ({
            ...option,
            isCorrect: i === index ? isCorrect : false
          }))
        }));
      } else {
        // For multiple choice, multiple can be correct
        updateOption(index, 'isCorrect', isCorrect);
      }
    } catch (error) {
      console.error('Error updating correct answer:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = selectedQuestion ? `/api/questions/${selectedQuestion._id}` : '/api/questions';
      const method = selectedQuestion ? 'put' : 'post';
      
      const result = await safeCall(
        async () => {
          return method === 'put' 
            ? await apiClient.put(url, formData)
            : await apiClient.post(url, formData);
        },
        async () => {
          await fetchQuestions();
          setIsCreateDialogOpen(false);
          setIsEditDialogOpen(false);
          setSelectedQuestion(null);
          resetForm();
        },
        (error) => {
          setError(`Failed to save question: ${error}`);
        }
      );

    } catch (error) {
      console.error('Unexpected error in form submission:', error);
      setError('An unexpected error occurred while saving the question');
    }
  };

  const resetForm = () => {
    try {
      setFormData({
        question: '',
        questionType: 'single-choice',
        subject: '',
        classNumber: '',
        chapter: '',
        topic: '',
        difficulty: 'medium',
        marks: 1,
        options: [
          { text: '', isCorrect: false, imageUrl: '' },
          { text: '', isCorrect: false, imageUrl: '' }
        ],
        explanation: '',
        questionImageUrl: '',
        explanationImageUrl: '',
        tags: []
      });
    } catch (error) {
      console.error('Error resetting form:', error);
    }
  };

  const handleEdit = (question: Question) => {
    try {
      setSelectedQuestion(question);
      setFormData({
        question: question.question,
        questionType: question.questionType,
        subject: question.subject._id,
        classNumber: question.classNumber.toString(),
        chapter: question.chapter || '',
        topic: question.topic || '',
        difficulty: question.difficulty,
        marks: question.marks,
        options: question.options.map(opt => ({ ...opt, imageUrl: opt.imageUrl || '' })),
        explanation: question.explanation || '',
        questionImageUrl: question.questionImageUrl || '',
        explanationImageUrl: question.explanationImageUrl || '',
        tags: question.tags || []
      });
      setIsEditDialogOpen(true);
    } catch (error) {
      console.error('Error editing question:', error);
      setError('Failed to load question for editing');
    }
  };

  const handleDelete = async (questionId: string) => {
    try {
      if (confirm('Are you sure you want to delete this question?')) {
        await safeCall(
          async () => await apiClient.delete(`/api/questions/${questionId}`),
          async () => {
            await fetchQuestions();
          },
          (error) => {
            setError(`Failed to delete question: ${error}`);
          }
        );
      }
    } catch (error) {
      console.error('Error deleting question:', error);
      setError('An unexpected error occurred while deleting the question');
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading questions..." />;
  }

  return (
    <ErrorBoundary fallback={SectionErrorFallback}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Questions Management</h1>
            <p className="text-muted-foreground">
              Manage and organize questions for tests and assessments
            </p>
          </div>
          <div className="flex gap-2">
            <ErrorBoundary fallback={SectionErrorFallback}>
              <Button 
                onClick={() => setIsBulkUploadOpen(true)}
                variant="outline"
                disabled={loading}
              >
                <Upload className="h-4 w-4 mr-2" />
                Bulk Upload
              </Button>
            </ErrorBoundary>
            <ErrorBoundary fallback={SectionErrorFallback}>
              <Button 
                onClick={() => setIsCreateDialogOpen(true)}
                disabled={loading}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Question
              </Button>
            </ErrorBoundary>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-destructive/15 border border-destructive/20 rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-sm font-medium text-destructive">Error</h4>
                <p className="text-sm text-destructive mt-1">{error}</p>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setError(null)}
                className="text-destructive hover:text-destructive"
              >
                ×
              </Button>
            </div>
          </div>
        )}

        {/* Filters */}
        <ErrorBoundary fallback={SectionErrorFallback}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
            <div>
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search questions..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-9"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="subject">Subject</Label>
              <Select 
                value={filters.subject} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, subject: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All subjects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All subjects</SelectItem>
                  {subjects.map((subject) => (
                    <SelectItem key={subject._id} value={subject._id}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="class">Class</Label>
              <Select 
                value={filters.classNumber} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, classNumber: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All classes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All classes</SelectItem>
                  {[5, 6, 7, 8, 9, 10].map((cls) => (
                    <SelectItem key={cls} value={cls.toString()}>
                      Class {cls}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="difficulty">Difficulty</Label>
              <Select 
                value={filters.difficulty} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, difficulty: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All difficulties" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All difficulties</SelectItem>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </ErrorBoundary>

        {/* Questions Table */}
        <ErrorBoundary fallback={SectionErrorFallback}>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Question</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Difficulty</TableHead>
                  <TableHead>Marks</TableHead>
                  <TableHead>Images</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {questions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      {loading ? 'Loading questions...' : 'No questions found. Create your first question to get started.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  questions.map((question) => (
                    <TableRow key={question._id}>
                      <TableCell className="max-w-[300px]">
                        <div className="truncate" title={question.question}>
                          {question.question}
                        </div>
                      </TableCell>
                      <TableCell>{question.subject?.name || 'Unknown'}</TableCell>
                      <TableCell>Class {question.classNumber}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {question.questionType === 'single-choice' ? 'Single Choice' : 'Multiple Choice'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getDifficultyColor(question.difficulty)}>
                          {question.difficulty}
                        </Badge>
                      </TableCell>
                      <TableCell>{question.marks}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {question.questionImageUrl && (
                            <ImageIcon className="h-4 w-4 text-blue-500" />
                          )}
                          {question.explanationImageUrl && (
                            <ImageIcon className="h-4 w-4 text-green-500" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(question)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(question._id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </ErrorBoundary>

        {/* Pagination */}
        {totalPages > 1 && (
          <ErrorBoundary fallback={SectionErrorFallback}>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, totalQuestions)} of {totalQuestions} questions
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setPage(prev => Math.max(1, prev - 1))}
                  disabled={page === 1 || loading}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={page === totalPages || loading}
                >
                  Next
                </Button>
              </div>
            </div>
          </ErrorBoundary>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={isCreateDialogOpen || isEditDialogOpen} onOpenChange={(open) => {
          if (!open) {
            setIsCreateDialogOpen(false);
            setIsEditDialogOpen(false);
            setSelectedQuestion(null);
            resetForm();
          }
        }}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <ErrorBoundary fallback={SectionErrorFallback}>
              <DialogHeader>
                <DialogTitle>
                  {selectedQuestion ? 'Edit Question' : 'Create New Question'}
                </DialogTitle>
                <DialogDescription>
                  {selectedQuestion ? 'Update the question details below.' : 'Fill in the details to create a new question.'}
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="subject">Subject *</Label>
                    <Select 
                      value={formData.subject} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, subject: value }))}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects.map((subject) => (
                          <SelectItem key={subject._id} value={subject._id}>
                            {subject.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="class">Class *</Label>
                    <Select 
                      value={formData.classNumber} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, classNumber: value }))}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select class" />
                      </SelectTrigger>
                      <SelectContent>
                        {[5, 6, 7, 8, 9, 10].map((cls) => (
                          <SelectItem key={cls} value={cls.toString()}>
                            Class {cls}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="questionType">Question Type *</Label>
                    <Select 
                      value={formData.questionType} 
                      onValueChange={(value: 'single-choice' | 'multiple-choice') => 
                        setFormData(prev => ({ ...prev, questionType: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="single-choice">Single Choice</SelectItem>
                        <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="difficulty">Difficulty *</Label>
                    <Select 
                      value={formData.difficulty} 
                      onValueChange={(value: 'easy' | 'medium' | 'hard') => 
                        setFormData(prev => ({ ...prev, difficulty: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">Easy</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="hard">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="question">Question Text *</Label>
                  <Textarea
                    id="question"
                    value={formData.question}
                    onChange={(e) => setFormData(prev => ({ ...prev, question: e.target.value }))}
                    placeholder="Enter your question..."
                    required
                    rows={3}
                  />
                </div>

                <div>
                  <Label>Options *</Label>
                  <div className="space-y-3 mt-2">
                    {formData.options.map((option, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                        <Checkbox
                          checked={option.isCorrect}
                          onCheckedChange={(checked) => handleCorrectAnswerChange(index, checked as boolean)}
                        />
                        <Input
                          value={option.text}
                          onChange={(e) => updateOption(index, 'text', e.target.value)}
                          placeholder={`Option ${index + 1}`}
                          className="flex-1"
                          required
                        />
                        {formData.options.length > 2 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeOption(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {formData.options.length < 6 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addOption}
                      className="mt-3"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Option
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="marks">Marks *</Label>
                    <Input
                      id="marks"
                      type="number"
                      value={formData.marks}
                      onChange={(e) => setFormData(prev => ({ ...prev, marks: parseInt(e.target.value) || 1 }))}
                      min={1}
                      max={10}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="chapter">Chapter</Label>
                    <Input
                      id="chapter"
                      value={formData.chapter}
                      onChange={(e) => setFormData(prev => ({ ...prev, chapter: e.target.value }))}
                      placeholder="Chapter name (optional)"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="explanation">Explanation</Label>
                  <Textarea
                    id="explanation"
                    value={formData.explanation}
                    onChange={(e) => setFormData(prev => ({ ...prev, explanation: e.target.value }))}
                    placeholder="Explain the correct answer (optional)"
                    rows={3}
                  />
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => {
                    setIsCreateDialogOpen(false);
                    setIsEditDialogOpen(false);
                    resetForm();
                  }}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {selectedQuestion ? 'Update Question' : 'Create Question'}
                  </Button>
                </DialogFooter>
              </form>
            </ErrorBoundary>
          </DialogContent>
        </Dialog>
      </div>
    </ErrorBoundary>
  );
}