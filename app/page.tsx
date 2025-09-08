'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ArrowRight, 
  BookOpen, 
  GraduationCap, 
  BarChart3, 
  Users, 
  Clock,
  Trophy,
  FileText,
  PlayCircle
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';

export default function HomePage() {
  const { user, isAuthenticated, isStudent, isAdmin, loading } = useAuth();
  const [recentMaterials, setRecentMaterials] = useState([]);
  const [upcomingTests, setUpcomingTests] = useState([]);

  useEffect(() => {
    if (isAuthenticated && user) {
      // Fetch user's recent materials and upcoming tests
      fetchDashboardData();
    }
  }, [isAuthenticated, user]);

  const fetchDashboardData = async () => {
    try {
      // Fetch materials for student's class
      if (isStudent && user?.class) {
        const materialsResponse = await fetch(`/api/materials?class=${user.class}&limit=3`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
          }
        });
        if (materialsResponse.ok) {
          const materialsData = await materialsResponse.json();
          setRecentMaterials(materialsData.materials || []);
        }

        const testsResponse = await fetch(`/api/tests?class=${user.class}&published=true&limit=3`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
          }
        });
        if (testsResponse.ok) {
          const testsData = await testsResponse.json();
          setUpcomingTests(testsData.tests || []);
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen">
        {/* Hero Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
          <div className="max-w-7xl mx-auto text-center">
            <div className="flex justify-center mb-8">
              <GraduationCap className="h-16 w-16 text-primary" />
            </div>
            <h1 className="text-4xl font-bold text-foreground tracking-tight sm:text-5xl md:text-6xl">
              Welcome to
              <span className="block text-primary mt-2">EduLMS</span>
            </h1>
            <p className="mt-6 text-xl text-muted-foreground max-w-3xl mx-auto">
              Comprehensive Learning Management System with online testing, study materials, and progress tracking for Classes 5-10
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="text-lg px-8 py-3">
                <Link href="/sign-in">
                  Sign In
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-lg px-8 py-3">
                <Link href="/sign-up">
                  Create Account
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-foreground">Everything you need to excel</h2>
              <p className="mt-4 text-xl text-muted-foreground">Powerful features designed for modern education</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <Card>
                <CardHeader>
                  <BookOpen className="h-10 w-10 text-primary mb-4" />
                  <CardTitle>Study Materials</CardTitle>
                  <CardDescription>
                    Access comprehensive study materials for all subjects with PDF viewing and download controls
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <GraduationCap className="h-10 w-10 text-primary mb-4" />
                  <CardTitle>Online Testing</CardTitle>
                  <CardDescription>
                    Take secure online tests with real-time timer, auto-save, and instant results
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <BarChart3 className="h-10 w-10 text-primary mb-4" />
                  <CardTitle>Progress Analytics</CardTitle>
                  <CardDescription>
                    Track your performance with detailed analytics and visual charts
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <Users className="h-10 w-10 text-primary mb-4" />
                  <CardTitle>Role-based Access</CardTitle>
                  <CardDescription>
                    Separate interfaces for students and administrators with appropriate permissions
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <Clock className="h-10 w-10 text-primary mb-4" />
                  <CardTitle>Real-time Features</CardTitle>
                  <CardDescription>
                    Live timer synchronization and auto-save functionality during tests
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <Trophy className="h-10 w-10 text-primary mb-4" />
                  <CardTitle>Achievements</CardTitle>
                  <CardDescription>
                    Earn achievements and track your learning milestones
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>
      </main>
    );
  }

  // Authenticated user dashboard
  return (
    <main className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-muted-foreground mt-2">
            {isAdmin ? 'Manage your learning platform' : `Class ${user?.class} • Continue your learning journey`}
          </p>
        </div>

        {isStudent && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Quick Actions */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <PlayCircle className="mr-2 h-5 w-5" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Button asChild className="h-auto p-4 justify-start">
                      <Link href="/materials">
                        <div className="flex flex-col items-start">
                          <FileText className="h-6 w-6 mb-2" />
                          <span className="font-medium">Study Materials</span>
                          <span className="text-sm text-muted-foreground">Browse learning resources</span>
                        </div>
                      </Link>
                    </Button>
                    
                    <Button asChild variant="outline" className="h-auto p-4 justify-start">
                      <Link href="/tests">
                        <div className="flex flex-col items-start">
                          <GraduationCap className="h-6 w-6 mb-2" />
                          <span className="font-medium">Take Test</span>
                          <span className="text-sm text-muted-foreground">Start a new assessment</span>
                        </div>
                      </Link>
                    </Button>
                    
                    <Button asChild variant="outline" className="h-auto p-4 justify-start">
                      <Link href="/dashboard">
                        <div className="flex flex-col items-start">
                          <BarChart3 className="h-6 w-6 mb-2" />
                          <span className="font-medium">View Progress</span>
                          <span className="text-sm text-muted-foreground">Check your performance</span>
                        </div>
                      </Link>
                    </Button>
                    
                    <Button asChild variant="outline" className="h-auto p-4 justify-start">
                      <Link href="/profile">
                        <div className="flex flex-col items-start">
                          <Users className="h-6 w-6 mb-2" />
                          <span className="font-medium">Profile</span>
                          <span className="text-sm text-muted-foreground">Update your details</span>
                        </div>
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Stats */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Your Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tests Taken</span>
                    <span className="font-medium">0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Average Score</span>
                    <span className="font-medium">-</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Materials Read</span>
                    <span className="font-medium">0</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {isAdmin && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">Registered users</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Tests</CardTitle>
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">Published assessments</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Study Materials</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">Available resources</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Test Attempts</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">This month</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {isStudent && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Recent Study Materials</CardTitle>
                  <CardDescription>Latest materials for your class</CardDescription>
                </CardHeader>
                <CardContent>
                  {recentMaterials.length > 0 ? (
                    <div className="space-y-4">
                      {recentMaterials.slice(0, 3).map((material: any) => (
                        <div key={material._id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{material.title}</p>
                            <p className="text-sm text-muted-foreground">{material.subject?.name}</p>
                          </div>
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/materials/${material._id}`}>View</Link>
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No materials available yet</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Upcoming Tests</CardTitle>
                  <CardDescription>Available assessments</CardDescription>
                </CardHeader>
                <CardContent>
                  {upcomingTests.length > 0 ? (
                    <div className="space-y-4">
                      {upcomingTests.slice(0, 3).map((test: any) => (
                        <div key={test._id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{test.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {test.subject?.name} • {test.duration} min
                            </p>
                          </div>
                          <Button asChild size="sm">
                            <Link href={`/tests/${test._id}`}>Start</Link>
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No tests available yet</p>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {isAdmin && (
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Admin Quick Actions</CardTitle>
                <CardDescription>Manage your learning platform</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button asChild className="h-auto p-4">
                    <Link href="/admin/materials">
                      <div className="flex flex-col items-center">
                        <BookOpen className="h-8 w-8 mb-2" />
                        <span>Materials</span>
                      </div>
                    </Link>
                  </Button>
                  
                  <Button asChild variant="outline" className="h-auto p-4">
                    <Link href="/admin/tests">
                      <div className="flex flex-col items-center">
                        <GraduationCap className="h-8 w-8 mb-2" />
                        <span>Tests</span>
                      </div>
                    </Link>
                  </Button>
                  
                  <Button asChild variant="outline" className="h-auto p-4">
                    <Link href="/admin/users">
                      <div className="flex flex-col items-center">
                        <Users className="h-8 w-8 mb-2" />
                        <span>Users</span>
                      </div>
                    </Link>
                  </Button>
                  
                  <Button asChild variant="outline" className="h-auto p-4">
                    <Link href="/admin/analytics">
                      <div className="flex flex-col items-center">
                        <BarChart3 className="h-8 w-8 mb-2" />
                        <span>Analytics</span>
                      </div>
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </main>
  );
}