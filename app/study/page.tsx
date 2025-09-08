'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { BookOpen, Users, FileText, Download, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function StudyPage() {
  const searchParams = useSearchParams();
  const selectedClass = searchParams.get('class');
  
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

  const classes = [
    { 
      number: 5, 
      title: 'Class 5', 
      description: 'Foundation Learning',
      color: 'bg-blue-500',
      materials: 158,
      subjects: ['Mathematics', 'Science', 'English', 'Social Studies', 'Hindi']
    },
    { 
      number: 6, 
      title: 'Class 6', 
      description: 'Building Concepts',
      color: 'bg-green-500',
      materials: 172,
      subjects: ['Mathematics', 'Science', 'English', 'Social Studies', 'Hindi']
    },
    { 
      number: 7, 
      title: 'Class 7', 
      description: 'Expanding Knowledge',
      color: 'bg-yellow-500',
      materials: 189,
      subjects: ['Mathematics', 'Science', 'English', 'Social Studies', 'Hindi']
    },
    { 
      number: 8, 
      title: 'Class 8', 
      description: 'Advanced Topics',
      color: 'bg-orange-500',
      materials: 205,
      subjects: ['Mathematics', 'Science', 'English', 'Social Studies', 'Hindi']
    },
    { 
      number: 9, 
      title: 'Class 9', 
      description: 'Preparation Phase',
      color: 'bg-purple-500',
      materials: 234,
      subjects: ['Mathematics', 'Science', 'English', 'Social Studies', 'Hindi']
    },
    { 
      number: 10, 
      title: 'Class 10', 
      description: 'Board Preparation',
      color: 'bg-red-500',
      materials: 267,
      subjects: ['Mathematics', 'Science', 'English', 'Social Studies', 'Hindi']
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
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
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
                <BookOpen className="h-8 w-8 text-primary-foreground" />
              </div>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Study Materials
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Comprehensive study resources including notes, books, and reference materials for all subjects
            </p>

            {user && user.role === 'student' && (
              <Badge variant="secondary" className="mb-4">
                <Users className="w-4 h-4 mr-1" />
                Student • Class {user.class}
              </Badge>
            )}
          </div>
        </div>
      </section>

      {/* Class Selection */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Select Your Class
            </h2>
            <p className="text-xl text-muted-foreground">
              Choose your class to access relevant study materials
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {classes.map((classItem) => (
              <Link key={classItem.number} href={`/study/${classItem.number}`}>
                <Card className={`group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 ${
                  selectedClass === classItem.number.toString() ? 'ring-2 ring-primary' : ''
                } ${
                  user?.role === 'student' && user?.class === classItem.number ? 'border-primary' : ''
                }`}>
                  <CardHeader className="text-center">
                    <div className={`w-16 h-16 ${classItem.color} rounded-full flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                      {classItem.number}
                    </div>
                    <CardTitle className="text-2xl">{classItem.title}</CardTitle>
                    <CardDescription className="text-lg">
                      {classItem.description}
                    </CardDescription>
                    
                    {user?.role === 'student' && user?.class === classItem.number && (
                      <Badge variant="secondary" className="mx-auto">
                        Your Class
                      </Badge>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center space-y-2">
                      <div className="flex items-center justify-center space-x-4 text-sm text-muted-foreground">
                        <span className="flex items-center">
                          <FileText className="w-4 h-4 mr-1" />
                          {classItem.materials} Materials
                        </span>
                        <span className="flex items-center">
                          <BookOpen className="w-4 h-4 mr-1" />
                          {classItem.subjects.length} Subjects
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap gap-1 justify-center">
                        {classItem.subjects.slice(0, 3).map((subject) => (
                          <Badge key={subject} variant="outline" className="text-xs">
                            {subject}
                          </Badge>
                        ))}
                        {classItem.subjects.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{classItem.subjects.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <Button className="w-full group-hover:bg-primary group-hover:text-primary-foreground">
                      Access Materials
                      <BookOpen className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Materials (for logged in users) */}
      {user && (
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
                Recently Accessed Materials
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Algebra Basics</CardTitle>
                      <Badge variant="secondary">Class 8</Badge>
                    </div>
                    <CardDescription>Mathematics • Chapter 2</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Last accessed: 2 hours ago
                      </span>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">
                          <Eye className="w-3 h-3 mr-1" />
                          View
                        </Button>
                        <Button size="sm">
                          <Download className="w-3 h-3 mr-1" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Photosynthesis</CardTitle>
                      <Badge variant="secondary">Class 7</Badge>
                    </div>
                    <CardDescription>Science • Chapter 5</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Last accessed: 1 day ago
                      </span>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">
                          <Eye className="w-3 h-3 mr-1" />
                          View
                        </Button>
                        <Button size="sm">
                          <Download className="w-3 h-3 mr-1" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="text-center mt-8">
                <Link href="/dashboard">
                  <Button variant="outline">
                    View All Recent Materials
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