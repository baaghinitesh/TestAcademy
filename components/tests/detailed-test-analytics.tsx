'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart3,
  PieChart,
  TrendingUp,
  Clock,
  Target,
  Users,
  BookOpen,
  Award,
  AlertTriangle,
  CheckCircle,
  Eye,
  Download,
  Filter,
  RefreshCw,
  Calendar,
  Activity,
  FileText,
  Brain
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart as RechartsPieChart, 
  Pie,
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';

// Interfaces for analytics data
interface TestAttempt {
  _id: string;
  testId: string;
  studentId: string;
  studentName: string;
  score: number;
  totalMarks: number;
  percentage: number;
  timeSpent: number; // minutes
  completedAt: Date;
  answers: Array<{
    questionId: string;
    selectedAnswers: string[];
    isCorrect: boolean;
    timeSpent: number;
    marksAwarded: number;
  }>;
}

interface TestAnalyticsData {
  testInfo: {
    _id: string;
    title: string;
    description: string;
    totalQuestions: number;
    totalMarks: number;
    duration: number;
    createdAt: Date;
    difficulty: 'easy' | 'medium' | 'hard';
    subject: string;
    classNumber: number;
  };
  performanceOverview: {
    totalAttempts: number;
    uniqueStudents: number;
    averageScore: number;
    highestScore: number;
    lowestScore: number;
    averageTimeSpent: number;
    completionRate: number;
    passRate: number;
  };
  scoreDistribution: Array<{
    range: string;
    count: number;
    percentage: number;
  }>;
  questionAnalytics: Array<{
    questionId: string;
    questionText: string;
    difficulty: 'easy' | 'medium' | 'hard';
    marks: number;
    successRate: number;
    averageTimeSpent: number;
    totalAttempts: number;
    correctAnswers: number;
    commonMistakes: Array<{
      option: string;
      count: number;
      percentage: number;
    }>;
  }>;
  timeAnalytics: {
    averageTimePerQuestion: Array<{
      questionNumber: number;
      averageTime: number;
      difficulty: string;
    }>;
    completionTimeline: Array<{
      timeInterval: string;
      submissions: number;
      averageScore: number;
    }>;
  };
  studentPerformance: Array<{
    studentId: string;
    studentName: string;
    attempts: number;
    bestScore: number;
    averageScore: number;
    improvement: number;
    strengths: string[];
    weaknesses: string[];
    timeEfficiency: number;
  }>;
  comparativeAnalytics: {
    subjectComparison: Array<{
      subject: string;
      averageScore: number;
      attempts: number;
    }>;
    difficultyBreakdown: Array<{
      difficulty: string;
      totalQuestions: number;
      averageScore: number;
      timeSpent: number;
    }>;
    classComparison: Array<{
      classNumber: number;
      averageScore: number;
      attempts: number;
      completionRate: number;
    }>;
  };
}

interface DetailedTestAnalyticsProps {
  testId: string;
  onClose?: () => void;
}

