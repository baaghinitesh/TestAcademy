'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { FileCheck, Clock, Users, TrendingUp, ArrowLeft, Search, Filter, Play, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

export default function SubjectTestPage() {
  const params = useParams();
  const classNumber = params.classNumber as string;
  const subject = params.subject as string;
  
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

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

  const subjectInfo = {
    'mathematics': {
      name: 'Mathematics',
      icon: '📐',
      color: 'from-blue-500 to-blue-600',
      description: 'Algebra, Geometry, Arithmetic, and Problem Solving'
    },
    'science': {
      name: 'Science',
      icon: '🔬',
      color: 'from-green-500 to-green-600',
      description: 'Physics, Chemistry, Biology, and Practical Applications'
    },
    'english': {
      name: 'English',
      icon: '📚',
      color: 'from-purple-500 to-purple-600',
      description: 'Grammar, Literature, Reading, and Writing Skills'
    },
    'social-studies': {
      name: 'Social Studies',
      icon: '🌍',
      color: 'from-orange-500 to-orange-600',
      description: 'History, Geography, Civics, and Current Affairs'
    },
    'hindi': {
      name: 'Hindi',
      icon: '🇮🇳',
      color: 'from-red-500 to-red-600',
      description: 'Language, Literature, Grammar, and Composition'
    }
  };

  // Sample test data
  const tests = [
    {
      id: 1,
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
      tags: ['expressions', 'equations', 'variables']
    },
    {
      id: 2,
      title: 'Geometry Shapes and Angles',
      description: 'Comprehensive test on geometric shapes, angles, and their properties',
      duration: 45,
      questions: 20,
      difficulty: 'Intermediate',
      topic: 'Geometry',
      status: 'completed',
      score: 72,
      attempts: 1,
      lastAttempt: '2024-01-18',
      tags: ['shapes', 'angles', 'properties']
    },
    {
      id: 3,
      title: 'Advanced Quadratic Equations',
      description: 'Solve complex quadratic equations using various methods and techniques',
      duration: 60,
      questions: 25,
      difficulty: 'Advanced',
      topic: 'Algebra',
      status: 'not_started',
      score: null,
      attempts: 0,
      lastAttempt: null,
      tags: ['quadratic', 'factoring', 'formula']
    },
    {
      id: 4,
      title: 'Statistics and Data Analysis',
      description: 'Analyze data, calculate averages, and interpret statistical information',
      duration: 40,
      questions: 18,
      difficulty: 'Intermediate',
      topic: 'Statistics',
      status: 'in_progress',
      score: null,
      attempts: 1,
      lastAttempt: '2024-01-22',
      tags: ['mean', 'median', 'mode', 'graphs']
    },
    {
      id: 5,
      title: 'Trigonometry Basics',
      description: 'Introduction to sine, cosine, tangent, and their applications',
      duration: 50,
      questions: 22,
      difficulty: 'Advanced',
      topic: 'Trigonometry',
      status: 'failed',
      score: 45,
      attempts: 3,
      lastAttempt: '2024-01-19',
      tags: ['sine', 'cosine', 'tangent', 'ratios']
    },
    {
      id: 6,
      title: 'Number Theory Fundamentals',
      description: 'Prime numbers, factors, multiples, and number patterns',
      duration: 35,
      questions: 16,
      difficulty: 'Beginner',
      topic: 'Number Theory',
      status: 'not_started',
      score: null,
      attempts: 0,
      lastAttempt: null,
      tags: ['primes', 'factors', 'multiples']
    }
  ];

  const currentSubject = subjectInfo[subject as keyof typeof subjectInfo];

  const filteredTests = tests.filter(test => {
    const matchesSearch = test.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         test.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         test.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesDifficulty = selectedDifficulty === 'all' || test.difficulty === selectedDifficulty;
    const matchesStatus = selectedStatus === 'all' || test.status === selectedStatus;
    return matchesSearch && matchesDifficulty && matchesStatus;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-green-100 text-green-800';
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'Advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'in_progress': return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <Play className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Completed';
      case 'in_progress': return 'In Progress';
      case 'failed': return 'Needs Retry';
      case 'not_started': return 'Not Started';
      default: return 'Unknown';
    }
  };

  const getScoreColor = (score: number | null) => {
    if (!score) return 'text-muted-foreground';
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

  if (!currentSubject) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Subject Not Found</h1>
          <Link href={`/test/${classNumber}`}>
            <Button>Back to Class {classNumber}</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header Section */}
      <section className={`bg-gradient-to-r ${currentSubject.color} py-16 text-white`}>
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center mb-6">
              <Link href={`/test/${classNumber}`}>
                <Button variant="outline" size="sm" className="text-white border-white hover:bg-white hover:text-foreground mr-4">
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Back to Class {classNumber}
                </Button>
              </Link>
              
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-3xl mr-4">
                {currentSubject.icon}
              </div>
              
              <div>
                <h1 className="text-3xl md:text-4xl font-bold">{currentSubject.name} Tests</h1>
                <p className="text-xl opacity-90">Class {classNumber} • {currentSubject.description}</p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
              <div className="bg-white/10 rounded-lg p-4 text-center">
                <div className="text-lg font-bold">{tests.length}</div>
                <div className="text-sm opacity-80">Total Tests</div>
              </div>
              <div className="bg-white/10 rounded-lg p-4 text-center">
                <div className="text-lg font-bold">{tests.filter(t => t.status === 'completed').length}</div>
                <div className="text-sm opacity-80">Completed</div>
              </div>
              <div className="bg-white/10 rounded-lg p-4 text-center">
                <div className="text-lg font-bold">{Math.round(tests.reduce((sum, t) => sum + (t.score || 0), 0) / tests.filter(t => t.score).length) || 0}%</div>
                <div className="text-sm opacity-80">Avg Score</div>
              </div>
              <div className="bg-white/10 rounded-lg p-4 text-center">
                <div className="text-lg font-bold">{tests.reduce((sum, t) => sum + t.questions, 0)}</div>
                <div className="text-sm opacity-80">Total Questions</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filters and Search */}
      <section className="py-8 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex flex-1 items-center space-x-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search tests..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Filter className="w-4 h-4 text-muted-foreground" />
                  <select
                    value={selectedDifficulty}
                    onChange={(e) => setSelectedDifficulty(e.target.value)}
                    className="px-3 py-2 border rounded-md bg-background"
                  >
                    <option value="all">All Levels</option>
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                  
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="px-3 py-2 border rounded-md bg-background"
                  >
                    <option value="all">All Status</option>
                    <option value="not_started">Not Started</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="failed">Needs Retry</option>
                  </select>
                </div>
              </div>
              
              <div className="text-sm text-muted-foreground">
                Showing {filteredTests.length} of {tests.length} tests
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tests Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTests.map((test) => (
                <Card key={test.id} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between mb-2">
                      <Badge variant="outline" className="text-xs">
                        {test.topic}
                      </Badge>
                      <div className="flex items-center text-xs">
                        {getStatusIcon(test.status)}
                        <span className="ml-1">{getStatusText(test.status)}</span>
                      </div>
                    </div>
                    
                    <CardTitle className="text-lg leading-tight group-hover:text-primary transition-colors">
                      {test.title}
                    </CardTitle>
                    
                    <CardDescription className="text-sm">
                      {test.description}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div className="bg-muted rounded-lg p-2">
                        <div className="font-bold text-sm">{test.questions}</div>
                        <div className="text-xs text-muted-foreground">Questions</div>
                      </div>
                      <div className="bg-muted rounded-lg p-2">
                        <div className="font-bold text-sm">{test.duration} min</div>
                        <div className="text-xs text-muted-foreground">Duration</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <Badge className={`text-xs ${getDifficultyColor(test.difficulty)}`}>
                        {test.difficulty}
                      </Badge>
                      {test.score !== null && (
                        <div className={`font-bold ${getScoreColor(test.score)}`}>
                          {test.score}%
                        </div>
                      )}
                    </div>

                    {test.attempts > 0 && (
                      <div className="text-xs text-muted-foreground">
                        <div>Attempts: {test.attempts}</div>
                        {test.lastAttempt && (
                          <div>Last: {new Date(test.lastAttempt).toLocaleDateString()}</div>
                        )}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-1">
                      {test.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {test.tags.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{test.tags.length - 3}
                        </Badge>
                      )}
                    </div>

                    <div className="flex space-x-2">
                      {test.status === 'completed' || test.status === 'failed' ? (
                        <>
                          <Link href={`/test/${classNumber}/${subject}/${test.id}/results`} className="flex-1">
                            <Button size="sm" variant="outline" className="w-full">
                              <TrendingUp className="w-3 h-3 mr-1" />
                              Results
                            </Button>
                          </Link>
                          <Link href={`/test/${classNumber}/${subject}/${test.id}/instructions`} className="flex-1">
                            <Button size="sm" className="w-full">
                              <Play className="w-3 h-3 mr-1" />
                              Retry
                            </Button>
                          </Link>
                        </>
                      ) : (
                        <Link href={`/test/${classNumber}/${subject}/${test.id}/instructions`} className="w-full">
                          <Button size="sm" className="w-full">
                            <Play className="w-3 h-3 mr-1" />
                            {test.status === 'in_progress' ? 'Continue' : 'Start Test'}
                          </Button>
                        </Link>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredTests.length === 0 && (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileCheck className="w-12 h-12 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No tests found</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your search terms or filters
                </p>
                <Button onClick={() => { setSearchTerm(''); setSelectedDifficulty('all'); setSelectedStatus('all'); }}>
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}