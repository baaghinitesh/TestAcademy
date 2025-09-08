'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Trophy, 
  Target, 
  Clock, 
  CheckCircle, 
  XCircle, 
  BarChart3,
  TrendingUp,
  TrendingDown,
  Minus,
  Share2,
  Download,
  RefreshCw,
  Eye,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

export default function TestResultsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const classNumber = params.classNumber as string;
  const subject = params.subject as string;
  const testId = params.testId as string;
  
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Get results from URL params or simulate
  const score = parseInt(searchParams.get('score') || '85');
  const correctAnswers = parseInt(searchParams.get('correct') || '13');
  const totalQuestions = parseInt(searchParams.get('total') || '15');

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
    'mathematics': { name: 'Mathematics', icon: '📐' },
    'science': { name: 'Science', icon: '🔬' },
    'english': { name: 'English', icon: '📚' },
    'social-studies': { name: 'Social Studies', icon: '🌍' },
    'hindi': { name: 'Hindi', icon: '🇮🇳' }
  };

  const currentSubject = subjectInfo[subject as keyof typeof subjectInfo];

  // Sample test and results data
  const testResults = {
    id: testId,
    title: 'Basic Algebra Fundamentals',
    subject: currentSubject?.name || 'Mathematics',
    duration: 30,
    totalQuestions,
    correctAnswers,
    incorrectAnswers: totalQuestions - correctAnswers,
    skippedQuestions: 0,
    score,
    percentage: score,
    grade: score >= 90 ? 'A+' : score >= 80 ? 'A' : score >= 70 ? 'B' : score >= 60 ? 'C' : 'F',
    timeTaken: 25, // minutes
    completedAt: new Date().toISOString(),
    passingScore: 60,
    isPassed: score >= 60,
    rank: 12,
    totalStudents: 45,
    topicWiseResults: [
      { topic: 'Linear Equations', questions: 5, correct: 4, percentage: 80 },
      { topic: 'Algebraic Expressions', questions: 4, correct: 4, percentage: 100 },
      { topic: 'Word Problems', questions: 3, correct: 2, percentage: 67 },
      { topic: 'Quadratic Equations', questions: 3, correct: 3, percentage: 100 }
    ],
    difficultyAnalysis: [
      { level: 'Beginner', questions: 6, correct: 6, percentage: 100 },
      { level: 'Intermediate', questions: 6, correct: 5, percentage: 83 },
      { level: 'Advanced', questions: 3, correct: 2, percentage: 67 }
    ]
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A+': case 'A': return 'text-green-600';
      case 'B': return 'text-blue-600';
      case 'C': return 'text-yellow-600';
      default: return 'text-red-600';
    }
  };

  const getPerformanceIcon = (percentage: number) => {
    if (percentage >= 90) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (percentage >= 70) return <Minus className="w-4 h-4 text-yellow-500" />;
    return <TrendingDown className="w-4 h-4 text-red-500" />;
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Test Results: ${testResults.title}`,
          text: `I scored ${testResults.score}% in ${testResults.title}!`,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Results link copied to clipboard!');
    }
  };

  const handleDownloadReport = () => {
    // Simulate PDF download
    const link = document.createElement('a');
    link.href = '#';
    link.download = `${testResults.title}-results.pdf`;
    alert('Report download functionality would be implemented here');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
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
                <span>{currentSubject?.name}</span>
                <span>•</span>
                <span>Test Results</span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 className="w-4 h-4 mr-1" />
                Share
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownloadReport}>
                <Download className="w-4 h-4 mr-1" />
                Download Report
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Results Header */}
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl ${
                testResults.isPassed ? 'bg-green-100' : 'bg-red-100'
              }`}>
                {testResults.isPassed ? (
                  <Trophy className="w-10 h-10 text-green-600" />
                ) : (
                  <AlertCircle className="w-10 h-10 text-red-600" />
                )}
              </div>
            </div>
            
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              {testResults.isPassed ? 'Congratulations!' : 'Keep Trying!'}
            </h1>
            <p className="text-xl text-muted-foreground mb-4">
              {testResults.title} - Results
            </p>
            
            <div className="flex items-center justify-center space-x-4">
              <Badge variant="outline" className="flex items-center">
                <Target className="w-4 h-4 mr-1" />
                Class {classNumber}
              </Badge>
              <Badge variant="outline" className="flex items-center">
                {currentSubject?.icon} {currentSubject?.name}
              </Badge>
              <Badge variant="outline">
                {new Date(testResults.completedAt).toLocaleDateString()}
              </Badge>
            </div>
          </div>

          {/* Score Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="text-center">
              <CardContent className="p-6">
                <div className={`text-4xl font-bold mb-2 ${getGradeColor(testResults.grade)}`}>
                  {testResults.score}%
                </div>
                <div className="text-sm text-muted-foreground">Final Score</div>
                <div className={`text-2xl font-bold mt-2 ${getGradeColor(testResults.grade)}`}>
                  {testResults.grade}
                </div>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="p-6">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {testResults.correctAnswers}
                </div>
                <div className="text-sm text-muted-foreground">Correct Answers</div>
                <div className="text-sm mt-2">
                  out of {testResults.totalQuestions}
                </div>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="p-6">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {testResults.timeTaken}
                </div>
                <div className="text-sm text-muted-foreground">Minutes Taken</div>
                <div className="text-sm mt-2">
                  of {testResults.duration} available
                </div>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="p-6">
                <div className="text-3xl font-bold text-purple-600 mb-2">
                  #{testResults.rank}
                </div>
                <div className="text-sm text-muted-foreground">Class Rank</div>
                <div className="text-sm mt-2">
                  out of {testResults.totalStudents}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Pass/Fail Status */}
          <Card className={`border-2 ${testResults.isPassed ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {testResults.isPassed ? (
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  ) : (
                    <XCircle className="w-8 h-8 text-red-600" />
                  )}
                  <div>
                    <h3 className={`text-xl font-bold ${testResults.isPassed ? 'text-green-800' : 'text-red-800'}`}>
                      {testResults.isPassed ? 'Test Passed!' : 'Test Not Passed'}
                    </h3>
                    <p className={`${testResults.isPassed ? 'text-green-700' : 'text-red-700'}`}>
                      {testResults.isPassed 
                        ? `You scored above the passing threshold of ${testResults.passingScore}%`
                        : `You need ${testResults.passingScore}% to pass. You scored ${testResults.score}%`
                      }
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-2xl font-bold">
                    {testResults.score}% / {testResults.passingScore}%
                  </div>
                  <Progress 
                    value={testResults.score} 
                    className="w-32 mt-2"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Topic-wise Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  Topic-wise Performance
                </CardTitle>
                <CardDescription>
                  See how you performed in different topics
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {testResults.topicWiseResults.map((topic, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{topic.topic}</span>
                      <div className="flex items-center space-x-2">
                        {getPerformanceIcon(topic.percentage)}
                        <span className="font-bold">{topic.percentage}%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{topic.correct}/{topic.questions} correct</span>
                      <Progress value={topic.percentage} className="w-24" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Difficulty Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="w-5 h-5 mr-2" />
                  Difficulty Analysis
                </CardTitle>
                <CardDescription>
                  Performance across different difficulty levels
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {testResults.difficultyAnalysis.map((level, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{level.level}</span>
                      <div className="flex items-center space-x-2">
                        {getPerformanceIcon(level.percentage)}
                        <span className="font-bold">{level.percentage}%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{level.correct}/{level.questions} correct</span>
                      <Progress value={level.percentage} className="w-24" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle>Recommendations for Improvement</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-green-600 mb-3">Strengths</h4>
                  <ul className="space-y-2">
                    {testResults.topicWiseResults
                      .filter(topic => topic.percentage >= 80)
                      .map((topic, index) => (
                        <li key={index} className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-sm">Excellent in {topic.topic}</span>
                        </li>
                      ))
                    }
                    {testResults.difficultyAnalysis
                      .filter(level => level.percentage >= 80)
                      .map((level, index) => (
                        <li key={index} className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-sm">Strong at {level.level} level</span>
                        </li>
                      ))
                    }
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold text-orange-600 mb-3">Areas for Improvement</h4>
                  <ul className="space-y-2">
                    {testResults.topicWiseResults
                      .filter(topic => topic.percentage < 80)
                      .map((topic, index) => (
                        <li key={index} className="flex items-center space-x-2">
                          <AlertCircle className="w-4 h-4 text-orange-500" />
                          <span className="text-sm">Practice more {topic.topic}</span>
                        </li>
                      ))
                    }
                    {testResults.difficultyAnalysis
                      .filter(level => level.percentage < 80)
                      .map((level, index) => (
                        <li key={index} className="flex items-center space-x-2">
                          <AlertCircle className="w-4 h-4 text-orange-500" />
                          <span className="text-sm">Work on {level.level} problems</span>
                        </li>
                      ))
                    }
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href={`/test/${classNumber}/${subject}/${testId}/instructions`}>
              <Button size="lg" variant="outline" className="flex items-center">
                <RefreshCw className="w-5 h-5 mr-2" />
                Retake Test
              </Button>
            </Link>
            
            <Link href={`/study/${classNumber}/${subject}`}>
              <Button size="lg" variant="outline" className="flex items-center">
                <Eye className="w-5 h-5 mr-2" />
                Study Materials
              </Button>
            </Link>
            
            <Link href={`/test/${classNumber}/${subject}`}>
              <Button size="lg" className="flex items-center">
                <Target className="w-5 h-5 mr-2" />
                More Tests
              </Button>
            </Link>
            
            <Link href="/dashboard">
              <Button size="lg" variant="outline" className="flex items-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                View Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}