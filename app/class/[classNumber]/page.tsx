'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { BookOpen, FileText, ArrowRight, Users, Trophy, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function ClassPage() {
  const params = useParams();
  const router = useRouter();
  const classNumber = parseInt(params.classNumber as string);
  
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user data
        const userResponse = await fetch('/api/auth/me');
        if (userResponse.ok) {
          const userData = await userResponse.json();
          setUser(userData.user);
        }

        // Fetch subjects for this class
        const subjectsResponse = await fetch(`/api/subjects?class=${classNumber}`);
        if (subjectsResponse.ok) {
          const subjectsData = await subjectsResponse.json();
          setSubjects(subjectsData.subjects || []);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (classNumber >= 5 && classNumber <= 10) {
      fetchData();
    } else {
      router.push('/');
    }
  }, [classNumber, router]);

  const defaultSubjects = [
    { 
      name: 'Mathematics', 
      description: 'Algebra, Geometry, Arithmetic & Problem Solving',
      icon: '📐',
      color: 'bg-blue-500',
      stats: { materials: 45, tests: 12 }
    },
    { 
      name: 'Science', 
      description: 'Physics, Chemistry, Biology & Experiments',
      icon: '🔬',
      color: 'bg-green-500',
      stats: { materials: 38, tests: 10 }
    },
    { 
      name: 'English', 
      description: 'Grammar, Literature, Comprehension & Writing',
      icon: '📚',
      color: 'bg-purple-500',
      stats: { materials: 32, tests: 8 }
    },
    { 
      name: 'Social Studies', 
      description: 'History, Geography, Civics & Economics',
      icon: '🌍',
      color: 'bg-orange-500',
      stats: { materials: 28, tests: 7 }
    },
    { 
      name: 'Hindi', 
      description: 'व्याकरण, साहित्य, गद्य एवं पद्य',
      icon: '🗣️',
      color: 'bg-red-500',
      stats: { materials: 25, tests: 6 }
    }
  ];

  const classInfo = {
    5: { title: 'Class 5', subtitle: 'Foundation Learning', description: 'Building strong fundamentals for future learning' },
    6: { title: 'Class 6', subtitle: 'Building Concepts', description: 'Developing conceptual understanding across subjects' },
    7: { title: 'Class 7', subtitle: 'Expanding Knowledge', description: 'Exploring advanced topics and applications' },
    8: { title: 'Class 8', subtitle: 'Advanced Topics', description: 'Preparing for higher secondary education' },
    9: { title: 'Class 9', subtitle: 'Preparation Phase', description: 'Foundation for board examinations' },
    10: { title: 'Class 10', subtitle: 'Board Preparation', description: 'Final preparation for board examinations' }
  };

  const currentClass = classInfo[classNumber as keyof typeof classInfo];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!currentClass) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Class Not Found</h1>
          <Link href="/">
            <Button>Go Back Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header Section */}
      <section className="bg-gradient-to-r from-primary/10 to-secondary/10 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center text-white font-bold text-3xl">
                {classNumber}
              </div>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              {currentClass.title}
            </h1>
            
            <p className="text-xl md:text-2xl text-primary mb-4">
              {currentClass.subtitle}
            </p>
            
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              {currentClass.description}
            </p>

            {user && user.role === 'student' && user.class === classNumber && (
              <Badge variant="secondary" className="text-sm">
                <Users className="w-4 h-4 mr-1" />
                Your Class
              </Badge>
            )}
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="py-8 border-b">
        <div className="container mx-auto px-4">
          <div className="flex justify-center gap-4">
            <Link href={`/study?class=${classNumber}`}>
              <Button variant="outline" size="lg">
                <BookOpen className="mr-2 h-5 w-5" />
                Study Materials
              </Button>
            </Link>
            <Link href={`/test?class=${classNumber}`}>
              <Button size="lg">
                <FileText className="mr-2 h-5 w-5" />
                Take Tests
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Subjects Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Available Subjects
            </h2>
            <p className="text-xl text-muted-foreground">
              Choose a subject to access study materials and tests
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {defaultSubjects.map((subject, index) => (
              <Card key={subject.name} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <CardHeader className="text-center">
                  <div className={`w-16 h-16 ${subject.color} rounded-full flex items-center justify-center text-2xl mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                    {subject.icon}
                  </div>
                  <CardTitle className="text-xl">{subject.name}</CardTitle>
                  <CardDescription className="text-sm">
                    {subject.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{subject.stats.materials} Materials</span>
                    <span>{subject.stats.tests} Tests</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <Link href={`/study/${classNumber}/${subject.name.toLowerCase().replace(' ', '-')}`}>
                      <Button variant="outline" size="sm" className="w-full">
                        <BookOpen className="mr-1 h-3 w-3" />
                        Study
                      </Button>
                    </Link>
                    <Link href={`/test/${classNumber}/${subject.name.toLowerCase().replace(' ', '-')}`}>
                      <Button size="sm" className="w-full">
                        <FileText className="mr-1 h-3 w-3" />
                        Test
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Performance Section (for logged in users) */}
      {user && (
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
                Your Performance in {currentClass.title}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="text-center">
                  <CardHeader>
                    <Trophy className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                    <CardTitle>Tests Completed</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-primary">12</div>
                    <p className="text-sm text-muted-foreground">out of 43 available</p>
                  </CardContent>
                </Card>
                
                <Card className="text-center">
                  <CardHeader>
                    <Clock className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                    <CardTitle>Average Score</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-primary">78%</div>
                    <p className="text-sm text-muted-foreground">across all subjects</p>
                  </CardContent>
                </Card>
                
                <Card className="text-center">
                  <CardHeader>
                    <BookOpen className="w-8 h-8 text-green-500 mx-auto mb-2" />
                    <CardTitle>Study Time</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-primary">24h</div>
                    <p className="text-sm text-muted-foreground">this month</p>
                  </CardContent>
                </Card>
              </div>
              
              <div className="text-center mt-8">
                <Link href="/dashboard">
                  <Button variant="outline">
                    View Detailed Analytics
                    <ArrowRight className="ml-2 h-4 w-4" />
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