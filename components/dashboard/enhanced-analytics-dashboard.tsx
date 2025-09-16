'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, Users, BookOpen, Target, Clock, Award, BarChart3, PieChart, Activity } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Button } from '../ui/button';
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
  ResponsiveContainer 
} from 'recharts';

interface AnalyticsData {
  overview: {
    totalStudents: number;
    totalQuestions: number;
    totalTests: number;
    totalAttempts: number;
    averageScore: number;
    completionRate: number;
  };
  performance: {
    subjectWise: Array<{
      subject: string;
      averageScore: number;
      attempts: number;
      improvement: number;
    }>;
    difficultyWise: Array<{
      difficulty: 'easy' | 'medium' | 'hard';
      averageScore: number;
      attempts: number;
      successRate: number;
    }>;
    recentTrend: Array<{
      date: string;
      score: number;
      attempts: number;
      completionRate: number;
    }>;
  };
  questionAnalytics: {
    mostUsed: Array<{
      questionId: string;
      question: string;
      usageCount: number;
      successRate: number;
      subject: string;
      difficulty: string;
    }>;
    leastSuccessful: Array<{
      questionId: string;
      question: string;
      successRate: number;
      attempts: number;
      subject: string;
    }>;
    bloomsDistribution: Array<{
      level: string;
      count: number;
      percentage: number;
    }>;
  };
  studentEngagement: {
    dailyActive: Array<{
      date: string;
      activeUsers: number;
      testsAttempted: number;
      avgTimeSpent: number;
    }>;
    retentionRate: {
      day1: number;
      day7: number;
      day30: number;
    };
    peakHours: Array<{
      hour: number;
      activity: number;
    }>;
  };
  systemMetrics: {
    apiResponseTime: number;
    dbQueryTime: number;
    errorRate: number;
    uptime: number;
  };
}

interface EnhancedAnalyticsDashboardProps {
  userType: 'admin' | 'teacher' | 'student';
  userId?: string;
  classNumber?: number;
  timeRange?: '7d' | '30d' | '90d' | '1y';
}