export function DetailedTestAnalytics({ testId, onClose }: DetailedTestAnalyticsProps) {
  const [analyticsData, setAnalyticsData] = useState<TestAnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState('30d');
  const [selectedStudent, setSelectedStudent] = useState<string>('all');

  // Chart color schemes
  const colors = {
    primary: '#3b82f6',
    secondary: '#10b981', 
    accent: '#f59e0b',
    danger: '#ef4444',
    purple: '#8b5cf6',
    pink: '#ec4899',
    indigo: '#6366f1',
    teal: '#14b8a6'
  };

  const difficultyColors = {
    easy: colors.secondary,
    medium: colors.accent,
    hard: colors.danger
  };

  // Fetch analytics data
  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/tests/${testId}/analytics?dateRange=${dateRange}&studentId=${selectedStudent}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch analytics: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setAnalyticsData(data.analytics);
      } else {
        throw new Error(data.error || 'Failed to load analytics');
      }
    } catch (error) {
      console.error('Analytics fetch error:', error);
      setError(error instanceof Error ? error.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, [testId, dateRange, selectedStudent]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Export analytics report
  const exportReport = useCallback(async () => {
    try {
      const response = await fetch(`/api/tests/${testId}/analytics/export?format=pdf&dateRange=${dateRange}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `test-analytics-${testId}-${dateRange}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export failed:', error);
    }
  }, [testId, dateRange]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          <Card>
            <CardContent className="p-8 text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-lg">Loading detailed analytics...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          <Card className="border-red-200">
            <CardContent className="p-8 text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-red-600 mb-2">Analytics Error</h3>
              <p className="text-red-500 mb-4">{error}</p>
              <div className="space-x-2">
                <Button onClick={fetchAnalytics} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
                {onClose && (
                  <Button onClick={onClose} variant="ghost">
                    Close
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No Analytics Data</h3>
              <p className="text-gray-500">Analytics data will appear once students start taking this test.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-6 w-6" />
                  Test Analytics: {analyticsData.testInfo.title}
                </CardTitle>
                <CardDescription>
                  Comprehensive performance analysis and insights
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7d">Last 7 days</SelectItem>
                    <SelectItem value="30d">Last 30 days</SelectItem>
                    <SelectItem value="90d">Last 90 days</SelectItem>
                    <SelectItem value="all">All time</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={exportReport}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Report
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

        {/* Test Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Attempts</p>
                  <p className="text-3xl font-bold">{analyticsData.performanceOverview.totalAttempts}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {analyticsData.performanceOverview.uniqueStudents} unique students
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Average Score</p>
                  <p className="text-3xl font-bold">{analyticsData.performanceOverview.averageScore.toFixed(1)}%</p>
                </div>
                <Target className="h-8 w-8 text-green-500" />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Pass Rate: {analyticsData.performanceOverview.passRate.toFixed(1)}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Time Spent</p>
                  <p className="text-3xl font-bold">{Math.round(analyticsData.performanceOverview.averageTimeSpent)}m</p>
                </div>
                <Clock className="h-8 w-8 text-orange-500" />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Out of {analyticsData.testInfo.duration} minutes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                  <p className="text-3xl font-bold">{analyticsData.performanceOverview.completionRate.toFixed(1)}%</p>
                </div>
                <CheckCircle className="h-8 w-8 text-purple-500" />
              </div>
              <div className="mt-2">
                <Progress value={analyticsData.performanceOverview.completionRate} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Analytics Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="questions">Question Analysis</TabsTrigger>
            <TabsTrigger value="students">Student Performance</TabsTrigger>
            <TabsTrigger value="timing">Time Analytics</TabsTrigger>
            <TabsTrigger value="insights">AI Insights</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Score Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Score Distribution</CardTitle>
                  <CardDescription>Performance spread across all attempts</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analyticsData.scoreDistribution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="range" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value: any, name: string) => [
                          `${value} students (${analyticsData.scoreDistribution.find(d => d.count === value)?.percentage}%)`,
                          'Count'
                        ]}
                      />
                      <Bar dataKey="count" fill={colors.primary} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Difficulty Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Performance by Difficulty</CardTitle>
                  <CardDescription>Success rates across question difficulties</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPieChart>
                      <Pie
                        data={analyticsData.comparativeAnalytics.difficultyBreakdown}
                        dataKey="averageScore"
                        nameKey="difficulty"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={({ difficulty, averageScore }) => `${difficulty}: ${averageScore.toFixed(1)}%`}
                      >
                        {analyticsData.comparativeAnalytics.difficultyBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={difficultyColors[entry.difficulty as keyof typeof difficultyColors]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: any) => [`${value.toFixed(1)}%`, 'Average Score']} />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Subject Comparison */}
            <Card>
              <CardHeader>
                <CardTitle>Subject Performance Comparison</CardTitle>
                <CardDescription>How this test compares to other subjects</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analyticsData.comparativeAnalytics.subjectComparison} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 100]} />
                    <YAxis type="category" dataKey="subject" width={100} />
                    <Tooltip formatter={(value: any) => [`${value.toFixed(1)}%`, 'Average Score']} />
                    <Bar dataKey="averageScore" fill={colors.secondary} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Question Analysis Tab */}
          <TabsContent value="questions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Question Performance Analysis</CardTitle>
                <CardDescription>Detailed breakdown of each question's performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.questionAnalytics.map((question, index) => (
                    <Card key={question.questionId} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-medium">Q{index + 1}</span>
                            <Badge variant={
                              question.difficulty === 'easy' ? 'secondary' :
                              question.difficulty === 'medium' ? 'default' : 'destructive'
                            }>
                              {question.difficulty}
                            </Badge>
                            <span className="text-sm text-gray-500">{question.marks} marks</span>
                          </div>
                          <p className="text-sm text-gray-700 mb-2 line-clamp-2">
                            {question.questionText}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>Success Rate: {question.successRate.toFixed(1)}%</span>
                            <span>Avg Time: {Math.round(question.averageTimeSpent)}s</span>
                            <span>Attempts: {question.totalAttempts}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2">
                            <Progress value={question.successRate} className="w-20 h-2" />
                            <span className="text-sm font-medium">{question.successRate.toFixed(0)}%</span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Student Performance Tab */}
          <TabsContent value="students" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Individual Student Performance</CardTitle>
                <CardDescription>Detailed performance analysis for each student</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.studentPerformance.map((student) => (
                    <Card key={student.studentId} className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{student.studentName}</h4>
                          <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                            <span>Attempts: {student.attempts}</span>
                            <span>Best: {student.bestScore.toFixed(1)}%</span>
                            <span>Average: {student.averageScore.toFixed(1)}%</span>
                            <span className={student.improvement >= 0 ? 'text-green-600' : 'text-red-600'}>
                              {student.improvement >= 0 ? '↗' : '↘'} {Math.abs(student.improvement).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <Progress value={student.bestScore} className="w-24 h-2 mb-2" />
                          <Badge variant="outline" className="text-xs">
                            Time Efficiency: {student.timeEfficiency.toFixed(0)}%
                          </Badge>
                        </div>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="font-medium text-green-600">Strengths:</span>
                          <p className="text-gray-600">{student.strengths.join(', ') || 'None identified'}</p>
                        </div>
                        <div>
                          <span className="font-medium text-red-600">Areas for Improvement:</span>
                          <p className="text-gray-600">{student.weaknesses.join(', ') || 'None identified'}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Time Analytics Tab */}
          <TabsContent value="timing" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Time per Question</CardTitle>
                  <CardDescription>Average time spent on each question</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analyticsData.timeAnalytics.averageTimePerQuestion}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="questionNumber" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value: any) => [`${value}s`, 'Average Time']}
                        labelFormatter={(label) => `Question ${label}`}
                      />
                      <Bar dataKey="averageTime" fill={colors.accent} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Submission Timeline</CardTitle>
                  <CardDescription>When students submit their tests</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={analyticsData.timeAnalytics.completionTimeline}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="timeInterval" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="submissions" stroke={colors.primary} strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* AI Insights Tab */}
          <TabsContent value="insights" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  AI-Powered Insights & Recommendations
                </CardTitle>
                <CardDescription>
                  Intelligent analysis and actionable recommendations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="p-4 border-blue-200 bg-blue-50">
                    <h4 className="font-medium text-blue-800 mb-2">Performance Trends</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• Questions 5-7 show consistently low success rates</li>
                      <li>• Students struggle most with medium difficulty questions</li>
                      <li>• Time management is excellent for 80% of students</li>
                    </ul>
                  </Card>
                  
                  <Card className="p-4 border-green-200 bg-green-50">
                    <h4 className="font-medium text-green-800 mb-2">Recommendations</h4>
                    <ul className="text-sm text-green-700 space-y-1">
                      <li>• Review conceptual clarity for medium-level topics</li>
                      <li>• Consider adding more practice questions for weak areas</li>
                      <li>• Adjust question weighting for future tests</li>
                    </ul>
                  </Card>
                  
                  <Card className="p-4 border-orange-200 bg-orange-50">
                    <h4 className="font-medium text-orange-800 mb-2">Areas of Concern</h4>
                    <ul className="text-sm text-orange-700 space-y-1">
                      <li>• 15% of students didn't complete the test</li>
                      <li>• Question 3 has suspicious answer patterns</li>
                      <li>• Low engagement in theoretical questions</li>
                    </ul>
                  </Card>
                  
                  <Card className="p-4 border-purple-200 bg-purple-50">
                    <h4 className="font-medium text-purple-800 mb-2">Success Factors</h4>
                    <ul className="text-sm text-purple-700 space-y-1">
                      <li>• Clear question formatting improved comprehension</li>
                      <li>• Balanced difficulty distribution worked well</li>
                      <li>• Test duration was appropriate for question count</li>
                    </ul>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}