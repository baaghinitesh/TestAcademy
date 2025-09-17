'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Plus,
  Search,
  Filter,
  GripVertical,
  Trash2,
  Eye,
  Clock,
  Target,
  Settings,
  Save,
  Play,
  Users,
  ChevronDown,
  ChevronRight,
  BookOpen,
  FileText,
  RefreshCw,
  Download,
  Upload,
  Shuffle,
  CheckCircle,
  AlertCircle,
  Copy,
  RotateCcw,
  Shield
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { QuestionPreview } from '@/components/questions/question-preview';

// Types
interface Question {
  _id: string;
  question: string;
  questionType: 'single-choice' | 'multiple-choice' | 'true-false' | 'numerical' | 'fill-blank';
  options: Array<{
    text: string;
    isCorrect: boolean;
    order: number;
  }>;
  classNumber: number;
  subject: {
    _id: string;
    name: string;
  };
  chapter: string;
  topic: string;
  subtopic?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  marks: number;
  estimatedTime: number;
  tags: string[];
  explanation?: string;
  hint?: string;
  isVerified: boolean;
  usageCount: number;
  correctAnswerRate: number;
}

interface TestQuestion extends Question {
  order: number;
  selected?: boolean;
}

interface TestSettings {
  title: string;
  description: string;
  subject: string;
  classNumber: number;
  chapter?: string;
  duration: number; // minutes
  totalMarks: number;
  passingMarks: number;
  instructions: string[];
  allowedAttempts: number;
  showResults: boolean;
  showCorrectAnswers: boolean;
  randomizeQuestions: boolean;
  randomizeOptions: boolean;
  startTime?: Date;
  endTime?: Date;
  
  // Advanced Settings
  timePerQuestion?: number; // seconds per question
  negativeMarking: boolean;
  negativeMarkingRatio: number;
  passingStrategy: 'percentage' | 'absolute' | 'graded';
  passingPercentage: number;
  autoSubmitOnTimeout: boolean;
  allowReviewBeforeSubmit: boolean;
  showQuestionNumbers: boolean;
  allowBookmarks: boolean;
  showProgressBar: boolean;
  preventCopyPaste: boolean;
  fullScreenMode: boolean;
  shuffleQuestionPool: boolean;
  questionPoolSize?: number;
  sectionalTimeLimits: boolean;
  sectionDurations?: Record<string, number>;
  instantFeedback: boolean;
  partialMarking: boolean;
  timerWarnings: number[]; // minutes before expiry to show warnings
  examSecurityLevel: 'basic' | 'medium' | 'high';
}

interface QuestionBank {
  questions: Question[];
  total: number;
  hierarchyStats: any;
}

interface TestBuilderProps {
  onSave?: (test: TestSettings & { questions: TestQuestion[] }) => Promise<void>;
  onPreview?: (test: TestSettings & { questions: TestQuestion[] }) => void;
  existingTest?: TestSettings & { questions: TestQuestion[] };
  onClose?: () => void;
}

