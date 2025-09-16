'use client';

import { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, BookOpen, FileText, Search, Filter } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface HierarchyNode {
  name: string;
  count: number;
  children?: Record<string, HierarchyNode>;
}

interface QuestionSummary {
  _id: string;
  question: string;
  difficulty: 'easy' | 'medium' | 'hard';
  questionType: string;
  marks: number;
  usageCount?: number;
  correctAnswerRate?: number;
  isActive: boolean;
  verificationStatus: 'pending' | 'approved' | 'rejected';
}

interface HierarchicalBrowserProps {
  onQuestionSelect?: (questionId: string) => void;
  initialFilters?: {
    classNumber?: number;
    subject?: string;
    chapter?: string;
    topic?: string;
  };
}

export function HierarchicalQuestionBrowser({ 
  onQuestionSelect, 
  initialFilters = {} 
}: HierarchicalBrowserProps) {
  const [hierarchy, setHierarchy] = useState<Record<string, any>>({});
  const [questions, setQuestions] = useState<QuestionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Navigation state
  const [selectedClass, setSelectedClass] = useState<number | null>(initialFilters.classNumber || null);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(initialFilters.subject || null);
  const [selectedChapter, setSelectedChapter] = useState<string | null>(initialFilters.chapter || null);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(initialFilters.topic || null);
  
  // Expanded state for tree navigation
  const [expandedClasses, setExpandedClasses] = useState<Set<number>>(new Set());
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set());
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Fetch hierarchy data
  const fetchHierarchy = async () => {
    try {
      const response = await fetch('/api/questions/enhanced-v2?limit=1&includeStats=true');
      if (!response.ok) throw new Error('Failed to fetch hierarchy');
      
      const data = await response.json();
      if (data.success && data.hierarchyStats?.hierarchicalBreakdown) {
        setHierarchy(data.hierarchyStats.hierarchicalBreakdown);
      }
    } catch (error) {
      console.error('Error fetching hierarchy:', error);
      setError('Failed to load question hierarchy');
    }
  };

  // Fetch questions for current selection
  const fetchQuestions = async () => {
    if (!selectedClass && !selectedSubject && !selectedChapter && !selectedTopic) {
      setQuestions([]);
      return;
    }

    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (selectedClass) params.append('classNumber', selectedClass.toString());
      if (selectedSubject) params.append('subject', selectedSubject);
      if (selectedChapter) params.append('chapter', selectedChapter);
      if (selectedTopic) params.append('topic', selectedTopic);
      if (searchTerm) params.append('search', searchTerm);
      if (difficultyFilter) params.append('difficulty', difficultyFilter);
      if (statusFilter) params.append('verificationStatus', statusFilter);
      
      params.append('limit', '50');
      params.append('sortBy', 'usageCount');
      params.append('sortOrder', 'desc');

      const response = await fetch(`/api/questions/enhanced-v2?${params}`);
      if (!response.ok) throw new Error('Failed to fetch questions');
      
      const data = await response.json();
      if (data.success) {
        setQuestions(data.questions || []);
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
      setError('Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHierarchy();
  }, []);

  useEffect(() => {
    fetchQuestions();
  }, [selectedClass, selectedSubject, selectedChapter, selectedTopic, searchTerm, difficultyFilter, statusFilter]);

  // Toggle expanded state
  const toggleExpanded = (type: 'class' | 'subject' | 'chapter', key: string | number) => {
    if (type === 'class') {
      const newExpanded = new Set(expandedClasses);
      if (newExpanded.has(key as number)) {
        newExpanded.delete(key as number);
      } else {
        newExpanded.add(key as number);
      }
      setExpandedClasses(newExpanded);
    } else if (type === 'subject') {
      const newExpanded = new Set(expandedSubjects);
      const subjectKey = `${selectedClass}-${key}`;
      if (newExpanded.has(subjectKey)) {
        newExpanded.delete(subjectKey);
      } else {
        newExpanded.add(subjectKey);
      }
      setExpandedSubjects(newExpanded);
    } else if (type === 'chapter') {
      const newExpanded = new Set(expandedChapters);
      const chapterKey = `${selectedClass}-${selectedSubject}-${key}`;
      if (newExpanded.has(chapterKey)) {
        newExpanded.delete(chapterKey);
      } else {
        newExpanded.add(chapterKey);
      }
      setExpandedChapters(newExpanded);
    }
  };

  // Handle selection
  const handleSelection = (type: 'class' | 'subject' | 'chapter' | 'topic', value: string | number) => {
    if (type === 'class') {
      setSelectedClass(value as number);
      setSelectedSubject(null);
      setSelectedChapter(null);
      setSelectedTopic(null);
    } else if (type === 'subject') {
      setSelectedSubject(value as string);
      setSelectedChapter(null);
      setSelectedTopic(null);
    } else if (type === 'chapter') {
      setSelectedChapter(value as string);
      setSelectedTopic(null);
    } else if (type === 'topic') {
      setSelectedTopic(value as string);
    }
  };

  // Render hierarchy tree
  const renderHierarchy = () => {
    return (
      <div className="space-y-2">
        {Object.entries(hierarchy).map(([className, subjects]) => {
          const classNum = parseInt(className.replace('Class ', ''));
          const isClassExpanded = expandedClasses.has(classNum);
          
          return (
            <div key={className} className="border rounded-lg">
              <Collapsible>
                <CollapsibleTrigger asChild>
                  <Button
                    variant={selectedClass === classNum ? 'secondary' : 'ghost'}
                    className="w-full justify-between h-auto p-3"
                    onClick={() => {
                      handleSelection('class', classNum);
                      toggleExpanded('class', classNum);
                    }}
                  >
                    <div className="flex items-center space-x-2">
                      <BookOpen className="h-4 w-4" />
                      <span className="font-medium">{className}</span>
                    </div>
                    {isClassExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </Button>
                </CollapsibleTrigger>
                
                {isClassExpanded && (
                  <CollapsibleContent className="px-4 pb-2">
                    {Object.entries(subjects as Record<string, any>).map(([subjectName, chapters]) => {
                      const subjectKey = `${classNum}-${subjectName}`;
                      const isSubjectExpanded = expandedSubjects.has(subjectKey);
                      
                      return (
                        <div key={subjectName} className="ml-4 mt-2">
                          <Collapsible>
                            <CollapsibleTrigger asChild>
                              <Button
                                variant={selectedSubject === subjectName ? 'secondary' : 'ghost'}
                                size="sm"
                                className="w-full justify-between h-auto p-2"
                                onClick={() => {
                                  handleSelection('subject', subjectName);
                                  toggleExpanded('subject', subjectName);
                                }}
                              >
                                <span className="text-sm">{subjectName}</span>
                                {isSubjectExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                              </Button>
                            </CollapsibleTrigger>
                            
                            {isSubjectExpanded && (
                              <CollapsibleContent className="px-2 pb-1">
                                {Object.entries(chapters as Record<string, any>).map(([chapterName, topics]) => {
                                  const chapterKey = `${classNum}-${subjectName}-${chapterName}`;
                                  const isChapterExpanded = expandedChapters.has(chapterKey);
                                  
                                  return (
                                    <div key={chapterName} className="ml-4 mt-1">
                                      <Collapsible>
                                        <CollapsibleTrigger asChild>
                                          <Button
                                            variant={selectedChapter === chapterName ? 'secondary' : 'ghost'}
                                            size="sm"
                                            className="w-full justify-between h-auto p-1.5 text-xs"
                                            onClick={() => {
                                              handleSelection('chapter', chapterName);
                                              toggleExpanded('chapter', chapterName);
                                            }}
                                          >
                                            <span>{chapterName}</span>
                                            {isChapterExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                                          </Button>
                                        </CollapsibleTrigger>
                                        
                                        {isChapterExpanded && (
                                          <CollapsibleContent className="px-1 pb-1">
                                            {Object.entries(topics as Record<string, number>).map(([topicName, count]) => (
                                              <Button
                                                key={topicName}
                                                variant={selectedTopic === topicName ? 'secondary' : 'ghost'}
                                                size="sm"
                                                className="w-full justify-between h-auto p-1 text-xs ml-4"
                                                onClick={() => handleSelection('topic', topicName)}
                                              >
                                                <span>{topicName}</span>
                                                <Badge variant="outline" className="text-xs">
                                                  {count}
                                                </Badge>
                                              </Button>
                                            ))}
                                          </CollapsibleContent>
                                        )}
                                      </Collapsible>
                                    </div>
                                  );
                                })}
                              </CollapsibleContent>
                            )}
                          </Collapsible>
                        </div>
                      );
                    })}
                  </CollapsibleContent>
                )}
              </Collapsible>
            </div>
          );
        })}
      </div>
    );
  };

  // Render question list
  const renderQuestions = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          <span className="ml-2">Loading questions...</span>
        </div>
      );
    }

    if (questions.length === 0) {
      return (
        <div className="text-center p-8 text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No questions found for the current selection.</p>
          <p className="text-sm">Try selecting a topic or adjusting your filters.</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {questions.map((question) => (
          <Card 
            key={question._id} 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => onQuestionSelect?.(question._id)}
          >
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium text-sm line-clamp-2 flex-1">
                  {question.question}
                </h4>
                <Badge
                  variant={
                    question.difficulty === 'easy' ? 'secondary' :
                    question.difficulty === 'medium' ? 'default' : 'destructive'
                  }
                  className="ml-2 text-xs"
                >
                  {question.difficulty}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center space-x-3">
                  <span className="flex items-center">
                    <span className="font-medium">{question.questionType}</span>
                  </span>
                  <span>{question.marks} marks</span>
                  {question.usageCount && (
                    <span>Used {question.usageCount} times</span>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  <Badge
                    variant={question.isActive ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {question.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                  <Badge
                    variant={
                      question.verificationStatus === 'approved' ? 'default' :
                      question.verificationStatus === 'pending' ? 'secondary' : 'destructive'
                    }
                    className="text-xs"
                  >
                    {question.verificationStatus}
                  </Badge>
                </div>
              </div>
              
              {question.correctAnswerRate && (
                <div className="mt-2 text-xs text-muted-foreground">
                  Success Rate: {Math.round(question.correctAnswerRate * 100)}%
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  if (error) {
    return (
      <Card className="p-4 border-destructive">
        <div className="text-center text-destructive">
          <p className="font-medium">Error Loading Content</p>
          <p className="text-sm">{error}</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2"
            onClick={() => {
              setError(null);
              fetchHierarchy();
            }}
          >
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
      {/* Hierarchy Navigation */}
      <Card className="h-fit max-h-[80vh] overflow-hidden">
        <CardHeader>
          <CardTitle className="text-lg">Question Hierarchy</CardTitle>
          <CardDescription>
            Browse questions by Class → Subject → Chapter → Topic
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-y-auto max-h-[calc(80vh-120px)]">
          {renderHierarchy()}
        </CardContent>
      </Card>

      {/* Question List */}
      <Card className="h-fit max-h-[80vh] overflow-hidden">
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            <span>Questions</span>
            <Badge variant="outline" className="text-xs">
              {questions.length} found
            </Badge>
          </CardTitle>
          
          {/* Filters */}
          <div className="flex space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search questions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 text-sm"
              />
            </div>
            <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All</SelectItem>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        
        <CardContent className="overflow-y-auto max-h-[calc(80vh-200px)]">
          {renderQuestions()}
        </CardContent>
      </Card>
    </div>
  );
}