'use client';

import { useState, useEffect } from 'react';
import { 
  Users, 
  BookOpen, 
  FileQuestion, 
  GraduationCap, 
  ClipboardCheck,
  Upload,
  BarChart3,
  Settings,
  Plus,
  TrendingUp,
  Activity,
  Clock,
  Calendar
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface DashboardStats {
  totalUsers: number;
  totalStudents: number;
  totalQuestions: number;
  totalTests: number;
  totalMaterials: number;
  totalSubjects: number;
  activeTests: number;
  recentActivity: RecentActivity[];
  upcomingTests: UpcomingTest[];
  systemHealth: SystemHealth;
}

interface RecentActivity {
  id: string;
  type: 'user_created' | 'test_created' | 'question_added' | 'material_uploaded';
  message: string;
  timestamp: string;
  user?: string;
}

interface UpcomingTest {
  id: string;
  title: string;
  subject: string;
  classNumber: number;
  startTime: string;
  duration: number;
  status: 'scheduled' | 'active' | 'completed';
}

interface SystemHealth {
  database: 'healthy' | 'warning' | 'error';
  storage: 'healthy' | 'warning' | 'error';
  performance: 'good' | 'moderate' | 'poor';
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // This would be replaced with actual API calls
      const mockStats: DashboardStats = {
        totalUsers: 1250,
        totalStudents: 1180,
        totalQuestions: 2450,
        totalTests: 156,
        totalMaterials: 340,
        totalSubjects: 12,
        activeTests: 8,
        recentActivity: [
          {
            id: '1',
            type: 'test_created',
            message: 'New Mathematics test created for Class 10',
            timestamp: '2 minutes ago',
            user: 'Admin'
          },
          {
            id: '2',
            type: 'user_created',
            message: 'New student registered: John Doe',
            timestamp: '15 minutes ago',
            user: 'System'
          },
          {
            id: '3',
            type: 'material_uploaded',
            message: 'Physics notes uploaded for Class 9',
            timestamp: '1 hour ago',
            user: 'Admin'
          }
        ],
        upcomingTests: [
          {
            id: '1',
            title: 'Mathematics - Algebra',
            subject: 'Mathematics',
            classNumber: 10,
            startTime: '2024-12-16T10:00:00',
            duration: 60,
            status: 'scheduled'
          },
          {
            id: '2',
            title: 'Physics - Motion',
            subject: 'Physics',
            classNumber: 9,
            startTime: '2024-12-16T14:00:00',
            duration: 90,
            status: 'scheduled'
          }
        ],
        systemHealth: {
          database: 'healthy',
          storage: 'healthy',
          performance: 'good'
        }
      };
      
      setStats(mockStats);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user_created':
        return <Users className="h-4 w-4" />;
      case 'test_created':
        return <ClipboardCheck className="h-4 w-4" />;
      case 'question_added':
        return <FileQuestion className="h-4 w-4" />;
      case 'material_uploaded':
        return <Upload className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'good':
        return 'text-green-600 bg-green-100';
      case 'warning':
      case 'moderate':
        return 'text-yellow-600 bg-yellow-100';
      case 'error':
      case 'poor':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive management center for your learning platform
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex flex-wrap gap-2">
          <Button className="flex items-center gap-2" size="sm">
            <Plus className="h-4 w-4" />
            Quick Actions
          </Button>
          <Button variant="outline" className="flex items-center gap-2" size="sm">
            <BarChart3 className="h-4 w-4" />
            Reports
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:gap-6 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalStudents} students
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Questions</CardTitle>
            <FileQuestion className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalQuestions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Across all subjects
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tests</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeTests}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalTests} total
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Materials</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMaterials}</div>
            <p className="text-xs text-muted-foreground">
              PDFs, videos & more
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="tests">Tests</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:gap-6 lg:grid-cols-3">
            {/* Quick Actions */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start" variant="outline">
                  <Users className="h-4 w-4 mr-2" />
                  Manage Users
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <FileQuestion className="h-4 w-4 mr-2" />
                  Add Questions
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <ClipboardCheck className="h-4 w-4 mr-2" />
                  Create Test
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Materials
                </Button>
              </CardContent>
            </Card>

            {/* Subject Distribution */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5" />
                  Subject Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { name: 'Mathematics', questions: 680, tests: 45, color: 'bg-blue-500' },
                    { name: 'Physics', questions: 520, tests: 35, color: 'bg-green-500' },
                    { name: 'Chemistry', questions: 480, tests: 32, color: 'bg-purple-500' },
                    { name: 'Biology', questions: 420, tests: 28, color: 'bg-red-500' },
                    { name: 'English', questions: 350, tests: 16, color: 'bg-yellow-500' }
                  ].map((subject) => (
                    <div key={subject.name} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${subject.color}`}></div>
                        <span className="font-medium">{subject.name}</span>
                      </div>
                      <div className="flex space-x-4 text-sm text-muted-foreground">
                        <span>{subject.questions} questions</span>
                        <span>{subject.tests} tests</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center space-x-3 p-3 rounded-lg bg-muted/50">
                    <div className="p-2 rounded-full bg-primary/10">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.message}</p>
                      <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
                    </div>
                    {activity.user && (
                      <Badge variant="secondary">{activity.user}</Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Upcoming Tests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.upcomingTests.map((test) => (
                  <div key={test.id} className="flex items-center justify-between p-4 rounded-lg border">
                    <div className="space-y-1">
                      <h4 className="font-medium">{test.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {test.subject} • Class {test.classNumber} • {test.duration} minutes
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(test.startTime).toLocaleString()}
                      </p>
                    </div>
                    <Badge 
                      variant={test.status === 'active' ? 'default' : 'secondary'}
                      className="capitalize"
                    >
                      {test.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                System Health
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Database Status</span>
                  <Badge className={getStatusColor(stats.systemHealth.database)}>
                    {stats.systemHealth.database}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Storage Status</span>
                  <Badge className={getStatusColor(stats.systemHealth.storage)}>
                    {stats.systemHealth.storage}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Performance</span>
                  <Badge className={getStatusColor(stats.systemHealth.performance)}>
                    {stats.systemHealth.performance}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}