export function TestBuilder({ onSave, onPreview, existingTest, onClose }: TestBuilderProps) {
  const [activeTab, setActiveTab] = useState('questions');
  const [questionBank, setQuestionBank] = useState<QuestionBank>({ questions: [], total: 0, hierarchyStats: {} });
  const [selectedQuestions, setSelectedQuestions] = useState<TestQuestion[]>(existingTest?.questions || []);
  const [testSettings, setTestSettings] = useState<TestSettings>(existingTest || {
    title: '',
    description: '',
    subject: '',
    classNumber: 6,
    duration: 60,
    totalMarks: 0,
    passingMarks: 0,
    instructions: ['Read all questions carefully', 'Select the best answer for each question'],
    allowedAttempts: 1,
    showResults: true,
    showCorrectAnswers: false,
    randomizeQuestions: false,
    randomizeOptions: false,
    
    // Advanced defaults
    timePerQuestion: 120,
    negativeMarking: false,
    negativeMarkingRatio: 0.25,
    passingStrategy: 'percentage',
    passingPercentage: 60,
    autoSubmitOnTimeout: true,
    allowReviewBeforeSubmit: true,
    showQuestionNumbers: true,
    allowBookmarks: true,
    showProgressBar: true,
    preventCopyPaste: false,
    fullScreenMode: false,
    shuffleQuestionPool: false,
    sectionalTimeLimits: false,
    instantFeedback: false,
    partialMarking: false,
    timerWarnings: [10, 5, 1],
    examSecurityLevel: 'basic',
  });
  
  // Filter states
  const [filters, setFilters] = useState({
    search: '',
    classNumber: '',
    subject: '',
    chapter: '',
    topic: '',
    difficulty: '',
    questionType: '',
    isVerified: true,
    minMarks: '',
    maxMarks: ''
  });
  
  // UI states
  const [isLoading, setIsLoading] = useState(false);
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
  const [selectedBankQuestions, setSelectedBankQuestions] = useState<Set<string>>(new Set());
  const [previewQuestion, setPreviewQuestion] = useState<Question | null>(null);
  const [isDragAndDrop, setIsDragAndDrop] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  // Load question bank
  const loadQuestionBank = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          params.append(key, value.toString());
        }
      });

      const response = await fetch(`/api/questions/enhanced-v2?${params.toString()}`);
      const data = await response.json();
      
      if (data.success) {
        setQuestionBank({
          questions: data.questions || [],
          total: data.total || 0,
          hierarchyStats: data.hierarchyStats || {}
        });
      }
    } catch (error) {
      console.error('Failed to load question bank:', error);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  // Load questions on mount and filter changes
  useEffect(() => {
    loadQuestionBank();
  }, [loadQuestionBank]);

  // Auto-calculate marks and passing marks
  useEffect(() => {
    const totalMarks = selectedQuestions.reduce((sum, q) => sum + q.marks, 0);
    let calculatedPassingMarks = 0;
    
    if (testSettings.passingStrategy === 'percentage') {
      calculatedPassingMarks = Math.ceil(totalMarks * (testSettings.passingPercentage / 100));
    } else if (testSettings.passingStrategy === 'absolute') {
      calculatedPassingMarks = testSettings.passingMarks;
    } else if (testSettings.passingStrategy === 'graded') {
      // Grade-based (can be customized)
      calculatedPassingMarks = Math.ceil(totalMarks * 0.6);
    }
    
    setTestSettings(prev => ({
      ...prev,
      totalMarks,
      passingMarks: calculatedPassingMarks
    }));
  }, [selectedQuestions, testSettings.passingStrategy, testSettings.passingPercentage]);

  // Question selection handlers
  const addQuestionsToTest = useCallback((questions: Question[]) => {
    const newQuestions = questions.map((q, index) => ({
      ...q,
      order: selectedQuestions.length + index + 1
    }));
    
    setSelectedQuestions(prev => [...prev, ...newQuestions]);
    setSelectedBankQuestions(new Set());
  }, [selectedQuestions.length]);

  const removeQuestionFromTest = useCallback((questionId: string) => {
    setSelectedQuestions(prev => {
      const filtered = prev.filter(q => q._id !== questionId);
      return filtered.map((q, index) => ({ ...q, order: index + 1 }));
    });
  }, []);

  const reorderQuestions = useCallback(() => {
    if (dragItem.current !== null && dragOverItem.current !== null) {
      const newQuestions = [...selectedQuestions];
      const draggedItem = newQuestions[dragItem.current];
      newQuestions.splice(dragItem.current, 1);
      newQuestions.splice(dragOverItem.current, 0, draggedItem);
      
      // Update order
      const reorderedQuestions = newQuestions.map((q, index) => ({ ...q, order: index + 1 }));
      setSelectedQuestions(reorderedQuestions);
    }
    dragItem.current = null;
    dragOverItem.current = null;
  }, [selectedQuestions]);

  // Auto-generate test from criteria
  const autoGenerateTest = useCallback(async () => {
    if (!testSettings.classNumber || !testSettings.subject) {
      alert('Please select class and subject first');
      return;
    }

    setIsLoading(true);
    try {
      // Smart algorithm to select balanced questions
      const availableQuestions = questionBank.questions.filter(q => 
        q.classNumber === testSettings.classNumber &&
        q.subject._id === testSettings.subject
      );

      if (availableQuestions.length === 0) {
        alert('No questions available for the selected criteria');
        return;
      }

      // Balance by difficulty (30% easy, 50% medium, 20% hard)
      const easy = availableQuestions.filter(q => q.difficulty === 'easy');
      const medium = availableQuestions.filter(q => q.difficulty === 'medium');
      const hard = availableQuestions.filter(q => q.difficulty === 'hard');

      const targetQuestions = 20; // Default test size
      const selectedQuestions: Question[] = [];

      // Select questions maintaining balance
      const easyCount = Math.floor(targetQuestions * 0.3);
      const mediumCount = Math.floor(targetQuestions * 0.5);
      const hardCount = targetQuestions - easyCount - mediumCount;

      selectedQuestions.push(...easy.slice(0, easyCount));
      selectedQuestions.push(...medium.slice(0, mediumCount));
      selectedQuestions.push(...hard.slice(0, hardCount));

      // Shuffle and add to test
      const shuffled = selectedQuestions.sort(() => Math.random() - 0.5);
      addQuestionsToTest(shuffled);

    } catch (error) {
      console.error('Failed to auto-generate test:', error);
      alert('Failed to generate test automatically');
    } finally {
      setIsLoading(false);
    }
  }, [questionBank.questions, testSettings, addQuestionsToTest]);

  // Save test
  const saveTest = useCallback(async () => {
    if (!testSettings.title.trim()) {
      alert('Please enter a test title');
      return;
    }

    if (selectedQuestions.length === 0) {
      alert('Please add at least one question to the test');
      return;
    }

    setSaveStatus('saving');
    try {
      if (onSave) {
        await onSave({ ...testSettings, questions: selectedQuestions });
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 3000);
      }
    } catch (error) {
      console.error('Failed to save test:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  }, [testSettings, selectedQuestions, onSave]);

  // Preview test
  const previewTest = useCallback(() => {
    if (selectedQuestions.length === 0) {
      alert('Please add at least one question to preview');
      return;
    }

    if (onPreview) {
      onPreview({ ...testSettings, questions: selectedQuestions });
    }
  }, [testSettings, selectedQuestions, onPreview]);

  const toggleChapterExpansion = useCallback((chapter: string) => {
    setExpandedChapters(prev => {
      const newSet = new Set(prev);
      if (newSet.has(chapter)) {
        newSet.delete(chapter);
      } else {
        newSet.add(chapter);
      }
      return newSet;
    });
  }, []);

  const toggleQuestionSelection = useCallback((questionId: string) => {
    setSelectedBankQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-6 w-6" />
                  Test Builder
                </CardTitle>
                <CardDescription>
                  Create and manage tests with drag-and-drop question selection
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {saveStatus === 'saved' && (
                  <Badge variant="secondary" className="text-green-600">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Saved
                  </Badge>
                )}
                {saveStatus === 'error' && (
                  <Badge variant="destructive">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Save Failed
                  </Badge>
                )}
                <Button variant="outline" onClick={previewTest}>
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
                <Button onClick={saveTest} disabled={saveStatus === 'saving'}>
                  {saveStatus === 'saving' ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save Test
                </Button>
                {onClose && (
                  <Button variant="ghost" onClick={onClose}>
                    Close
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Question Bank */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Question Bank
                </CardTitle>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={autoGenerateTest} disabled={isLoading}>
                    <Shuffle className="h-4 w-4 mr-2" />
                    Auto-Generate Test
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => addQuestionsToTest(
                      questionBank.questions.filter(q => selectedBankQuestions.has(q._id))
                    )}
                    disabled={selectedBankQuestions.size === 0}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Selected ({selectedBankQuestions.size})
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={loadQuestionBank}
                    disabled={isLoading}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent>
                {/* Filters */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  <Input
                    placeholder="Search questions..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  />
                  <Select value={filters.classNumber} onValueChange={(value) => setFilters(prev => ({ ...prev, classNumber: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Class" />
                    </SelectTrigger>
                    <SelectContent>
                      {[6, 7, 8, 9, 10, 11, 12].map(cls => (
                        <SelectItem key={cls} value={cls.toString()}>Class {cls}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={filters.difficulty} onValueChange={(value) => setFilters(prev => ({ ...prev, difficulty: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filters.questionType} onValueChange={(value) => setFilters(prev => ({ ...prev, questionType: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single-choice">Single Choice</SelectItem>
                      <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                      <SelectItem value="true-false">True/False</SelectItem>
                      <SelectItem value="numerical">Numerical</SelectItem>
                      <SelectItem value="fill-blank">Fill in Blank</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Question List */}
                <div className="max-h-96 overflow-y-auto">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-32">
                      <RefreshCw className="h-6 w-6 animate-spin" />
                      <span className="ml-2">Loading questions...</span>
                    </div>
                  ) : questionBank.questions.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No questions found matching your criteria
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {questionBank.questions.map((question) => (
                        <Card key={question._id} className="p-3 hover:shadow-md transition-shadow cursor-pointer">
                          <div className="flex items-start gap-3">
                            <Checkbox
                              checked={selectedBankQuestions.has(question._id)}
                              onCheckedChange={() => toggleQuestionSelection(question._id)}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className="text-xs">
                                  {question.difficulty}
                                </Badge>
                                <Badge variant="secondary" className="text-xs">
                                  {question.marks} marks
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {question.estimatedTime}s
                                </Badge>
                                {question.isVerified && (
                                  <CheckCircle className="h-3 w-3 text-green-600" />
                                )}
                              </div>
                              <p className="text-sm font-medium line-clamp-2 mb-1">
                                {question.question}
                              </p>
                              <div className="text-xs text-gray-500 space-x-2">
                                <span>{question.chapter}</span>
                                <span>•</span>
                                <span>{question.topic}</span>
                                <span>•</span>
                                <span>{question.correctAnswerRate}% correct rate</span>
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setPreviewQuestion(question)}
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => addQuestionsToTest([question])}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Test Configuration */}
          <div>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="questions">Questions ({selectedQuestions.length})</TabsTrigger>
                <TabsTrigger value="settings">Basic Settings</TabsTrigger>
                <TabsTrigger value="advanced">Advanced Settings</TabsTrigger>
              </TabsList>

              {/* Test Questions Tab */}
              <TabsContent value="questions">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Selected Questions</span>
                      <div className="text-sm text-gray-500">
                        Total: {testSettings.totalMarks} marks
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedQuestions.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <FileText className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                        <p>No questions added yet</p>
                        <p className="text-xs">Select questions from the question bank</p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {selectedQuestions.map((question, index) => (
                          <Card 
                            key={question._id} 
                            className="p-3 cursor-move hover:shadow-md transition-shadow"
                            draggable={isDragAndDrop}
                            onDragStart={() => { dragItem.current = index; }}
                            onDragEnter={() => { dragOverItem.current = index; }}
                            onDragEnd={reorderQuestions}
                          >
                            <div className="flex items-start gap-2">
                              <GripVertical className="h-4 w-4 text-gray-400 mt-1" />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-sm font-medium">Q{question.order}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {question.marks} marks
                                  </Badge>
                                  <Badge variant="secondary" className="text-xs">
                                    {question.difficulty}
                                  </Badge>
                                </div>
                                <p className="text-sm line-clamp-2 mb-1">
                                  {question.question}
                                </p>
                                <div className="text-xs text-gray-500">
                                  {question.chapter} • {question.topic}
                                </div>
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setPreviewQuestion(question)}
                                >
                                  <Eye className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeQuestionFromTest(question._id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}
                    
                    <div className="mt-4 pt-4 border-t">
                      <div className="flex items-center justify-between text-sm">
                        <span>Total Questions: {selectedQuestions.length}</span>
                        <span>Total Marks: {testSettings.totalMarks}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Estimated Time: {selectedQuestions.reduce((sum, q) => sum + q.estimatedTime, 0)} seconds</span>
                        <span>Passing: {testSettings.passingMarks} marks</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Test Settings Tab */}
              <TabsContent value="settings">
                <Card>
                  <CardHeader>
                    <CardTitle>Test Configuration</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="title">Test Title</Label>
                      <Input
                        id="title"
                        value={testSettings.title}
                        onChange={(e) => setTestSettings(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Enter test title..."
                      />
                    </div>

                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={testSettings.description}
                        onChange={(e) => setTestSettings(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Test description..."
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="duration">Duration (minutes)</Label>
                        <Input
                          id="duration"
                          type="number"
                          value={testSettings.duration}
                          onChange={(e) => setTestSettings(prev => ({ ...prev, duration: parseInt(e.target.value) || 0 }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="passingMarks">Passing Marks</Label>
                        <Input
                          id="passingMarks"
                          type="number"
                          value={testSettings.passingMarks}
                          onChange={(e) => setTestSettings(prev => ({ ...prev, passingMarks: parseInt(e.target.value) || 0 }))}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="allowedAttempts">Allowed Attempts</Label>
                      <Select 
                        value={testSettings.allowedAttempts.toString()} 
                        onValueChange={(value) => setTestSettings(prev => ({ ...prev, allowedAttempts: parseInt(value) }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 Attempt</SelectItem>
                          <SelectItem value="2">2 Attempts</SelectItem>
                          <SelectItem value="3">3 Attempts</SelectItem>
                          <SelectItem value="999">Unlimited</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <h4 className="font-medium">Test Options</h4>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="showResults"
                          checked={testSettings.showResults}
                          onCheckedChange={(checked) => setTestSettings(prev => ({ ...prev, showResults: checked as boolean }))}
                        />
                        <Label htmlFor="showResults">Show results after submission</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="showCorrectAnswers"
                          checked={testSettings.showCorrectAnswers}
                          onCheckedChange={(checked) => setTestSettings(prev => ({ ...prev, showCorrectAnswers: checked as boolean }))}
                        />
                        <Label htmlFor="showCorrectAnswers">Show correct answers in results</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="randomizeQuestions"
                          checked={testSettings.randomizeQuestions}
                          onCheckedChange={(checked) => setTestSettings(prev => ({ ...prev, randomizeQuestions: checked as boolean }))}
                        />
                        <Label htmlFor="randomizeQuestions">Randomize question order</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="randomizeOptions"
                          checked={testSettings.randomizeOptions}
                          onCheckedChange={(checked) => setTestSettings(prev => ({ ...prev, randomizeOptions: checked as boolean }))}
                        />
                        <Label htmlFor="randomizeOptions">Randomize option order</Label>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Advanced Settings Tab */}
              <TabsContent value="advanced">
                <Card>
                  <CardHeader>
                    <CardTitle>Advanced Configuration</CardTitle>
                    <CardDescription>Granular test settings for enhanced control</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Scoring & Marking */}
                    <div className="space-y-4">
                      <h4 className="font-medium flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        Scoring & Marking
                      </h4>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="passingStrategy">Passing Strategy</Label>
                          <Select 
                            value={testSettings.passingStrategy} 
                            onValueChange={(value) => setTestSettings(prev => ({ ...prev, passingStrategy: value as any }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="percentage">Percentage Based</SelectItem>
                              <SelectItem value="absolute">Absolute Marks</SelectItem>
                              <SelectItem value="graded">Grade Based</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label htmlFor="passingPercentage">Passing Percentage</Label>
                          <Input
                            id="passingPercentage"
                            type="number"
                            value={testSettings.passingPercentage}
                            onChange={(e) => setTestSettings(prev => ({ ...prev, passingPercentage: parseInt(e.target.value) || 0 }))}
                            min="0"
                            max="100"
                          />
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="negativeMarking"
                          checked={testSettings.negativeMarking}
                          onCheckedChange={(checked) => setTestSettings(prev => ({ ...prev, negativeMarking: checked as boolean }))}
                        />
                        <Label htmlFor="negativeMarking">Enable Negative Marking</Label>
                      </div>

                      {testSettings.negativeMarking && (
                        <div className="ml-6 grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="negativeMarkingRatio">Negative Marking Ratio</Label>
                            <Input
                              id="negativeMarkingRatio"
                              type="number"
                              step="0.25"
                              value={testSettings.negativeMarkingRatio}
                              onChange={(e) => setTestSettings(prev => ({ ...prev, negativeMarkingRatio: parseFloat(e.target.value) || 0 }))}
                              min="0"
                              max="1"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              Fraction of marks deducted for wrong answers
                            </p>
                          </div>
                          <div className="flex items-center space-x-2 mt-6">
                            <Checkbox
                              id="partialMarking"
                              checked={testSettings.partialMarking}
                              onCheckedChange={(checked) => setTestSettings(prev => ({ ...prev, partialMarking: checked as boolean }))}
                            />
                            <Label htmlFor="partialMarking">Allow Partial Marking</Label>
                          </div>
                        </div>
                      )}
                    </div>

                    <Separator />

                    {/* Timing & Duration */}
                    <div className="space-y-4">
                      <h4 className="font-medium flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Timing & Duration
                      </h4>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="timePerQuestion">Time Per Question (seconds)</Label>
                          <Input
                            id="timePerQuestion"
                            type="number"
                            value={testSettings.timePerQuestion}
                            onChange={(e) => setTestSettings(prev => ({ ...prev, timePerQuestion: parseInt(e.target.value) || 0 }))}
                            min="30"
                            max="600"
                          />
                        </div>
                        <div>
                          <Label>Timer Warnings (minutes)</Label>
                          <Input
                            value={testSettings.timerWarnings.join(', ')}
                            onChange={(e) => {
                              const warnings = e.target.value.split(',').map(w => parseInt(w.trim())).filter(w => !isNaN(w));
                              setTestSettings(prev => ({ ...prev, timerWarnings: warnings }));
                            }}
                            placeholder="10, 5, 1"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Comma-separated minutes before expiry
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="autoSubmitOnTimeout"
                            checked={testSettings.autoSubmitOnTimeout}
                            onCheckedChange={(checked) => setTestSettings(prev => ({ ...prev, autoSubmitOnTimeout: checked as boolean }))}
                          />
                          <Label htmlFor="autoSubmitOnTimeout">Auto-submit when time expires</Label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="sectionalTimeLimits"
                            checked={testSettings.sectionalTimeLimits}
                            onCheckedChange={(checked) => setTestSettings(prev => ({ ...prev, sectionalTimeLimits: checked as boolean }))}
                          />
                          <Label htmlFor="sectionalTimeLimits">Enable sectional time limits</Label>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* User Experience */}
                    <div className="space-y-4">
                      <h4 className="font-medium flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        User Experience
                      </h4>
                      
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="allowReviewBeforeSubmit"
                              checked={testSettings.allowReviewBeforeSubmit}
                              onCheckedChange={(checked) => setTestSettings(prev => ({ ...prev, allowReviewBeforeSubmit: checked as boolean }))}
                            />
                            <Label htmlFor="allowReviewBeforeSubmit">Allow review before submit</Label>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="showQuestionNumbers"
                              checked={testSettings.showQuestionNumbers}
                              onCheckedChange={(checked) => setTestSettings(prev => ({ ...prev, showQuestionNumbers: checked as boolean }))}
                            />
                            <Label htmlFor="showQuestionNumbers">Show question numbers</Label>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="allowBookmarks"
                              checked={testSettings.allowBookmarks}
                              onCheckedChange={(checked) => setTestSettings(prev => ({ ...prev, allowBookmarks: checked as boolean }))}
                            />
                            <Label htmlFor="allowBookmarks">Allow question bookmarks</Label>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="showProgressBar"
                              checked={testSettings.showProgressBar}
                              onCheckedChange={(checked) => setTestSettings(prev => ({ ...prev, showProgressBar: checked as boolean }))}
                            />
                            <Label htmlFor="showProgressBar">Show progress bar</Label>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="instantFeedback"
                              checked={testSettings.instantFeedback}
                              onCheckedChange={(checked) => setTestSettings(prev => ({ ...prev, instantFeedback: checked as boolean }))}
                            />
                            <Label htmlFor="instantFeedback">Instant feedback on answers</Label>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="shuffleQuestionPool"
                              checked={testSettings.shuffleQuestionPool}
                              onCheckedChange={(checked) => setTestSettings(prev => ({ ...prev, shuffleQuestionPool: checked as boolean }))}
                            />
                            <Label htmlFor="shuffleQuestionPool">Shuffle from question pool</Label>
                          </div>
                          
                          {testSettings.shuffleQuestionPool && (
                            <div className="ml-6">
                              <Label htmlFor="questionPoolSize">Pool Size</Label>
                              <Input
                                id="questionPoolSize"
                                type="number"
                                value={testSettings.questionPoolSize || selectedQuestions.length}
                                onChange={(e) => setTestSettings(prev => ({ ...prev, questionPoolSize: parseInt(e.target.value) || 0 }))}
                                min="1"
                                max="100"
                                className="w-24"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Security & Monitoring */}
                    <div className="space-y-4">
                      <h4 className="font-medium flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Security & Monitoring
                      </h4>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="examSecurityLevel">Security Level</Label>
                          <Select 
                            value={testSettings.examSecurityLevel} 
                            onValueChange={(value) => setTestSettings(prev => ({ ...prev, examSecurityLevel: value as any }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="basic">Basic (Standard web)</SelectItem>
                              <SelectItem value="medium">Medium (Restricted navigation)</SelectItem>
                              <SelectItem value="high">High (Lockdown mode)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="preventCopyPaste"
                            checked={testSettings.preventCopyPaste}
                            onCheckedChange={(checked) => setTestSettings(prev => ({ ...prev, preventCopyPaste: checked as boolean }))}
                          />
                          <Label htmlFor="preventCopyPaste">Prevent copy/paste operations</Label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="fullScreenMode"
                            checked={testSettings.fullScreenMode}
                            onCheckedChange={(checked) => setTestSettings(prev => ({ ...prev, fullScreenMode: checked as boolean }))}
                          />
                          <Label htmlFor="fullScreenMode">Force fullscreen mode</Label>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Test Instructions */}
                    <div className="space-y-4">
                      <h4 className="font-medium flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Test Instructions
                      </h4>
                      
                      <div>
                        <Label>Custom Instructions (one per line)</Label>
                        <Textarea
                          value={testSettings.instructions.join('\n')}
                          onChange={(e) => {
                            const instructions = e.target.value.split('\n').filter(i => i.trim());
                            setTestSettings(prev => ({ ...prev, instructions }));
                          }}
                          placeholder="Enter test instructions, one per line..."
                          rows={4}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Question Preview Dialog */}
        {previewQuestion && (
          <Dialog open={!!previewQuestion} onOpenChange={() => setPreviewQuestion(null)}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Question Preview</DialogTitle>
                <DialogDescription>
                  {previewQuestion.chapter} • {previewQuestion.topic} • {previewQuestion.marks} marks
                </DialogDescription>
              </DialogHeader>
              <QuestionPreview 
                question={{
                  ...previewQuestion,
                  questionText: previewQuestion.question,
                  options: previewQuestion.options.map((opt, idx) => ({
                    ...opt,
                    id: `opt_${idx}`
                  }))
                }} 
                mode="preview" 
              />
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}