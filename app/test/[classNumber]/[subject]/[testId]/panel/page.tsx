'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Clock, 
  Flag, 
  ChevronLeft, 
  ChevronRight, 
  Grid3x3,
  AlertTriangle,
  CheckCircle,
  X,
  Monitor,
  Save
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

export default function TestPanelPage() {
  const params = useParams();
  const router = useRouter();
  const classNumber = params.classNumber as string;
  const subject = params.subject as string;
  const testId = params.testId as string;
  
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(new Set());
  const [timeRemaining, setTimeRemaining] = useState(30 * 60); // 30 minutes in seconds
  const [showQuestionGrid, setShowQuestionGrid] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');

  // Sample test data
  const test = {
    id: testId,
    title: 'Basic Algebra Fundamentals',
    duration: 30,
    questions: [
      {
        id: 1,
        question: 'What is the value of x in the equation: 2x + 5 = 15?',
        options: ['x = 3', 'x = 5', 'x = 7', 'x = 10'],
        correctAnswer: 'x = 5',
      },
      {
        id: 2,
        question: 'Simplify the expression: 3(x + 4) - 2x',
        options: ['x + 12', '5x + 12', 'x + 4', '3x + 10'],
        correctAnswer: 'x + 12',
      },
      {
        id: 3,
        question: 'If y = 2x - 3 and x = 4, what is the value of y?',
        options: ['y = 5', 'y = 7', 'y = 8', 'y = 11'],
        correctAnswer: 'y = 5',
      },
      {
        id: 4,
        question: 'Which of the following is equivalent to 4(2x - 1)?',
        options: ['6x - 4', '8x - 4', '8x - 1', '4x - 4'],
        correctAnswer: '8x - 4',
      },
      {
        id: 5,
        question: 'Solve for x: x/3 + 2 = 8',
        options: ['x = 6', 'x = 12', 'x = 18', 'x = 24'],
        correctAnswer: 'x = 18',
      },
      // Add more questions for demonstration
      ...Array.from({ length: 10 }, (_, i) => ({
        id: i + 6,
        question: `Sample question ${i + 6}: This is a placeholder question for demonstration purposes.`,
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
        correctAnswer: 'Option A',
      }))
    ]
  };

  // Timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          handleSubmitTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Auto-save effect
  useEffect(() => {
    const autoSave = setInterval(() => {
      setAutoSaveStatus('saving');
      // Simulate API call
      setTimeout(() => {
        setAutoSaveStatus('saved');
      }, 1000);
    }, 30000); // Auto-save every 30 seconds

    return () => clearInterval(autoSave);
  }, [answers]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleAnswerSelect = useCallback((questionIndex: number, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionIndex]: answer
    }));
  }, []);

  const handleQuestionFlag = useCallback((questionIndex: number) => {
    setFlaggedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionIndex)) {
        newSet.delete(questionIndex);
      } else {
        newSet.add(questionIndex);
      }
      return newSet;
    });
  }, []);

  const handleSubmitTest = useCallback(() => {
    const totalQuestions = test.questions.length;
    const answeredQuestions = Object.keys(answers).length;
    
    if (answeredQuestions < totalQuestions) {
      const unanswered = totalQuestions - answeredQuestions;
      if (!confirm(`You have ${unanswered} unanswered questions. Are you sure you want to submit?`)) {
        return;
      }
    }

    // Calculate results
    let correctCount = 0;
    test.questions.forEach((question, index) => {
      if (answers[index] === question.correctAnswer) {
        correctCount++;
      }
    });

    const score = Math.round((correctCount / totalQuestions) * 100);
    
    // Navigate to results
    router.push(`/test/${classNumber}/${subject}/${testId}/results?score=${score}&answered=${answeredQuestions}&total=${totalQuestions}`);
  }, [answers, classNumber, subject, testId, router, test.questions]);

  const getQuestionStatus = (index: number): 'answered' | 'flagged' | 'unanswered' => {
    if (answers[index]) return 'answered';
    if (flaggedQuestions.has(index)) return 'flagged';
    return 'unanswered';
  };

  const getStatusColor = (status: 'current' | 'answered' | 'flagged' | 'unanswered'): string => {
    switch (status) {
      case 'current': return 'bg-blue-600 text-white';
      case 'answered': return 'bg-green-100 text-green-700 border border-green-200';
      case 'flagged': return 'bg-orange-100 text-orange-700 border border-orange-200';
      default: return 'bg-gray-100 text-gray-600 hover:bg-gray-200';
    }
  };

  const answeredCount = Object.keys(answers).length;
  const flaggedCount = flaggedQuestions.size;
  const unansweredCount = test.questions.length - answeredCount;

  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Mobile-Responsive Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-3 sm:px-4 py-2 sm:py-3 flex-shrink-0">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center space-x-2 flex-1 min-w-0">
            <div className="flex items-center space-x-2 truncate">
              <Monitor className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
              <span className="font-medium text-sm sm:text-base truncate">{test.title}</span>
            </div>
            <Badge variant="outline" className="text-xs sm:text-sm flex-shrink-0 px-2 py-1">
              {currentQuestion + 1}/{test.questions.length}
            </Badge>
          </div>

          <div className="flex items-center space-x-1 sm:space-x-3 flex-shrink-0">
            {/* Auto-save status - Hidden on mobile */}
            <div className="hidden lg:flex items-center space-x-2 text-sm">
              <Save className={`w-4 h-4 ${autoSaveStatus === 'saving' ? 'animate-spin' : ''}`} />
              <span className="text-muted-foreground">
                {autoSaveStatus === 'saved' && 'Auto-saved'}
                {autoSaveStatus === 'saving' && 'Saving...'}  
                {autoSaveStatus === 'error' && 'Save failed'}
              </span>
            </div>

            {/* Timer */}
            <div className={`flex items-center space-x-1 px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm ${
              timeRemaining < 300 ? 'bg-red-100 text-red-800' : 'bg-muted'
            }`}>
              <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="font-mono font-medium">
                {formatTime(timeRemaining)}
              </span>
            </div>

            {/* Question Grid Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowQuestionGrid(!showQuestionGrid)}
              className="hidden sm:flex px-2 sm:px-3"
            >
              <Grid3x3 className="w-4 h-4 mr-0 sm:mr-1" />
              <span className="hidden md:inline">Questions</span>
            </Button>
            
            {/* Mobile Question Grid Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowQuestionGrid(!showQuestionGrid)}
              className="sm:hidden p-2"
            >
              <Grid3x3 className="w-4 h-4" />
            </Button>

            {/* Submit Button */}
            <Button 
              onClick={handleSubmitTest}
              className="bg-green-600 hover:bg-green-700 text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2"
              size="sm"
            >
              <span className="hidden sm:inline">Submit</span>
              <span className="sm:hidden">End</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Mobile-Responsive Question Grid Sidebar */}
        {showQuestionGrid && (
          <div className="w-full sm:w-80 border-r bg-muted/30 p-3 sm:p-4 overflow-y-auto">
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between sm:block">
                <h3 className="font-semibold mb-0 sm:mb-3 text-sm sm:text-base">Questions</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowQuestionGrid(false)}
                  className="sm:hidden p-1"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <div>
                <div className="grid grid-cols-6 sm:grid-cols-5 gap-1 sm:gap-2">
                  {test.questions.map((_, index) => {
                    const status = index === currentQuestion ? 'current' : getQuestionStatus(index);
                    return (
                      <button
                        key={index}
                        onClick={() => setCurrentQuestion(index)}
                        className={`w-8 h-8 sm:w-10 sm:h-10 rounded text-xs sm:text-sm font-medium transition-colors ${getStatusColor(status)}`}
                      >
                        {index + 1}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2 sm:space-y-3">
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="flex items-center">
                    <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded mr-1 sm:mr-2"></div>
                    <span className="hidden sm:inline">Answered</span>
                    <span className="sm:hidden">Ans</span>
                  </span>
                  <span className="font-medium">{answeredCount}</span>
                </div>
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="flex items-center">
                    <div className="w-2 h-2 sm:w-3 sm:h-3 bg-yellow-500 rounded mr-1 sm:mr-2"></div>
                    <span className="hidden sm:inline">Flagged</span>
                    <span className="sm:hidden">Flag</span>
                  </span>
                  <span className="font-medium">{flaggedCount}</span>
                </div>
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="flex items-center">
                    <div className="w-2 h-2 sm:w-3 sm:h-3 bg-gray-200 rounded mr-1 sm:mr-2"></div>
                    <span className="hidden sm:inline">Unanswered</span>
                    <span className="sm:hidden">Not</span>
                  </span>
                  <span className="font-medium">{unansweredCount}</span>
                </div>
              </div>

              {flaggedQuestions.size > 0 && (
                <div>
                  <h4 className="font-medium text-xs sm:text-sm text-muted-foreground mb-2">Flagged</h4>
                  <div className="flex flex-wrap gap-1">
                    {Array.from(flaggedQuestions).map(index => (
                      <button
                        key={index}
                        onClick={() => setCurrentQuestion(index)}
                        className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded"
                      >
                        {index + 1}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Main Question Area */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 p-3 sm:p-6 overflow-y-auto">
            <div className="max-w-4xl mx-auto">
              <Card className="shadow-sm">
                <CardHeader className="p-3 sm:p-6">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg sm:text-xl">
                      Question {currentQuestion + 1}
                    </CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuestionFlag(currentQuestion)}
                      className={`${flaggedQuestions.has(currentQuestion) ? 'bg-yellow-100 text-yellow-800' : ''} p-2 sm:px-3 sm:py-2`}
                    >
                      <Flag className="w-4 h-4 mr-0 sm:mr-1" />
                      <span className="hidden sm:inline">
                        {flaggedQuestions.has(currentQuestion) ? 'Flagged' : 'Flag'}
                      </span>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 sm:space-y-6 p-3 sm:p-6">
                  <div className="text-base sm:text-lg leading-relaxed">
                    {test.questions[currentQuestion].question}
                  </div>

                  <RadioGroup
                    value={answers[currentQuestion] || ''}
                    onValueChange={(value) => handleAnswerSelect(currentQuestion, value)}
                    className="space-y-3 sm:space-y-4"
                  >
                    {test.questions[currentQuestion].options.map((option, index) => (
                      <div key={index} className="flex items-center space-x-3 p-3 sm:p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                        <RadioGroupItem value={option} id={`option-${index}`} className="shrink-0" />
                        <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer text-sm sm:text-base leading-relaxed">
                          {option}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Navigation Footer */}
          <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-3 sm:p-4 flex-shrink-0">
            <div className="max-w-4xl mx-auto">
              {/* Mobile Progress Bar */}
              <div className="sm:hidden mb-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                  <span>{answeredCount} answered</span>
                  <span>{currentQuestion + 1} / {test.questions.length}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${((currentQuestion + 1) / test.questions.length) * 100}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                  disabled={currentQuestion === 0}
                  className="px-3 sm:px-4 py-2"
                  size="sm"
                >
                  <ChevronLeft className="w-4 h-4 mr-0 sm:mr-1" />
                  <span className="hidden sm:inline">Previous</span>
                  <span className="sm:hidden">Prev</span>
                </Button>

                <div className="hidden sm:flex items-center space-x-4">
                  <span className="text-sm text-muted-foreground">
                    {answeredCount} of {test.questions.length} answered
                  </span>
                  {!answers[currentQuestion] && (
                    <Badge variant="secondary" className="flex items-center">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      Not answered
                    </Badge>
                  )}
                  {answers[currentQuestion] && (
                    <Badge variant="secondary" className="flex items-center bg-green-100 text-green-800">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Answered
                    </Badge>
                  )}
                </div>

                {/* Mobile Status Badge */}
                <div className="sm:hidden">
                  {!answers[currentQuestion] && (
                    <Badge variant="secondary" className="flex items-center text-xs px-2 py-1">
                      <AlertTriangle className="w-3 h-3" />
                    </Badge>
                  )}
                  {answers[currentQuestion] && (
                    <Badge variant="secondary" className="flex items-center bg-green-100 text-green-800 text-xs px-2 py-1">
                      <CheckCircle className="w-3 h-3" />
                    </Badge>
                  )}
                </div>

                <Button
                  onClick={() => setCurrentQuestion(Math.min(test.questions.length - 1, currentQuestion + 1))}
                  disabled={currentQuestion === test.questions.length - 1}
                  className="px-3 sm:px-4 py-2"
                  size="sm"
                >
                  <span className="hidden sm:inline">Next</span>
                  <span className="sm:hidden">Next</span>
                  <ChevronRight className="w-4 h-4 ml-0 sm:ml-1" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}