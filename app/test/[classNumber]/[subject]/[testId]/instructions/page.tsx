'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Clock, 
  FileCheck, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Timer,
  BookOpen,
  Target,
  Shield,
  Play
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

export default function TestInstructionsPage() {
  const params = useParams();
  const router = useRouter();
  const classNumber = params.classNumber as string;
  const subject = params.subject as string;
  const testId = params.testId as string;
  
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [test, setTest] = useState<any>(null);
  const [agreementChecked, setAgreementChecked] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const userData = await response.json();
          setUser(userData.user);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };

    fetchUser();
  }, []);

  useEffect(() => {
    // Simulate fetching test data
    const fetchTest = async () => {
      try {
        // In a real app, this would be an API call
        const sampleTests = [
          {
            id: '1',
            title: 'Basic Algebra Fundamentals',
            description: 'Test your understanding of algebraic expressions, equations, and basic operations',
            duration: 30,
            questions: 15,
            difficulty: 'Beginner',
            topic: 'Algebra',
            status: 'completed',
            score: 88,
            attempts: 2,
            lastAttempt: '2024-01-20',
            maxAttempts: 3,
            passingScore: 60,
            tags: ['expressions', 'equations', 'variables'],
            instructions: [
              'Read each question carefully before selecting your answer',
              'You can navigate between questions using the Previous/Next buttons',
              'Questions can be flagged for review and revisited later',
              'Your progress is automatically saved every 30 seconds',
              'Submit your test before the timer runs out to avoid auto-submission'
            ],
            topics: [
              'Linear equations and inequalities',
              'Algebraic expressions and simplification',
              'Variable substitution and evaluation',
              'Word problems involving algebra'
            ]
          },
          {
            id: '2',
            title: 'Geometry Shapes and Angles',
            description: 'Comprehensive test on geometric shapes, angles, and their properties',
            duration: 45,
            questions: 20,
            difficulty: 'Intermediate',
            topic: 'Geometry',
            status: 'completed',
            score: 72,
            attempts: 1,
            maxAttempts: 3,
            passingScore: 65,
            tags: ['shapes', 'angles', 'properties']
          }
        ];

        const foundTest = sampleTests.find(t => t.id === testId);
        if (foundTest) {
          setTest(foundTest);
        } else {
          // Default test for demo
          setTest({
            id: testId,
            title: 'Sample Test',
            description: 'This is a sample test for demonstration purposes',
            duration: 30,
            questions: 15,
            difficulty: 'Beginner',
            topic: 'General',
            status: 'not_started',
            attempts: 0,
            maxAttempts: 3,
            passingScore: 60,
            tags: ['sample', 'demo'],
            instructions: [
              'Read each question carefully before selecting your answer',
              'You can navigate between questions using the Previous/Next buttons',
              'Questions can be flagged for review and revisited later',
              'Your progress is automatically saved every 30 seconds',
              'Submit your test before the timer runs out to avoid auto-submission'
            ],
            topics: [
              'Sample topic 1',
              'Sample topic 2',
              'Sample topic 3'
            ]
          });
        }
      } catch (error) {
        console.error('Error fetching test:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTest();
  }, [testId]);

  const subjectInfo = {
    'mathematics': { name: 'Mathematics', icon: '📐' },
    'science': { name: 'Science', icon: '🔬' },
    'english': { name: 'English', icon: '📚' },
    'social-studies': { name: 'Social Studies', icon: '🌍' },
    'hindi': { name: 'Hindi', icon: '🇮🇳' }
  };

  const currentSubject = subjectInfo[subject as keyof typeof subjectInfo];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-green-100 text-green-800';
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'Advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleStartTest = () => {
    if (!agreementChecked) {
      alert('Please read and agree to the test terms before starting.');
      return;
    }
    router.push(`/test/${classNumber}/${subject}/${testId}/panel`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!test || !currentSubject) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Test Not Found</h1>
          <Link href={`/test/${classNumber}/${subject}`}>
            <Button>Back to {currentSubject?.name || 'Subject'}</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href={`/test/${classNumber}/${subject}`}>
                <Button variant="outline" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Back to Tests
                </Button>
              </Link>
              
              <div className="hidden md:flex items-center space-x-2 text-sm text-muted-foreground">
                <span>Class {classNumber}</span>
                <span>•</span>
                <span>{currentSubject.name}</span>
                <span>•</span>
                <span>Test Instructions</span>
              </div>
            </div>

            <Badge variant="outline" className="flex items-center">
              <FileCheck className="w-4 h-4 mr-1" />
              {test.topic}
            </Badge>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Test Overview */}
              <Card>
                <CardHeader>
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="text-3xl">{currentSubject.icon}</div>
                    <div>
                      <CardTitle className="text-2xl">{test.title}</CardTitle>
                      <CardDescription className="text-base mt-1">
                        {test.description}
                      </CardDescription>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <Badge className={`${getDifficultyColor(test.difficulty)}`}>
                      {test.difficulty}
                    </Badge>
                    <Badge variant="outline">{test.topic}</Badge>
                    {test.attempts > 0 && (
                      <Badge variant="secondary">
                        Attempt {test.attempts + 1}/{test.maxAttempts}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
              </Card>

              {/* Test Details */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <FileCheck className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="font-bold text-lg">{test.questions}</div>
                    <div className="text-sm text-muted-foreground">Questions</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Clock className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="font-bold text-lg">{test.duration}</div>
                    <div className="text-sm text-muted-foreground">Minutes</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Target className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="font-bold text-lg">{test.passingScore}%</div>
                    <div className="text-sm text-muted-foreground">Passing</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Shield className="w-5 h-5 text-orange-600" />
                    </div>
                    <div className="font-bold text-lg">{test.maxAttempts}</div>
                    <div className="text-sm text-muted-foreground">Max Attempts</div>
                  </CardContent>
                </Card>
              </div>

              {/* Instructions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BookOpen className="w-5 h-5 mr-2" />
                    Test Instructions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {test.instructions?.map((instruction: string, index: number) => (
                      <div key={index} className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-sm font-medium text-primary mt-0.5">
                          {index + 1}
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {instruction}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Topics Covered */}
              {test.topics && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Topics Covered</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {test.topics.map((topic: string, index: number) => (
                        <div key={index} className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-sm">{topic}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Terms Agreement */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="agreement"
                      checked={agreementChecked}
                      onCheckedChange={(checked) => setAgreementChecked(checked as boolean)}
                      className="mt-1"
                    />
                    <label htmlFor="agreement" className="text-sm leading-relaxed cursor-pointer">
                      I understand and agree to the test terms. I will not use any external resources, 
                      discuss questions with others, or engage in any form of academic dishonesty. 
                      I understand that my session will be monitored and any violations may result 
                      in test termination and score invalidation.
                    </label>
                  </div>
                </CardContent>
              </Card>

              {/* Start Test Button */}
              <div className="flex justify-center">
                <Button 
                  size="lg" 
                  onClick={handleStartTest}
                  disabled={!agreementChecked}
                  className="px-8 py-3"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Start Test
                </Button>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Warning Card */}
              <Card className="border-orange-200 bg-orange-50">
                <CardHeader>
                  <CardTitle className="text-orange-800 flex items-center">
                    <AlertTriangle className="w-5 h-5 mr-2" />
                    Important Notice
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-orange-700">
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start space-x-2">
                      <Timer className="w-4 h-4 mt-0.5" />
                      <span>Timer starts immediately when you begin</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <XCircle className="w-4 h-4 mt-0.5" />
                      <span>Test will auto-submit when time expires</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <Shield className="w-4 h-4 mt-0.5" />
                      <span>Session monitoring is active</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* Previous Attempts */}
              {test.attempts > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Previous Attempts</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Array.from({ length: test.attempts }, (_, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <div>
                            <div className="font-medium">Attempt {i + 1}</div>
                            <div className="text-sm text-muted-foreground">
                              {test.lastAttempt && i === test.attempts - 1 
                                ? new Date(test.lastAttempt).toLocaleDateString()
                                : 'Previous attempt'
                              }
                            </div>
                          </div>
                          {test.score !== null && i === test.attempts - 1 && (
                            <div className="text-lg font-bold text-primary">
                              {test.score}%
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Test Tips */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Test Tips</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                      <span>Read questions carefully before answering</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                      <span>Flag difficult questions for later review</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                      <span>Manage your time effectively</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                      <span>Review flagged questions before submitting</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}