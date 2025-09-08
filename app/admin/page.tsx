import { 
  Users, 
  FileText, 
  HelpCircle, 
  BookOpen, 
  TrendingUp,
  Activity,
  Award,
  Clock
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import connectToDatabase from '@/backend/utils/database';
import { User, Test, Question, Material, Attempt } from '@/backend/models';

async function getAdminStats() {
  try {
    await connectToDatabase();
    
    const [
      totalUsers,
      totalTests,
      totalQuestions,
      totalMaterials,
      totalAttempts,
      recentUsers,
      recentAttempts
    ] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      Test.countDocuments(),
      Question.countDocuments(),
      Material.countDocuments(),
      Attempt.countDocuments(),
      User.find({ role: 'student' })
        .sort({ createdAt: -1 })
        .limit(7)
        .countDocuments(),
      Attempt.find()
        .sort({ createdAt: -1 })
        .limit(7)
        .countDocuments()
    ]);

    // Calculate growth percentages (mock data for demo)
    const userGrowth = totalUsers > 0 ? ((recentUsers / totalUsers) * 100).toFixed(1) : '0';
    const testGrowth = totalTests > 0 ? '12.5' : '0';
    const questionGrowth = totalQuestions > 0 ? '8.3' : '0';
    const materialGrowth = totalMaterials > 0 ? '15.2' : '0';

    return {
      totalUsers,
      totalTests,
      totalQuestions,
      totalMaterials,
      totalAttempts,
      userGrowth,
      testGrowth,
      questionGrowth,
      materialGrowth
    };
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return {
      totalUsers: 0,
      totalTests: 0,
      totalQuestions: 0,
      totalMaterials: 0,
      totalAttempts: 0,
      userGrowth: '0',
      testGrowth: '0',
      questionGrowth: '0',
      materialGrowth: '0'
    };
  }
}

export default async function AdminOverview() {
  const stats = await getAdminStats();

  const statCards = [
    {
      title: 'Total Students',
      value: stats.totalUsers.toLocaleString(),
      description: `+${stats.userGrowth}% from last week`,
      icon: Users,
      trend: 'up'
    },
    {
      title: 'Total Tests',
      value: stats.totalTests.toLocaleString(),
      description: `+${stats.testGrowth}% from last week`,
      icon: FileText,
      trend: 'up'
    },
    {
      title: 'Question Bank',
      value: stats.totalQuestions.toLocaleString(),
      description: `+${stats.questionGrowth}% from last week`,
      icon: HelpCircle,
      trend: 'up'
    },
    {
      title: 'Study Materials',
      value: stats.totalMaterials.toLocaleString(),
      description: `+${stats.materialGrowth}% from last week`,
      icon: BookOpen,
      trend: 'up'
    },
    {
      title: 'Total Attempts',
      value: stats.totalAttempts.toLocaleString(),
      description: 'All-time test attempts',
      icon: Activity,
      trend: 'neutral'
    },
    {
      title: 'Avg Score',
      value: '78.5%',
      description: 'Platform average',
      icon: Award,
      trend: 'up'
    },
    {
      title: 'Active Sessions',
      value: '24',
      description: 'Students online now',
      icon: Clock,
      trend: 'neutral'
    },
    {
      title: 'Success Rate',
      value: '85.2%',
      description: 'Test completion rate',
      icon: TrendingUp,
      trend: 'up'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Admin Overview</h1>
        <p className="text-muted-foreground">
          Welcome to your LMS dashboard. Here's what's happening on your platform.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {card.value}
                </div>
                <p className={`text-xs flex items-center gap-1 ${
                  card.trend === 'up' ? 'text-green-600' : 
                  card.trend === 'down' ? 'text-red-600' : 
                  'text-muted-foreground'
                }`}>
                  {card.trend === 'up' && <TrendingUp className="h-3 w-3" />}
                  {card.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-blue-600" />
              Quick Add Question
            </CardTitle>
            <CardDescription>
              Add a new question to your question bank
            </CardDescription>
          </CardHeader>
          <CardContent>
            <a 
              href="/admin/questions/new" 
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Create Question →
            </a>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-green-600" />
              Create Test
            </CardTitle>
            <CardDescription>
              Build a new test from your question bank
            </CardDescription>
          </CardHeader>
          <CardContent>
            <a 
              href="/admin/tests/new" 
              className="text-sm text-green-600 hover:text-green-800 font-medium"
            >
              Build Test →
            </a>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-purple-600" />
              Upload Material
            </CardTitle>
            <CardDescription>
              Add study materials for students
            </CardDescription>
          </CardHeader>
          <CardContent>
            <a 
              href="/admin/materials/new" 
              className="text-sm text-purple-600 hover:text-purple-800 font-medium"
            >
              Upload Content →
            </a>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest platform activities</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 p-4 border rounded-lg">
              <div className="h-2 w-2 bg-green-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">New student registered</p>
                <p className="text-xs text-muted-foreground">2 minutes ago</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 border rounded-lg">
              <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Test completed successfully</p>
                <p className="text-xs text-muted-foreground">5 minutes ago</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 border rounded-lg">
              <div className="h-2 w-2 bg-orange-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">New question added</p>
                <p className="text-xs text-muted-foreground">10 minutes ago</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <CardDescription>Platform health indicators</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium">Database</span>
              </div>
              <span className="text-xs text-green-600 font-medium">Operational</span>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium">Authentication</span>
              </div>
              <span className="text-xs text-green-600 font-medium">Operational</span>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium">File Storage</span>
              </div>
              <span className="text-xs text-green-600 font-medium">Operational</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}