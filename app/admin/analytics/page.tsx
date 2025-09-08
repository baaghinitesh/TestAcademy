'use client';

import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Users, 
  Target, 
  Clock,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Award
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';

const monthlyData = [
  { name: 'Jan', users: 65, tests: 120, avg_score: 78 },
  { name: 'Feb', users: 72, tests: 135, avg_score: 82 },
  { name: 'Mar', users: 89, tests: 180, avg_score: 85 },
  { name: 'Apr', users: 95, tests: 210, avg_score: 79 },
  { name: 'May', users: 108, tests: 240, avg_score: 88 },
  { name: 'Jun', users: 125, tests: 290, avg_score: 91 },
];

const subjectPerformance = [
  { subject: 'Mathematics', average: 82, attempts: 450, color: '#3b82f6' },
  { subject: 'Science', average: 78, attempts: 380, color: '#10b981' },
  { subject: 'English', average: 85, attempts: 420, color: '#f59e0b' },
  { subject: 'Social Studies', average: 76, attempts: 320, color: '#8b5cf6' },
  { subject: 'Hindi', average: 79, attempts: 280, color: '#ef4444' },
];

const classDistribution = [
  { name: 'Class 5', value: 45, color: '#3b82f6' },
  { name: 'Class 6', value: 52, color: '#10b981' },
  { name: 'Class 7', value: 38, color: '#f59e0b' },
  { name: 'Class 8', value: 41, color: '#8b5cf6' },
  { name: 'Class 9', value: 35, color: '#ef4444' },
  { name: 'Class 10', value: 29, color: '#06b6d4' },
];

const difficultyAnalysis = [
  { difficulty: 'Easy', score: 85, attempts: 520, fullMark: 100 },
  { difficulty: 'Medium', score: 72, attempts: 380, fullMark: 100 },
  { difficulty: 'Hard', score: 58, attempts: 210, fullMark: 100 },
];

const weeklyActivity = [
  { day: 'Mon', active_users: 145, test_attempts: 89, study_sessions: 203 },
  { day: 'Tue', active_users: 132, test_attempts: 76, study_sessions: 189 },
  { day: 'Wed', active_users: 158, test_attempts: 94, study_sessions: 234 },
  { day: 'Thu', active_users: 142, test_attempts: 87, study_sessions: 198 },
  { day: 'Fri', active_users: 139, test_attempts: 82, study_sessions: 187 },
  { day: 'Sat', active_users: 98, test_attempts: 124, study_sessions: 167 },
  { day: 'Sun', active_users: 87, test_attempts: 115, study_sessions: 145 },
];

export default function AnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState('7d');
  const [loading, setLoading] = useState(false);

  const totalUsers = classDistribution.reduce((sum, item) => sum + item.value, 0);
  const totalAttempts = subjectPerformance.reduce((sum, item) => sum + item.attempts, 0);
  const avgPerformance = Math.round(
    subjectPerformance.reduce((sum, item) => sum + item.average, 0) / subjectPerformance.length
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive insights into platform performance and user engagement
          </p>
        </div>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="flex h-10 w-32 rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
          <option value="1y">Last year</option>
        </select>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <p className="text-xs text-green-600 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              +12.5% from last month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Test Attempts</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAttempts.toLocaleString()}</div>
            <p className="text-xs text-green-600 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              +8.2% from last month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Performance</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgPerformance}%</div>
            <p className="text-xs text-green-600 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              +2.1% from last month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,234</div>
            <p className="text-xs text-blue-600 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Real-time data
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Monthly Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Monthly Trends
            </CardTitle>
            <CardDescription>User growth and test activity over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="users" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  name="New Users"
                />
                <Line 
                  type="monotone" 
                  dataKey="tests" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  name="Test Attempts"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Class Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5" />
              Student Distribution by Class
            </CardTitle>
            <CardDescription>Current enrollment across different classes</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={classDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {classDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Subject Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Subject-wise Performance</CardTitle>
            <CardDescription>Average scores and attempt counts by subject</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={subjectPerformance} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} />
                <YAxis dataKey="subject" type="category" width={100} />
                <Tooltip />
                <Bar dataKey="average" fill="#3b82f6" name="Average Score %" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Weekly Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Weekly Activity Pattern</CardTitle>
            <CardDescription>Daily active users and engagement metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weeklyActivity}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="active_users" fill="#3b82f6" name="Active Users" />
                <Bar dataKey="test_attempts" fill="#10b981" name="Test Attempts" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Top Performing Students */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performers</CardTitle>
            <CardDescription>Students with highest average scores</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { name: 'Arjun Sharma', class: 10, score: 95.5, tests: 12 },
              { name: 'Priya Patel', class: 9, score: 93.2, tests: 15 },
              { name: 'Rohit Kumar', class: 10, score: 91.8, tests: 18 },
              { name: 'Sneha Gupta', class: 8, score: 90.4, tests: 14 },
              { name: 'Vikash Singh', class: 9, score: 89.7, tests: 16 }
            ].map((student, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-full text-sm font-semibold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{student.name}</p>
                    <p className="text-xs text-muted-foreground">Class {student.class} • {student.tests} tests</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-green-600">{student.score}%</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Difficult Topics */}
        <Card>
          <CardHeader>
            <CardTitle>Areas of Improvement</CardTitle>
            <CardDescription>Topics with lowest average scores</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { topic: 'Quadratic Equations', subject: 'Math', avg: 62.3, attempts: 89 },
              { topic: 'Organic Chemistry', subject: 'Science', avg: 65.1, attempts: 76 },
              { topic: 'Constitutional Law', subject: 'Social', avg: 67.8, attempts: 54 },
              { topic: 'Grammar Rules', subject: 'English', avg: 69.2, attempts: 92 },
              { topic: 'Probability', subject: 'Math', avg: 71.5, attempts: 68 }
            ].map((topic, index) => (
              <div key={index} className="p-3 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-sm">{topic.topic}</h4>
                  <span className="text-red-600 font-semibold text-sm">{topic.avg}%</span>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{topic.subject}</span>
                  <span>{topic.attempts} attempts</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-red-500 h-2 rounded-full" 
                    style={{ width: `${topic.avg}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Activity Feed */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest platform activities and updates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { type: 'test_completed', user: 'Rahul M.', action: 'completed Math Test', time: '2 min ago', score: 85 },
              { type: 'new_user', user: 'Pooja S.', action: 'joined Class 8', time: '5 min ago' },
              { type: 'material_viewed', user: 'Amit K.', action: 'viewed Science notes', time: '8 min ago' },
              { type: 'test_completed', user: 'Neha R.', action: 'completed English Test', time: '12 min ago', score: 92 },
              { type: 'new_user', user: 'Karan T.', action: 'joined Class 9', time: '15 min ago' }
            ].map((activity, index) => (
              <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                <div className={`h-2 w-2 rounded-full mt-2 ${
                  activity.type === 'test_completed' ? 'bg-blue-500' :
                  activity.type === 'new_user' ? 'bg-green-500' : 'bg-orange-500'
                }`}></div>
                <div className="flex-1">
                  <p className="text-sm">
                    <span className="font-medium">{activity.user}</span> {activity.action}
                    {activity.score && (
                      <span className="text-green-600 font-medium"> (Score: {activity.score}%)</span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}