'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { FileCheck, Clock, Users, TrendingUp, ArrowLeft, Target, Award, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function ClassTestPage() {
  const params = useParams();
  const classNumber = params.classNumber as string;
  
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

  const classInfo = {
    5: { title: 'Class 5', description: 'Foundation Testing', color: 'bg-blue-500' },
    6: { title: 'Class 6', description: 'Conceptual Assessment', color: 'bg-green-500' },
    7: { title: 'Class 7', description: 'Knowledge Evaluation', color: 'bg-yellow-500' },
    8: { title: 'Class 8', description: 'Advanced Testing', color: 'bg-orange-500' },
    9: { title: 'Class 9', description: 'Preparation Assessment', color: 'bg-purple-500' },
    10: { title: 'Class 10', description: 'Board Exam Practice', color: 'bg-red-500' }
  };

  const subjects = [
    {
      name: 'Mathematics',
      description: 'Algebra, Geometry, Arithmetic, and Problem Solving',
      icon: '📐',
      tests: 12,
      questions: 240,
      avgTime: '45 min',
      difficulty: 'Mixed',
      color: 'from-blue-500 to-blue-600',
      completedTests: 8,
      avgScore: 82,
      lastScore: 88,
      topics: ['Algebra', 'Geometry', 'Statistics', 'Trigonometry']
    },
    {
      name: 'Science',
      description: 'Physics, Chemistry, Biology, and Practical Applications',
      icon: '🔬',
      tests: 10,
      questions: 200,
      avgTime: '40 min',
      difficulty: 'Mixed',
      color: 'from-green-500 to-green-600',
      completedTests: 7,
      avgScore: 78,
      lastScore: 85,
      topics: ['Physics', 'Chemistry', 'Biology', 'Lab Work']
    },
    {
      name: 'English',
      description: 'Grammar, Literature, Reading, and Writing Skills',
      icon: '📚',
      tests: 8,
      questions: 160,
      avgTime: '35 min',
      difficulty: 'Beginner to Advanced',
      color: 'from-purple-500 to-purple-600',
      completedTests: 6,
      avgScore: 85,
      lastScore: 91,
      topics: ['Grammar', 'Literature', 'Comprehension', 'Writing']
    },
    {
      name: 'Social Studies',
      description: 'History, Geography, Civics, and Current Affairs',
      icon: '🌍',
      tests: 9,
      questions: 180,
      avgTime: '38 min',
      difficulty: 'Mixed',
      color: 'from-orange-500 to-orange-600',
      completedTests: 5,
      avgScore: 76,
      lastScore: 79,
      topics: ['History', 'Geography', 'Civics', 'Economics']
    },
    {
      name: 'Hindi',
      description: 'Language, Literature, Grammar, and Composition',
      icon: '🇮🇳',
      tests: 7,
      questions: 140,
      avgTime: '30 min',
      difficulty: 'Beginner to Intermediate',
      color: 'from-red-500 to-red-600',
      completedTests: 4,
      avgScore: 80,
      lastScore: 83,
      topics: ['व्याकरण', 'साहित्य', 'गद्य', 'पद्य']
    }
  ];

  const currentClass = classInfo[parseInt(classNumber) as keyof typeof classInfo];

  const getDifficultyColor = (difficulty: string) => {
    if (difficulty.includes('Mixed')) return 'bg-yellow-100 text-yellow-800';
    if (difficulty.includes('Advanced')) return 'bg-red-100 text-red-800';
    return 'bg-green-100 text-green-800';
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-blue-600';
    if (score >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!currentClass) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Class Not Found</h1>
          <Link href="/test">
            <Button>Back to Tests</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header Section */}
      <section className={`bg-gradient-to-r ${currentClass.color} to-opacity-80 py-16 text-white`}>
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center mb-6">
              <Link href="/test">
                <Button variant="outline" size="sm" className="text-white border-white hover:bg-white hover:text-foreground mr-4">
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Back
                </Button>
              </Link>
              
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mr-4">
                <span className="text-2xl font-bold">{classNumber}</span>
              </div>
              
              <div>
                <h1 className="text-3xl md:text-4xl font-bold">{currentClass.title} Tests</h1>
                <p className="text-xl opacity-90">{currentClass.description}</p>
              </div>
            </div>

            {user && user.role === 'student' && user.class.toString() === classNumber && (
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                <Users className="w-4 h-4 mr-1" />
                Your Class
              </Badge>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
              <div className="bg-white/10 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold">{subjects.length}</div>
                <div className="text-sm opacity-80">Subjects</div>
              </div>
              <div className="bg-white/10 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold">{subjects.reduce((sum, s) => sum + s.tests, 0)}</div>
                <div className="text-sm opacity-80">Total Tests</div>
              </div>
              <div className="bg-white/10 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold">{subjects.reduce((sum, s) => sum + s.questions, 0)}</div>
                <div className="text-sm opacity-80">Total Questions</div>
              </div>
              <div className="bg-white/10 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold">{Math.round(subjects.reduce((sum, s) => sum + s.avgScore, 0) / subjects.length)}%</div>
                <div className="text-sm opacity-80">Avg Performance</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Subjects Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Choose a Subject
              </h2>
              <p className="text-xl text-muted-foreground">
                Select a subject to view available tests and practice assessments
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {subjects.map((subject) => (
                <Link key={subject.name} href={`/test/${classNumber}/${subject.name.toLowerCase().replace(' ', '-')}`}>
                  <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 h-full">
                    <CardHeader className="text-center pb-4">
                      <div className={`w-20 h-20 bg-gradient-to-br ${subject.color} rounded-full flex items-center justify-center text-white text-3xl mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                        {subject.icon}
                      </div>
                      <CardTitle className="text-2xl group-hover:text-primary transition-colors">
                        {subject.name}
                      </CardTitle>
                      <CardDescription className="text-base">
                        {subject.description}
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div className="bg-muted rounded-lg p-3">
                          <div className="font-bold text-lg">{subject.tests}</div>
                          <div className="text-sm text-muted-foreground">Tests</div>
                        </div>
                        <div className="bg-muted rounded-lg p-3">
                          <div className="font-bold text-lg">{subject.questions}</div>
                          <div className="text-sm text-muted-foreground">Questions</div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Progress:</span>
                          <span className="font-medium">{subject.completedTests}/{subject.tests}</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${(subject.completedTests / subject.tests) * 100}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="text-center">
                          <div className={`font-bold text-lg ${getScoreColor(subject.avgScore)}`}>
                            {subject.avgScore}%
                          </div>
                          <div className="text-muted-foreground">Avg Score</div>
                        </div>
                        <div className="text-center">
                          <div className={`font-bold text-lg ${getScoreColor(subject.lastScore)}`}>
                            {subject.lastScore}%
                          </div>
                          <div className="text-muted-foreground">Last Score</div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center text-muted-foreground">
                          <Clock className="w-4 h-4 mr-1" />
                          {subject.avgTime}
                        </div>
                        <Badge className={`text-xs ${getDifficultyColor(subject.difficulty)}`}>
                          {subject.difficulty}
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        <div className="text-sm font-medium text-muted-foreground">Topics Covered:</div>
                        <div className="flex flex-wrap gap-1">
                          {subject.topics.slice(0, 3).map((topic) => (
                            <Badge key={topic} variant="outline" className="text-xs">
                              {topic}
                            </Badge>
                          ))}
                          {subject.topics.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{subject.topics.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>

                      <Button className="w-full group-hover:bg-primary group-hover:text-primary-foreground">
                        <FileCheck className="mr-2 h-4 w-4" />
                        View Tests
                      </Button>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Performance Overview */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">Performance Overview</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Target className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="font-semibold mb-2">Strong Areas</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    English and Mathematics showing excellent progress
                  </p>
                  <div className="text-2xl font-bold text-green-600">85%+</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="w-6 h-6 text-orange-600" />
                  </div>
                  <h3 className="font-semibold mb-2">Improvement Areas</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    Social Studies needs more practice
                  </p>
                  <div className="text-2xl font-bold text-orange-600">76%</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Award className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold mb-2">Overall Grade</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    Consistent performance across subjects
                  </p>
                  <div className="text-2xl font-bold text-blue-600">B+</div>
                </CardContent>
              </Card>
            </div>
            
            <div className="text-center mt-8">
              <Link href="/dashboard">
                <Button variant="outline">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  View Detailed Analytics
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}