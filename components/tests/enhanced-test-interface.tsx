'use client';

import { useState, useEffect, useRef } from 'react';
import { Clock, Flag, CheckCircle, AlertCircle, ArrowLeft, ArrowRight, Eye, EyeOff, Save } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Checkbox } from '../ui/checkbox';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';

interface TestQuestion {
  _id: string;
  question: string;
  questionType: 'single-choice' | 'multiple-choice' | 'true-false' | 'numerical' | 'fill-in-blank';
  options: {
    text: string;
    isCorrect: boolean;
    imageUrl?: string;
  }[];
  marks: number;
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedTime?: number;
  questionImageUrl?: string;
  explanation?: string;
  chapter: string;
  topic: string;
  bloomsTaxonomy?: string;
}

interface TestData {
  _id: string;
  title: string;
  description?: string;
  duration: number;
  totalMarks: number;
  instructions?: string[];
  questions: TestQuestion[];
  subject: string;
  classNumber: number;
}

interface StudentAnswer {
  questionId: string;
  answer: string | string[];
  timeTaken: number;
  flagged: boolean;
  visited: boolean;
}

interface TestState {
  currentQuestionIndex: number;
  answers: Record<string, StudentAnswer>;
  startTime: number;
  timeRemaining: number;
  isSubmitted: boolean;
  autoSaveEnabled: boolean;
}

interface EnhancedTestInterfaceProps {
  testId: string;
  onSubmit: (answers: Record<string, StudentAnswer>, totalTime: number) => void;
  onSave?: (answers: Record<string, StudentAnswer>) => void;
  autoSaveInterval?: number; // seconds
}