export function EnhancedAnalyticsDashboard({ 
  userType = 'admin', 
  userId, 
  classNumber,
  timeRange: initialTimeRange = '30d' 
}: EnhancedAnalyticsDashboardProps) {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState(initialTimeRange);
  const [selectedTab, setSelectedTab] = useState('overview');

  // Color schemes for charts
  const colors = {
    primary: '#3b82f6',
    secondary: '#10b981',
    accent: '#f59e0b',
    danger: '#ef4444',
    purple: '#8b5cf6',
    pink: '#ec4899'
  };

  const difficultyColors = {
    easy: colors.secondary,
    medium: colors.accent,
    hard: colors.danger
  };

  // Fetch analytics data
  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        timeRange,
        userType
      });
      
      if (userId) params.append('userId', userId);
      if (classNumber) params.append('classNumber', classNumber.toString());

      const response = await fetch(`/api/analytics?${params}`);
      if (!response.ok) throw new Error('Failed to fetch analytics');

      const data = await response.json();
      if (data.success) {
        setAnalyticsData(data.analytics);
      } else {
        throw new Error(data.error?.message || 'Failed to fetch analytics');
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange, userId, classNumber, userType]);

  // Render overview cards
  const renderOverviewCards = () => {
    if (!analyticsData?.overview) return null;

    const { overview } = analyticsData;

    const cards = [
      {
        title: 'Total Students',
        value: overview.totalStudents.toLocaleString(),
        icon: Users,
        color: colors.primary,
        change: '+12%'
      },
      {
        title: 'Total Questions',
        value: overview.totalQuestions.toLocaleString(),
        icon: BookOpen,
        color: colors.secondary,
        change: '+8%'
      },
      {
        title: 'Tests Created',
        value: overview.totalTests.toLocaleString(),
        icon: Target,
        color: colors.accent,
        change: '+15%'
      },
      {
        title: 'Test Attempts',
        value: overview.totalAttempts.toLocaleString(),
        icon: Activity,
        color: colors.purple,
        change: '+25%'
      },
      {
        title: 'Average Score',
        value: `${overview.averageScore.toFixed(1)}%`,
        icon: Award,
        color: colors.pink,
        change: '+3%'
      },
      {
        title: 'Completion Rate',
        value: `${overview.completionRate.toFixed(1)}%`,
        icon: TrendingUp,
        color: colors.primary,
        change: '+7%'
      }
    ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {cards.map((card, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <card.icon className="h-4 w-4" style={{ color: card.color }} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">{card.change}</span> from last period
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  // Render performance charts
  const renderPerformanceCharts = () => {
    if (!analyticsData?.performance) return null;

    const { performance } = analyticsData;

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subject-wise Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Subject-wise Performance</CardTitle>
            <CardDescription>Average scores and improvement trends</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={performance.subjectWise}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="subject" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={70}
                />
                <YAxis />
                <Tooltip />
                <Bar dataKey="averageScore" fill={colors.primary} />
                <Bar dataKey="improvement" fill={colors.secondary} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Difficulty-wise Success Rate */}
        <Card>
          <CardHeader>
            <CardTitle>Difficulty-wise Success Rate</CardTitle>
            <CardDescription>Performance across different difficulty levels</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={performance.difficultyWise}
                  dataKey="successRate"
                  nameKey="difficulty"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ difficulty, successRate }) => `${difficulty}: ${successRate.toFixed(1)}%`}
                >
                  {performance.difficultyWise.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={difficultyColors[entry.difficulty]} 
                    />
                  ))}
                </Pie>
                <Tooltip />
              </RechartsPieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Performance Trend */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Performance Trend</CardTitle>
            <CardDescription>Score and completion rate over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={performance.recentTrend}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={colors.primary} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={colors.primary} stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorCompletion" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={colors.secondary} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={colors.secondary} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" />
                <YAxis />
                <CartesianGrid strokeDasharray="3 3" />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="score" 
                  stroke={colors.primary}
                  fillOpacity={1}
                  fill="url(#colorScore)" 
                  name="Average Score (%)"
                />
                <Area 
                  type="monotone" 
                  dataKey="completionRate" 
                  stroke={colors.secondary}
                  fillOpacity={1}
                  fill="url(#colorCompletion)" 
                  name="Completion Rate (%)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Render question analytics
  const renderQuestionAnalytics = () => {
    if (!analyticsData?.questionAnalytics) return null;

    const { questionAnalytics } = analyticsData;

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most Used Questions */}
        <Card>
          <CardHeader>
            <CardTitle>Most Used Questions</CardTitle>
            <CardDescription>Popular questions by usage count</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {questionAnalytics.mostUsed.slice(0, 5).map((question, index) => (
                <div key={question.questionId} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <p className="text-sm font-medium truncate" title={question.question}>
                      {question.question}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {question.subject}
                      </Badge>
                      <Badge 
                        variant={question.difficulty === 'easy' ? 'secondary' : 
                                question.difficulty === 'medium' ? 'default' : 'destructive'}
                        className="text-xs"
                      >
                        {question.difficulty}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <div className="text-sm font-medium">{question.usageCount} uses</div>
                    <div className="text-xs text-muted-foreground">
                      {question.successRate.toFixed(1)}% success
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Bloom's Taxonomy Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Bloom's Taxonomy Distribution</CardTitle>
            <CardDescription>Questions categorized by cognitive levels</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={questionAnalytics.bloomsDistribution} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="level" type="category" width={80} />
                <Tooltip />
                <Bar dataKey="count" fill={colors.purple} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Least Successful Questions */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Questions Needing Attention</CardTitle>
            <CardDescription>Questions with low success rates that may need review</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {questionAnalytics.leastSuccessful.slice(0, 3).map((question, index) => (
                <div key={question.questionId} className="flex items-center justify-between p-3 border border-red-200 rounded-lg bg-red-50">
                  <div className="flex-1">
                    <p className="text-sm font-medium truncate" title={question.question}>
                      {question.question}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {question.subject}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {question.attempts} attempts
                      </span>
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <div className="text-sm font-medium text-red-600">
                      {question.successRate.toFixed(1)}% success
                    </div>
                    <Button variant="outline" size="sm" className="mt-1">
                      Review
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Render engagement metrics
  const renderEngagementMetrics = () => {
    if (!analyticsData?.studentEngagement) return null;

    const { studentEngagement } = analyticsData;

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Activity</CardTitle>
            <CardDescription>Active users and test attempts</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={studentEngagement.dailyActive}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="activeUsers" 
                  stroke={colors.primary}
                  name="Active Users"
                />
                <Line 
                  type="monotone" 
                  dataKey="testsAttempted" 
                  stroke={colors.secondary}
                  name="Tests Attempted"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Retention Rates */}
        <Card>
          <CardHeader>
            <CardTitle>Student Retention</CardTitle>
            <CardDescription>User return rates over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">1 Day Retention</span>
                <span className="text-sm">{studentEngagement.retentionRate.day1.toFixed(1)}%</span>
              </div>
              <Progress value={studentEngagement.retentionRate.day1} className="h-2" />
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">7 Day Retention</span>
                <span className="text-sm">{studentEngagement.retentionRate.day7.toFixed(1)}%</span>
              </div>
              <Progress value={studentEngagement.retentionRate.day7} className="h-2" />
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">30 Day Retention</span>
                <span className="text-sm">{studentEngagement.retentionRate.day30.toFixed(1)}%</span>
              </div>
              <Progress value={studentEngagement.retentionRate.day30} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Peak Activity Hours */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Peak Activity Hours</CardTitle>
            <CardDescription>When students are most active</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={studentEngagement.peakHours}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="hour" 
                  tickFormatter={(hour) => `${hour}:00`}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(hour) => `${hour}:00`}
                  formatter={(value) => [value, 'Activity Level']}
                />
                <Area 
                  type="monotone" 
                  dataKey="activity" 
                  stroke={colors.accent}
                  fill={colors.accent}
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Render system metrics (for admins)
  const renderSystemMetrics = () => {
    if (userType !== 'admin' || !analyticsData?.systemMetrics) return null;

    const { systemMetrics } = analyticsData;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              API Response Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemMetrics.apiResponseTime}ms</div>
            <p className="text-xs text-muted-foreground">
              <span className={systemMetrics.apiResponseTime < 200 ? 'text-green-600' : 'text-yellow-600'}>
                {systemMetrics.apiResponseTime < 200 ? 'Excellent' : 'Good'}
              </span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Database Query Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemMetrics.dbQueryTime}ms</div>
            <p className="text-xs text-muted-foreground">
              <span className={systemMetrics.dbQueryTime < 100 ? 'text-green-600' : 'text-yellow-600'}>
                {systemMetrics.dbQueryTime < 100 ? 'Optimal' : 'Acceptable'}
              </span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Error Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemMetrics.errorRate.toFixed(2)}%</div>
            <p className="text-xs text-muted-foreground">
              <span className={systemMetrics.errorRate < 1 ? 'text-green-600' : 'text-red-600'}>
                {systemMetrics.errorRate < 1 ? 'Low' : 'High'}
              </span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              System Uptime
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemMetrics.uptime.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              <span className={systemMetrics.uptime > 99 ? 'text-green-600' : 'text-yellow-600'}>
                {systemMetrics.uptime > 99 ? 'Excellent' : 'Good'}
              </span>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-8 border-destructive">
        <div className="text-center">
          <BarChart3 className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-destructive mb-2">Error Loading Analytics</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button variant="outline" onClick={fetchAnalytics}>
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive insights and performance metrics
          </p>
        </div>
        
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="1y">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Overview Cards */}
      {renderOverviewCards()}

      {/* Tabbed Analytics */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Performance</TabsTrigger>
          <TabsTrigger value="questions">Questions</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          {userType === 'admin' && <TabsTrigger value="system">System</TabsTrigger>}
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          {renderPerformanceCharts()}
        </TabsContent>
        
        <TabsContent value="questions" className="space-y-6">
          {renderQuestionAnalytics()}
        </TabsContent>
        
        <TabsContent value="engagement" className="space-y-6">
          {renderEngagementMetrics()}
        </TabsContent>
        
        {userType === 'admin' && (
          <TabsContent value="system" className="space-y-6">
            {renderSystemMetrics()}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}