'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Filter,
  Eye,
  MoreHorizontal
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

interface Question {
  _id: string;
  question: string;
  questionType: 'single-choice' | 'multiple-choice';
  subject: string;
  class: number;
  chapter?: string;
  marks: number;
  options: Array<{ text: string; isCorrect: boolean }>;
  explanation?: string;
  createdAt: string;
}

export default function QuestionsManagement() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');

  const classes = [5, 6, 7, 8, 9, 10];
  const subjects = ['Mathematics', 'Science', 'English', 'Social Studies', 'Hindi'];

  useEffect(() => {
    fetchQuestions();
  }, [selectedClass, selectedSubject]);

  const fetchQuestions = async () => {
    try {
      let url = '/api/questions';
      const params = new URLSearchParams();
      
      if (selectedClass !== 'all') {
        params.append('classNumber', selectedClass);
      }
      if (selectedSubject !== 'all') {
        params.append('subject', selectedSubject);
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setQuestions(data.questions || []);
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteQuestion = async (id: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return;
    
    try {
      const response = await fetch(`/api/questions/${id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setQuestions(questions.filter(q => q._id !== id));
      }
    } catch (error) {
      console.error('Error deleting question:', error);
    }
  };

  const filteredQuestions = questions.filter(question =>
    question.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    question.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getDifficultyColor = (marks: number) => {
    if (marks <= 1) return 'bg-green-500';
    if (marks <= 3) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getDifficultyText = (marks: number) => {
    if (marks <= 1) return 'Easy';
    if (marks <= 3) return 'Medium';
    return 'Hard';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading questions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Manage Questions</h1>
          <p className="text-muted-foreground">
            Create, edit, and organize your question bank
          </p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add New Question
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
          <div className="grid gap-4 md:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search questions..."
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
            
            <Button variant="outline" onClick={fetchQuestions}>
              Apply Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-foreground">{questions.length}</div>
            <p className="text-xs text-muted-foreground">Total Questions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {questions.filter(q => q.marks <= 1).length}
            </div>
            <p className="text-xs text-muted-foreground">Easy Questions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">
              {questions.filter(q => q.marks > 1 && q.marks <= 3).length}
            </div>
            <p className="text-xs text-muted-foreground">Medium Questions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">
              {questions.filter(q => q.marks > 3).length}
            </div>
            <p className="text-xs text-muted-foreground">Hard Questions</p>
          </CardContent>
        </Card>
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        {filteredQuestions.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No questions found</h3>
                <p>Try adjusting your search criteria or add a new question.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredQuestions.map((question) => (
            <Card key={question._id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">Class {question.class}</Badge>
                      <Badge variant="outline">{question.subject}</Badge>
                      <div className="flex items-center gap-1">
                        <div className={`h-2 w-2 rounded-full ${getDifficultyColor(question.marks)}`}></div>
                        <span className="text-xs text-muted-foreground">
                          {getDifficultyText(question.marks)} ({question.marks} marks)
                        </span>
                      </div>
                      <Badge variant={question.questionType === 'single-choice' ? 'default' : 'secondary'}>
                        {question.questionType === 'single-choice' ? 'Single Choice' : 'Multiple Choice'}
                      </Badge>
                    </div>
                    
                    <h3 className="text-lg font-semibold text-foreground line-clamp-2">
                      {question.question}
                    </h3>
                    
                    <div className="text-sm text-muted-foreground">
                      {question.options.length} options • 
                      {question.explanation ? ' Has explanation' : ' No explanation'}
                      {question.chapter && ` • ${question.chapter}`}
                    </div>
                    
                    <div className="text-xs text-muted-foreground">
                      Created: {new Date(question.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem className="flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem className="flex items-center gap-2">
                        <Edit className="h-4 w-4" />
                        Edit Question
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="flex items-center gap-2 text-red-600"
                        onClick={() => deleteQuestion(question._id)}
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}