export function EnhancedTestInterface({ 
  testId, 
  onSubmit, 
  onSave,
  autoSaveInterval = 30 
}: EnhancedTestInterfaceProps) {
  const [testData, setTestData] = useState<TestData | null>(null);
  const [testState, setTestState] = useState<TestState>({
    currentQuestionIndex: 0,
    answers: {},
    startTime: Date.now(),
    timeRemaining: 0,
    isSubmitted: false,
    autoSaveEnabled: true
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInstructions, setShowInstructions] = useState(true);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const autoSaveRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch test data
  const fetchTestData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/tests/${testId}`);
      if (!response.ok) throw new Error('Failed to fetch test');
      
      const data = await response.json();
      if (data.success) {
        setTestData(data.test);
        setTestState(prev => ({
          ...prev,
          timeRemaining: data.test.duration * 60, // Convert minutes to seconds
        }));
        
        // Initialize answers
        const initialAnswers: Record<string, StudentAnswer> = {};
        data.test.questions.forEach((question: TestQuestion) => {
          initialAnswers[question._id] = {
            questionId: question._id,
            answer: question.questionType === 'multiple-choice' ? [] : '',
            timeTaken: 0,
            flagged: false,
            visited: false
          };
        });
        setTestState(prev => ({ ...prev, answers: initialAnswers }));
      }
    } catch (error) {
      console.error('Error fetching test:', error);
      setError('Failed to load test');
    } finally {
      setLoading(false);
    }
  };

  // Start timer
  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setTestState(prev => {
        const newTimeRemaining = prev.timeRemaining - 1;
        if (newTimeRemaining <= 0) {
          handleAutoSubmit();
          return prev;
        }
        return { ...prev, timeRemaining: newTimeRemaining };
      });
    }, 1000);
  };

  // Auto-save functionality
  const startAutoSave = () => {
    if (onSave) {
      autoSaveRef.current = setInterval(() => {
        if (testState.autoSaveEnabled && !testState.isSubmitted) {
          onSave(testState.answers);
        }
      }, autoSaveInterval * 1000);
    }
  };

  // Handle test start
  const handleStartTest = () => {
    setShowInstructions(false);
    setTestState(prev => ({ ...prev, startTime: Date.now() }));
    startTimer();
    startAutoSave();
  };

  // Handle answer change
  const handleAnswerChange = (questionId: string, answer: string | string[]) => {
    setTestState(prev => ({
      ...prev,
      answers: {
        ...prev.answers,
        [questionId]: {
          ...prev.answers[questionId],
          answer,
          visited: true,
          timeTaken: prev.answers[questionId].timeTaken + 1
        }
      }
    }));
  };

  // Toggle question flag
  const toggleFlag = (questionId: string) => {
    setTestState(prev => ({
      ...prev,
      answers: {
        ...prev.answers,
        [questionId]: {
          ...prev.answers[questionId],
          flagged: !prev.answers[questionId].flagged
        }
      }
    }));
  };

  // Navigate to question
  const goToQuestion = (index: number) => {
    if (testData && index >= 0 && index < testData.questions.length) {
      setTestState(prev => ({ ...prev, currentQuestionIndex: index }));
    }
  };

  // Handle manual submit
  const handleSubmit = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (autoSaveRef.current) clearInterval(autoSaveRef.current);
    
    const totalTime = Math.floor((Date.now() - testState.startTime) / 1000);
    setTestState(prev => ({ ...prev, isSubmitted: true }));
    onSubmit(testState.answers, totalTime);
  };

  // Handle auto-submit when time ends
  const handleAutoSubmit = () => {
    if (!testState.isSubmitted) {
      handleSubmit();
    }
  };

  // Format time display
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Get question navigation status
  const getQuestionStatus = (questionId: string) => {
    const answer = testState.answers[questionId];
    if (!answer) return 'not-visited';
    
    if (answer.flagged) return 'flagged';
    if (answer.visited && (
      (typeof answer.answer === 'string' && answer.answer.trim()) ||
      (Array.isArray(answer.answer) && answer.answer.length > 0)
    )) {
      return 'answered';
    }
    if (answer.visited) return 'visited';
    return 'not-visited';
  };

  // Calculate progress
  const calculateProgress = () => {
    if (!testData) return { answered: 0, total: 0, percentage: 0 };
    
    const answered = Object.values(testState.answers).filter(answer => {
      return (typeof answer.answer === 'string' && answer.answer.trim()) ||
             (Array.isArray(answer.answer) && answer.answer.length > 0);
    }).length;
    
    const total = testData.questions.length;
    const percentage = total > 0 ? (answered / total) * 100 : 0;
    
    return { answered, total, percentage };
  };

  useEffect(() => {
    fetchTestData();
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (autoSaveRef.current) clearInterval(autoSaveRef.current);
    };
  }, [testId]);

  // Render question content
  const renderQuestion = (question: TestQuestion) => {
    const answer = testState.answers[question._id];
    if (!answer) return null;

    const handleOptionSelect = (optionIndex: number) => {
      if (question.questionType === 'single-choice' || question.questionType === 'true-false') {
        handleAnswerChange(question._id, optionIndex.toString());
      } else if (question.questionType === 'multiple-choice') {
        const currentAnswers = answer.answer as string[];
        const optionIndexStr = optionIndex.toString();
        const newAnswers = currentAnswers.includes(optionIndexStr)
          ? currentAnswers.filter(a => a !== optionIndexStr)
          : [...currentAnswers, optionIndexStr];
        handleAnswerChange(question._id, newAnswers);
      }
    };

    return (
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <CardTitle className="text-lg mb-2">
                Question {testState.currentQuestionIndex + 1}
                <Badge variant="outline" className="ml-2">
                  {question.marks} {question.marks === 1 ? 'mark' : 'marks'}
                </Badge>
                <Badge variant={
                  question.difficulty === 'easy' ? 'secondary' : 
                  question.difficulty === 'medium' ? 'default' : 'destructive'
                } className="ml-2">
                  {question.difficulty}
                </Badge>
              </CardTitle>
              <CardDescription>
                {question.chapter} • {question.topic}
                {question.estimatedTime && (
                  <span className="ml-2">• ~{question.estimatedTime}s</span>
                )}
              </CardDescription>
            </div>
            <Button
              variant={answer.flagged ? 'default' : 'outline'}
              size="sm"
              onClick={() => toggleFlag(question._id)}
              className={answer.flagged ? 'bg-yellow-500 hover:bg-yellow-600' : ''}
            >
              <Flag className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            {/* Question Text */}
            <div className="text-base leading-relaxed">
              {question.question}
            </div>
            
            {/* Question Image */}
            {question.questionImageUrl && (
              <img 
                src={question.questionImageUrl} 
                alt="Question" 
                className="max-w-full h-auto rounded-lg border"
              />
            )}
            
            {/* Answer Options */}
            <div className="space-y-3">
              {question.questionType === 'single-choice' && (
                <RadioGroup
                  value={answer.answer as string}
                  onValueChange={(value) => handleAnswerChange(question._id, value)}
                >
                  {question.options.map((option, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                      <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                        {option.text}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              )}
              
              {question.questionType === 'multiple-choice' && (
                <div className="space-y-2">
                  {question.options.map((option, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Checkbox
                        id={`option-${index}`}
                        checked={(answer.answer as string[]).includes(index.toString())}
                        onCheckedChange={() => handleOptionSelect(index)}
                      />
                      <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                        {option.text}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
              
              {question.questionType === 'true-false' && (
                <RadioGroup
                  value={answer.answer as string}
                  onValueChange={(value) => handleAnswerChange(question._id, value)}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="true" id="true" />
                    <Label htmlFor="true" className="cursor-pointer">True</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="false" id="false" />
                    <Label htmlFor="false" className="cursor-pointer">False</Label>
                  </div>
                </RadioGroup>
              )}
              
              {question.questionType === 'numerical' && (
                <Input
                  type="number"
                  placeholder="Enter your answer"
                  value={answer.answer as string}
                  onChange={(e) => handleAnswerChange(question._id, e.target.value)}
                  className="max-w-xs"
                />
              )}
              
              {question.questionType === 'fill-in-blank' && (
                <Textarea
                  placeholder="Type your answer here"
                  value={answer.answer as string}
                  onChange={(e) => handleAnswerChange(question._id, e.target.value)}
                  rows={3}
                />
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Render question navigator
  const renderQuestionNavigator = () => {
    if (!testData) return null;

    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-sm">Question Navigator</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
            {testData.questions.map((question, index) => {
              const status = getQuestionStatus(question._id);
              const isCurrent = index === testState.currentQuestionIndex;
              
              return (
                <Button
                  key={question._id}
                  variant={isCurrent ? 'default' : 'outline'}
                  size="sm"
                  className={`h-10 w-10 p-0 ${
                    status === 'answered' ? 'bg-green-500 hover:bg-green-600 text-white' :
                    status === 'flagged' ? 'bg-yellow-500 hover:bg-yellow-600 text-white' :
                    status === 'visited' ? 'bg-blue-100 hover:bg-blue-200' :
                    'bg-gray-100 hover:bg-gray-200'
                  }`}
                  onClick={() => goToQuestion(index)}
                >
                  {index + 1}
                  {testState.answers[question._id]?.flagged && (
                    <Flag className="h-2 w-2 absolute -top-1 -right-1" />
                  )}
                </Button>
              );
            })}
          </div>
          
          <div className="flex justify-center space-x-4 mt-4 text-xs">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span>Answered</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-yellow-500 rounded"></div>
              <span>Flagged</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-blue-100 border rounded"></div>
              <span>Visited</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-gray-100 border rounded"></div>
              <span>Not Visited</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Render instructions dialog
  const renderInstructions = () => {
    if (!testData || !showInstructions) return null;

    return (
      <Dialog open={showInstructions} onOpenChange={setShowInstructions}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{testData.title}</DialogTitle>
            <DialogDescription>{testData.description}</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Duration:</strong> {testData.duration} minutes
              </div>
              <div>
                <strong>Total Marks:</strong> {testData.totalMarks}
              </div>
              <div>
                <strong>Questions:</strong> {testData.questions.length}
              </div>
              <div>
                <strong>Subject:</strong> {testData.subject}
              </div>
            </div>
            
            {testData.instructions && testData.instructions.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Instructions:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {testData.instructions.map((instruction, index) => (
                    <li key={index}>{instruction}</li>
                  ))}
                </ul>
              </div>
            )}
            
            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-medium mb-2">General Guidelines:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>You can navigate between questions using the question navigator</li>
                <li>Flag questions for review using the flag button</li>
                <li>Your progress is automatically saved every {autoSaveInterval} seconds</li>
                <li>Submit your test before time runs out</li>
                <li>Once submitted, you cannot make changes</li>
              </ul>
            </div>
          </div>
          
          <DialogFooter>
            <Button onClick={handleStartTest} className="w-full">
              Start Test
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading test...</p>
        </div>
      </div>
    );
  }

  if (error || !testData) {
    return (
      <Card className="p-8 border-destructive">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-destructive mb-2">Error Loading Test</h3>
          <p className="text-muted-foreground mb-4">{error || 'Test not found'}</p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  const currentQuestion = testData.questions[testState.currentQuestionIndex];
  const progress = calculateProgress();
  const timeWarning = testState.timeRemaining <= 300; // 5 minutes warning

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {renderInstructions()}
      
      {!showInstructions && (
        <>
          {/* Header with timer and progress */}
          <Card>
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-xl font-bold">{testData.title}</h1>
                  <p className="text-sm text-muted-foreground">
                    {testData.subject} • Class {testData.classNumber}
                  </p>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className={`text-2xl font-mono font-bold ${timeWarning ? 'text-red-500' : ''}`}>
                      <Clock className="inline h-5 w-5 mr-1" />
                      {formatTime(testState.timeRemaining)}
                    </div>
                    {timeWarning && (
                      <p className="text-xs text-red-500">Time running out!</p>
                    )}
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      Progress: {progress.answered}/{progress.total}
                    </div>
                    <Progress value={progress.percentage} className="w-20" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Question Navigator */}
          {renderQuestionNavigator()}

          {/* Current Question */}
          {currentQuestion && renderQuestion(currentQuestion)}

          {/* Navigation Controls */}
          <Card>
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <Button
                  variant="outline"
                  onClick={() => goToQuestion(testState.currentQuestionIndex - 1)}
                  disabled={testState.currentQuestionIndex === 0}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>
                
                <div className="flex space-x-2">
                  {onSave && (
                    <Button
                      variant="outline"
                      onClick={() => onSave(testState.answers)}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save Progress
                    </Button>
                  )}
                  
                  <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
                    <DialogTrigger asChild>
                      <Button variant="destructive">
                        Submit Test
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Submit Test</DialogTitle>
                        <DialogDescription>
                          Are you sure you want to submit your test? You cannot make changes after submission.
                        </DialogDescription>
                      </DialogHeader>
                      
                      <div className="space-y-2">
                        <p><strong>Answered:</strong> {progress.answered}/{progress.total} questions</p>
                        <p><strong>Time Remaining:</strong> {formatTime(testState.timeRemaining)}</p>
                        {progress.answered < progress.total && (
                          <p className="text-yellow-600">
                            ⚠️ You have {progress.total - progress.answered} unanswered questions.
                          </p>
                        )}
                      </div>
                      
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowSubmitDialog(false)}>
                          Continue Test
                        </Button>
                        <Button variant="destructive" onClick={handleSubmit}>
                          Submit Final Answer
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
                
                <Button
                  onClick={() => goToQuestion(testState.currentQuestionIndex + 1)}
                  disabled={testState.currentQuestionIndex === testData.questions.length - 1}
                >
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}