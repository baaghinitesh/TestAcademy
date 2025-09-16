'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { GraduationCap, BookOpen, FileText, TrendingUp, Users, Award, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function HomePage() {
  const [user, setUser] = useState<{name: string; email: string; role: string} | null>(null);
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

  const classes = [
    { number: 5, title: 'Class 5', description: 'Foundation Learning', color: 'bg-blue-500' },
    { number: 6, title: 'Class 6', description: 'Building Concepts', color: 'bg-green-500' },
    { number: 7, title: 'Class 7', description: 'Expanding Knowledge', color: 'bg-yellow-500' },
    { number: 8, title: 'Class 8', description: 'Advanced Topics', color: 'bg-orange-500' },
    { number: 9, title: 'Class 9', description: 'Preparation Phase', color: 'bg-purple-500' },
    { number: 10, title: 'Class 10', description: 'Board Preparation', color: 'bg-red-500' },
  ];

  const features = [
    {
      icon: BookOpen,
      title: 'Study Materials',
      description: 'Comprehensive notes, books, and resources for all subjects'
    },
    {
      icon: FileText,
      title: 'Online Tests',
      description: 'Practice tests with instant results and detailed analysis'
    },
    {
      icon: TrendingUp,
      title: 'Performance Analytics',
      description: 'Track your progress with detailed charts and insights'
    },
    {
      icon: Award,
      title: 'Achievement System',
      description: 'Earn badges and track your learning milestones'
    }
  ];

  const stats = [
    { value: '10,000+', label: 'Students' },
    { value: '500+', label: 'Tests Available' },
    { value: '1000+', label: 'Study Materials' },
    { value: '95%', label: 'Success Rate' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-secondary/10">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex justify-center mb-6">
              <div className="flex items-center justify-center w-16 h-16 bg-primary rounded-full">
                <GraduationCap className="h-8 w-8 text-primary-foreground" />
              </div>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
              Welcome to{' '}
              <span className="text-primary">EduTest</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Study & Test Platform for Classes 5–10
            </p>
            
            <p className="text-lg text-muted-foreground mb-12 max-w-3xl mx-auto">
              Comprehensive learning platform with interactive study materials, practice tests, 
              and detailed performance analytics to help you excel in your academics.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {user ? (
                <>
                  <Link href="/study">
                    <Button size="lg" className="w-full sm:w-auto">
                      <BookOpen className="mr-2 h-5 w-5" />
                      Start Studying
                    </Button>
                  </Link>
                  <Link href="/test">
                    <Button size="lg" variant="outline" className="w-full sm:w-auto">
                      <FileText className="mr-2 h-5 w-5" />
                      Take Test
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/sign-up">
                    <Button size="lg" className="w-full sm:w-auto">
                      Get Started Free
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <Link href="/sign-in">
                    <Button size="lg" variant="outline" className="w-full sm:w-auto">
                      Sign In
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary mb-2">
                  {stat.value}
                </div>
                <div className="text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Class Cards Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Choose Your Class
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Select your class to access tailored study materials and tests
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {classes.map((classItem) => (
              <Link key={classItem.number} href={`/class/${classItem.number}`}>
                <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <CardHeader className="text-center">
                    <div className={`w-16 h-16 ${classItem.color} rounded-full flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                      {classItem.number}
                    </div>
                    <CardTitle className="text-2xl">{classItem.title}</CardTitle>
                    <CardDescription className="text-lg">
                      {classItem.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-center">
                    <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground">
                      Explore Class {classItem.number}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Why Choose EduTest?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need to excel in your studies
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center">
                <CardHeader>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!user && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                Ready to Start Learning?
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                Join thousands of students who are already improving their grades with EduTest
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/sign-up">
                  <Button size="lg" className="w-full sm:w-auto">
                    Create Free Account
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/study">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto">
                    Browse Materials
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}