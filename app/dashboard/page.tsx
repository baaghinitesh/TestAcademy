'use client';

import { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Trophy, 
  Target, 
  BookOpen, 
  Clock, 
  Calendar,
  Award,
  Activity,
  Users,
  FileCheck,
  Star,
  AlertCircle,
  CheckCircle,
  Eye,
  Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import Link from 'next/link';

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('1M'); // 1W, 1M, 3M, 6M, 1Y

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

  // Sample dashboard data - in real app, this would come from API
  const dashboardData = {
    overview: {
      totalTests: 47,
      completedTests: 35,
      averageScore: 82,
      studyHours: 24.5,
      currentStreak: 7,
      rank: 12,
      totalStudents: 156
    },
    recentActivity: [
      { id: 1, type: 'test', subject: 'Mathematics', title: 'Algebra Basics', score: 88, date: '2024-01-22' },
      { id: 2, type: 'study', subject: 'Science', title: 'Physics Chapter 3', duration: 45, date: '2024-01-21' },
      { id: 3, type: 'test', subject: 'English', title: 'Grammar Test', score: 92, date: '2024-01-20' },
      { id: 4, type: 'study', subject: 'Mathematics', title: 'Geometry Notes', duration: 30, date: '2024-01-19' },
      { id: 5, type: 'test', subject: 'Social Studies', title: 'History Quiz', score: 76, date: '2024-01-18' }
    ],
    subjectPerformance: [
      { subject: 'Mathematics', score: 85, tests: 12, hours: 8.5, trend: 'up', color: '#3B82F6' },
      { subject: 'Science', score: 82, tests: 10, hours: 6.2, trend: 'up', color: '#10B981' },
      { subject: 'English', score: 89, tests: 8, hours: 4.8, trend: 'up', color: '#8B5CF6' },
      { subject: 'Social Studies', score: 74, tests: 7, hours: 3.5, trend: 'down', color: '#F59E0B' },
      { subject: 'Hindi', score: 79, tests: 6, hours: 2.5, trend: 'stable', color: '#EF4444' }
    ],
    performanceTrend: [
      { month: 'Aug', Mathematics: 75, Science: 78, English: 85, 'Social Studies': 70, Hindi: 72 },
      { month: 'Sep', Mathematics: 78, Science: 80, English: 86, 'Social Studies': 72, Hindi: 75 },
      { month: 'Oct', Mathematics: 82, Science: 81, English: 88, 'Social Studies': 73, Hindi: 77 },
      { month: 'Nov', Mathematics: 84, Science: 82, English: 89, 'Social Studies': 74, Hindi: 79 },
      { month: 'Dec', Mathematics: 85, Science: 82, English: 89, 'Social Studies': 74, Hindi: 79 }
    ],
    weeklyActivity: [
      { day: 'Mon', tests: 2, study: 1.5 },
      { day: 'Tue', tests: 1, study: 2.2 },
      { day: 'Wed', tests: 3, study: 1.8 },
      { day: 'Thu', tests: 2, study: 2.5 },
      { day: 'Fri', tests: 1, study: 1.2 },
      { day: 'Sat', tests: 4, study: 3.0 },
      { day: 'Sun', tests: 2, study: 2.8 }
    ],
    skillsRadar: [
      { skill: 'Problem Solving', score: 85 },
      { skill: 'Critical Thinking', score: 78 },
      { skill: 'Memory', score: 82 },
      { skill: 'Speed', score: 75 },
      { skill: 'Accuracy', score: 88 },
      { skill: 'Comprehension', score: 84 }
    ],
    goals: [
      { id: 1, title: 'Achieve 90% in Mathematics', progress: 85, target: 90, deadline: '2024-02-15' },
      { id: 2, title: 'Complete 50 Tests', progress: 35, target: 50, deadline: '2024-02-28' },
      { id: 3, title: 'Study 40 Hours This Month', progress: 24.5, target: 40, deadline: '2024-01-31' }
    ]
  };

  const COLORS = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444'];

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-red-500" />;
      default: return <Target className="w-4 h-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">Loading Dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
              <p className="text-muted-foreground">
                {user ? `Welcome back, ${user.name}!` : 'Track your learning progress'}
              </p>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="hidden md:flex items-center space-x-1 bg-muted rounded-lg p-1">
                {['1W', '1M', '3M', '6M', '1Y'].map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`px-3 py-1 rounded-md transition-colors ${
                      timeRange === range 
                        ? 'bg-primary text-primary-foreground' 
                        : 'hover:bg-background'
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>
              
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-1" />
                Export Report
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Tests</p>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-2xl font-bold">{dashboardData.overview.completedTests}</h3>
                      <span className="text-sm text-muted-foreground">
                        / {dashboardData.overview.totalTests}
                      </span>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <FileCheck className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <div className="mt-4">
                  <Progress 
                    value={(dashboardData.overview.completedTests / dashboardData.overview.totalTests) * 100} 
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Average Score</p>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-2xl font-bold text-green-600">
                        {dashboardData.overview.averageScore}%
                      </h3>
                      <TrendingUp className="w-4 h-4 text-green-500" />
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <Trophy className="w-6 h-6 text-green-600" />
                  </div>
                </div>
                <div className="mt-4">
                  <Progress value={dashboardData.overview.averageScore} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Study Hours</p>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-2xl font-bold">{dashboardData.overview.studyHours}</h3>
                      <span className="text-sm text-muted-foreground">hrs</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <Clock className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
                <div className="mt-4 text-sm text-muted-foreground">
                  This month
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Class Rank</p>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-2xl font-bold">#{dashboardData.overview.rank}</h3>
                      <span className="text-sm text-muted-foreground">
                        / {dashboardData.overview.totalStudents}
                      </span>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                    <Award className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
                <div className="mt-4 text-sm text-green-600 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Up 3 positions
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Performance Trend Chart */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Activity className="w-5 h-5 mr-2" />
                    Performance Trend
                  </CardTitle>
                  <CardDescription>
                    Your scores across subjects over time
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={dashboardData.performanceTrend}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis domain={[60, 100]} />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="Mathematics" stroke="#3B82F6" strokeWidth={2} />
                        <Line type="monotone" dataKey="Science" stroke="#10B981" strokeWidth={2} />
                        <Line type="monotone" dataKey="English" stroke="#8B5CF6" strokeWidth={2} />
                        <Line type="monotone" dataKey="Social Studies" stroke="#F59E0B" strokeWidth={2} />
                        <Line type="monotone" dataKey="Hindi" stroke="#EF4444" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Goals Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="w-5 h-5 mr-2" />
                  Current Goals
                </CardTitle>
                <CardDescription>
                  Track your learning objectives
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {dashboardData.goals.map((goal) => (
                  <div key={goal.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{goal.title}</span>
                      <Badge variant="outline" className="text-xs">
                        {Math.round((goal.progress / goal.target) * 100)}%
                      </Badge>
                    </div>
                    <Progress value={(goal.progress / goal.target) * 100} className="h-2" />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{goal.progress} / {goal.target}</span>
                      <span>Due: {new Date(goal.deadline).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Subject Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BookOpen className="w-5 h-5 mr-2" />
                  Subject Performance
                </CardTitle>
                <CardDescription>
                  Detailed breakdown by subject
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {dashboardData.subjectPerformance.map((subject, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: subject.color }}
                      ></div>
                      <div>
                        <div className="font-medium">{subject.subject}</div>
                        <div className="text-sm text-muted-foreground">
                          {subject.tests} tests • {subject.hours}h study
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getTrendIcon(subject.trend)}
                      <span className="font-bold text-lg">{subject.score}%</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Weekly Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  Weekly Activity
                </CardTitle>
                <CardDescription>
                  Tests taken and study hours per day
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dashboardData.weeklyActivity}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="tests" fill="#3B82F6" name="Tests" />
                      <Bar dataKey="study" fill="#10B981" name="Study Hours" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Skills Radar */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Star className="w-5 h-5 mr-2" />
                  Skills Analysis
                </CardTitle>
                <CardDescription>
                  Your learning abilities breakdown
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={dashboardData.skillsRadar}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="skill" />
                      <PolarRadiusAxis angle={90} domain={[0, 100]} />
                      <Radar 
                        name="Score" 
                        dataKey="score" 
                        stroke="#3B82F6" 
                        fill="#3B82F6" 
                        fillOpacity={0.1}
                        strokeWidth={2}
                      />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="w-5 h-5 mr-2" />
                  Recent Activity
                </CardTitle>
                <CardDescription>
                  Your latest learning activities
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {dashboardData.recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      activity.type === 'test' ? 'bg-blue-100' : 'bg-green-100'
                    }`}>
                      {activity.type === 'test' ? (
                        <FileCheck className={`w-5 h-5 ${
                          activity.type === 'test' ? 'text-blue-600' : 'text-green-600'
                        }`} />
                      ) : (
                        <BookOpen className="w-5 h-5 text-green-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm">{activity.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {activity.subject} • {new Date(activity.date).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-right">
                      {activity.type === 'test' ? (
                        <div className={`font-bold ${
                          (activity as any).score >= 80 ? 'text-green-600' : 
                          (activity as any).score >= 60 ? 'text-blue-600' : 'text-red-600'
                        }`}>
                          {(activity as any).score}%
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">
                          {(activity as any).duration}m
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Jump to your most used features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Link href="/test">
                  <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center space-y-2">
                    <FileCheck className="w-6 h-6" />
                    <span>Take Test</span>
                  </Button>
                </Link>
                
                <Link href="/study">
                  <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center space-y-2">
                    <BookOpen className="w-6 h-6" />
                    <span>Study Materials</span>
                  </Button>
                </Link>
                
                <Link href="/test?view=results">
                  <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center space-y-2">
                    <Eye className="w-6 h-6" />
                    <span>View Results</span>
                  </Button>
                </Link>
                
                <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center space-y-2">
                  <Users className="w-6 h-6" />
                  <span>Leaderboard</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}