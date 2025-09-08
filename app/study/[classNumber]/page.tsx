'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { BookOpen, FileText, Users, Clock, Star, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function ClassStudyPage() {
  const params = useParams();
  const classNumber = params.classNumber as string;
  
  const [user, setUser] = useState<any>(null);
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

  const classInfo = {
    5: { title: 'Class 5', description: 'Foundation Learning', color: 'bg-blue-500' },
    6: { title: 'Class 6', description: 'Building Concepts', color: 'bg-green-500' },
    7: { title: 'Class 7', description: 'Expanding Knowledge', color: 'bg-yellow-500' },
    8: { title: 'Class 8', description: 'Advanced Topics', color: 'bg-orange-500' },
    9: { title: 'Class 9', description: 'Preparation Phase', color: 'bg-purple-500' },
    10: { title: 'Class 10', description: 'Board Preparation', color: 'bg-red-500' }
  };

  const subjects = [
    {
      name: 'Mathematics',
      description: 'Numbers, Algebra, Geometry, and Problem Solving',
      icon: '📐',
      materials: 45,
      chapters: 12,
      color: 'from-blue-500 to-blue-600',
      sections: ['Study Notes', 'Reference Books', 'Practice PDFs', 'Formula Sheets']
    },
    {
      name: 'Science',
      description: 'Physics, Chemistry, and Biology Concepts',
      icon: '🔬',
      materials: 38,
      chapters: 10,
      color: 'from-green-500 to-green-600',
      sections: ['Study Notes', 'Lab Manuals', 'Reference Books', 'Diagrams']
    },
    {
      name: 'English',
      description: 'Language, Literature, and Communication Skills',
      icon: '📚',
      materials: 32,
      chapters: 8,
      color: 'from-purple-500 to-purple-600',
      sections: ['Study Notes', 'Literature Books', 'Grammar PDFs', 'Writing Guides']
    },
    {
      name: 'Social Studies',
      description: 'History, Geography, and Civics',
      icon: '🌍',
      materials: 28,
      chapters: 9,
      color: 'from-orange-500 to-orange-600',
      sections: ['Study Notes', 'Maps', 'Reference Books', 'Timeline Charts']
    },
    {
      name: 'Hindi',
      description: 'Language, Literature, and Grammar',
      icon: '🇮🇳',
      materials: 25,
      chapters: 7,
      color: 'from-red-500 to-red-600',
      sections: ['Study Notes', 'Literature Books', 'Grammar PDFs', 'Poetry Collection']
    }
  ];

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
          <h1 className="text-2xl font-bold text-foreground mb-4">Class Not Found</h1>
          <Link href="/study">
            <Button>Back to Study Materials</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header Section */}
      <section className={`bg-gradient-to-r ${currentClass.color} to-opacity-80 py-16 text-white`}>
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center mb-6">
              <Link href="/study">
                <Button variant="outline" size="sm" className="text-white border-white hover:bg-white hover:text-foreground mr-4">
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Back
                </Button>
              </Link>
              
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mr-4">
                <span className="text-2xl font-bold">{classNumber}</span>
              </div>
              
              <div>
                <h1 className="text-3xl md:text-4xl font-bold">{currentClass.title}</h1>
                <p className="text-xl opacity-90">{currentClass.description}</p>
              </div>
            </div>

            {user && user.role === 'student' && user.class.toString() === classNumber && (
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                <Users className="w-4 h-4 mr-1" />
                Your Class
              </Badge>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <div className="bg-white/10 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold">{subjects.length}</div>
                <div className="text-sm opacity-80">Subjects</div>
              </div>
              <div className="bg-white/10 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold">{subjects.reduce((sum, s) => sum + s.materials, 0)}</div>
                <div className="text-sm opacity-80">Study Materials</div>
              </div>
              <div className="bg-white/10 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold">{subjects.reduce((sum, s) => sum + s.chapters, 0)}</div>
                <div className="text-sm opacity-80">Total Chapters</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Subjects Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Choose a Subject
              </h2>
              <p className="text-xl text-muted-foreground">
                Access comprehensive study materials for each subject
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {subjects.map((subject) => (
                <Link key={subject.name} href={`/study/${classNumber}/${subject.name.toLowerCase().replace(' ', '-')}`}>
                  <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 h-full">
                    <CardHeader className="text-center pb-4">
                      <div className={`w-20 h-20 bg-gradient-to-br ${subject.color} rounded-full flex items-center justify-center text-white text-3xl mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                        {subject.icon}
                      </div>
                      <CardTitle className="text-2xl group-hover:text-primary transition-colors">
                        {subject.name}
                      </CardTitle>
                      <CardDescription className="text-base">
                        {subject.description}
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div className="bg-muted rounded-lg p-3">
                          <div className="font-bold text-lg">{subject.materials}</div>
                          <div className="text-sm text-muted-foreground">Materials</div>
                        </div>
                        <div className="bg-muted rounded-lg p-3">
                          <div className="font-bold text-lg">{subject.chapters}</div>
                          <div className="text-sm text-muted-foreground">Chapters</div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="text-sm font-medium text-muted-foreground">Available Sections:</div>
                        <div className="flex flex-wrap gap-1">
                          {subject.sections.map((section) => (
                            <Badge key={section} variant="outline" className="text-xs">
                              {section}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <Button className="w-full group-hover:bg-primary group-hover:text-primary-foreground">
                        <BookOpen className="mr-2 h-4 w-4" />
                        Access Materials
                      </Button>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Study Tips Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-8">Study Tips for {currentClass.title}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold mb-2">Time Management</h3>
                  <p className="text-sm text-muted-foreground">
                    Allocate specific time slots for each subject daily
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="font-semibold mb-2">Active Notes</h3>
                  <p className="text-sm text-muted-foreground">
                    Make summary notes while reading materials
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Star className="w-6 h-6 text-purple-600" />
                  </div>
                  <h3 className="font-semibold mb-2">Regular Practice</h3>
                  <p className="text-sm text-muted-foreground">
                    Practice problems and take tests regularly
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}