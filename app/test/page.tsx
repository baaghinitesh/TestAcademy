'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { FileCheck, Users, Clock, Trophy, TrendingUp, ArrowRight, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function TestPage() {
  const searchParams = useSearchParams();
  const selectedClass = searchParams.get('class');
  
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const classes = [
    { 
      number: 5, 
      title: 'Class 5', 
      description: 'Foundation Testing',
      color: 'bg-blue-500',
      tests: 24,
      subjects: ['Mathematics', 'Science', 'English', 'Social Studies', 'Hindi'],
      avgScore: 78,
      completedTests: 18,
      totalQuestions: 480
    },
    { 
      number: 6, 
      title: 'Class 6', 
      description: 'Conceptual Assessment',
      color: 'bg-green-500',
      tests: 28,
      subjects: ['Mathematics', 'Science', 'English', 'Social Studies', 'Hindi'],
      avgScore: 82,
      completedTests: 21,
      totalQuestions: 560
    },
    { 
      number: 7, 
      title: 'Class 7', 
      description: 'Knowledge Evaluation',
      color: 'bg-yellow-500',
      tests: 32,
      subjects: ['Mathematics', 'Science', 'English', 'Social Studies', 'Hindi'],
      avgScore: 75,
      completedTests: 24,
      totalQuestions: 640
    },
    { 
      number: 8, 
      title: 'Class 8', 
      description: 'Advanced Testing',
      color: 'bg-orange-500',
      tests: 36,
      subjects: ['Mathematics', 'Science', 'English', 'Social Studies', 'Hindi'],
      avgScore: 79,
      completedTests: 28,
      totalQuestions: 720
    },
    { 
      number: 9, 
      title: 'Class 9', 
      description: 'Preparation Assessment',
      color: 'bg-purple-500',
      tests: 42,
      subjects: ['Mathematics', 'Science', 'English', 'Social Studies', 'Hindi'],
      avgScore: 73,
      completedTests: 32,
      totalQuestions: 840
    },
    { 
      number: 10, 
      title: 'Class 10', 
      description: 'Board Exam Practice',
      color: 'bg-red-500',
      tests: 48,
      subjects: ['Mathematics', 'Science', 'English', 'Social Studies', 'Hindi'],
      avgScore: 81,
      completedTests: 36,
      totalQuestions: 960
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header Section */}
      <section className="bg-gradient-to-r from-primary/10 to-secondary/10 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
                <FileCheck className="h-8 w-8 text-primary-foreground" />
              </div>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Practice Tests
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Comprehensive testing platform with timed assessments, instant feedback, and detailed performance analytics
            </p>

            {user && user.role === 'student' && (
              <div className="flex items-center justify-center space-x-4 mb-4">
                <Badge variant="secondary" className="flex items-center">
                  <Users className="w-4 h-4 mr-1" />
                  Student • Class {user.class}
                </Badge>
                <Badge variant="outline" className="flex items-center">
                  <Trophy className="w-4 h-4 mr-1" />
                  {classes.find(c => c.number === user.class)?.completedTests || 0} Tests Completed
                </Badge>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Quick Stats */}
      {user && user.role === 'student' && (
        <section className="py-8 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-primary">
                      {classes.find(c => c.number === user.class)?.completedTests || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Tests Completed</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {classes.find(c => c.number === user.class)?.avgScore || 0}%
                    </div>
                    <div className="text-sm text-muted-foreground">Average Score</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {classes.find(c => c.number === user.class)?.tests || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Available Tests</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {classes.find(c => c.number === user.class)?.totalQuestions || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Questions</div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Class Selection */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Select Your Class
            </h2>
            <p className="text-xl text-muted-foreground">
              Choose your class to access relevant practice tests and assessments
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {classes.map((classItem) => (
              <Link key={classItem.number} href={`/test/${classItem.number}`}>
                <Card className={`group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 ${
                  selectedClass === classItem.number.toString() ? 'ring-2 ring-primary' : ''
                } ${
                  user?.role === 'student' && user?.class === classItem.number ? 'border-primary' : ''
                }`}>
                  <CardHeader className="text-center">
                    <div className={`w-16 h-16 ${classItem.color} rounded-full flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                      {classItem.number}
                    </div>
                    <CardTitle className="text-2xl">{classItem.title}</CardTitle>
                    <CardDescription className="text-lg">
                      {classItem.description}
                    </CardDescription>
                    
                    {user?.role === 'student' && user?.class === classItem.number && (
                      <Badge variant="secondary" className="mx-auto">
                        Your Class
                      </Badge>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div className="bg-muted rounded-lg p-3">
                        <div className="font-bold text-lg">{classItem.tests}</div>
                        <div className="text-xs text-muted-foreground">Tests</div>
                      </div>
                      <div className="bg-muted rounded-lg p-3">
                        <div className="font-bold text-lg">{classItem.subjects.length}</div>
                        <div className="text-xs text-muted-foreground">Subjects</div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progress:</span>
                        <span className="font-medium">{classItem.completedTests}/{classItem.tests}</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${(classItem.completedTests / classItem.tests) * 100}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center text-green-600">
                        <TrendingUp className="w-4 h-4 mr-1" />
                        Avg: {classItem.avgScore}%
                      </div>
                      <div className="flex items-center text-muted-foreground">
                        <Clock className="w-4 h-4 mr-1" />
                        {classItem.totalQuestions} Questions
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-1 justify-center">
                      {classItem.subjects.slice(0, 3).map((subject) => (
                        <Badge key={subject} variant="outline" className="text-xs">
                          {subject}
                        </Badge>
                      ))}
                      {classItem.subjects.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{classItem.subjects.length - 3} more
                        </Badge>
                      )}
                    </div>
                    
                    <Button className="w-full group-hover:bg-primary group-hover:text-primary-foreground">
                      Start Testing
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Tests (for logged in users) */}
      {user && (
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
                Recent Test Activity
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Mathematics Quiz</CardTitle>
                      <Badge variant="secondary">Class 8</Badge>
                    </div>
                    <CardDescription>Algebra & Geometry • 20 Questions</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm font-medium">Completed</span>
                      </div>
                      <div className="text-lg font-bold text-green-600">85%</div>
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Completed: 2 hours ago</span>
                      <div className="flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        15 minutes
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Science Practice</CardTitle>
                      <Badge variant="secondary">Class 8</Badge>
                    </div>
                    <CardDescription>Physics & Chemistry • 25 Questions</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm font-medium">Completed</span>
                      </div>
                      <div className="text-lg font-bold text-blue-600">92%</div>
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Completed: 1 day ago</span>
                      <div className="flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        20 minutes
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="text-center mt-8">
                <Link href="/dashboard">
                  <Button variant="outline">
                    View All Test Results
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Testing Features */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-8">Why Practice with EduTest?</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold mb-2">Timed Practice</h3>
                  <p className="text-sm text-muted-foreground">
                    Real exam conditions with accurate timing and auto-submit
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="font-semibold mb-2">Instant Analysis</h3>
                  <p className="text-sm text-muted-foreground">
                    Detailed performance reports with strengths and improvements
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Trophy className="w-6 h-6 text-purple-600" />
                  </div>
                  <h3 className="font-semibold mb-2">Progress Tracking</h3>
                  <p className="text-sm text-muted-foreground">
                    Monitor improvement over time with comprehensive dashboards
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}