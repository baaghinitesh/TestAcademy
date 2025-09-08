'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { BookOpen, FileText, Download, Eye, ArrowLeft, Search, Filter, Clock, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

export default function SubjectStudyPage() {
  const params = useParams();
  const classNumber = params.classNumber as string;
  const subject = params.subject as string;
  
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSection, setSelectedSection] = useState('all');

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

  const subjectInfo = {
    'mathematics': {
      name: 'Mathematics',
      icon: '📐',
      color: 'from-blue-500 to-blue-600',
      description: 'Numbers, Algebra, Geometry, and Problem Solving'
    },
    'science': {
      name: 'Science',
      icon: '🔬',
      color: 'from-green-500 to-green-600',
      description: 'Physics, Chemistry, and Biology Concepts'
    },
    'english': {
      name: 'English',
      icon: '📚',
      color: 'from-purple-500 to-purple-600',
      description: 'Language, Literature, and Communication Skills'
    },
    'social-studies': {
      name: 'Social Studies',
      icon: '🌍',
      color: 'from-orange-500 to-orange-600',
      description: 'History, Geography, and Civics'
    },
    'hindi': {
      name: 'Hindi',
      icon: '🇮🇳',
      color: 'from-red-500 to-red-600',
      description: 'Language, Literature, and Grammar'
    }
  };

  const sections = [
    { id: 'study-notes', name: 'Study Notes', icon: FileText, count: 12 },
    { id: 'books', name: 'Reference Books', icon: BookOpen, count: 8 },
    { id: 'sample-pdfs', name: 'Sample PDFs', icon: Download, count: 15 },
    { id: 'worksheets', name: 'Worksheets', icon: FileText, count: 20 }
  ];

  // Sample study materials data
  const studyMaterials = [
    {
      id: 1,
      title: 'Introduction to Algebra',
      type: 'Study Notes',
      section: 'study-notes',
      chapter: 'Chapter 1',
      pages: 24,
      size: '2.3 MB',
      uploadDate: '2024-01-15',
      difficulty: 'Beginner',
      rating: 4.8,
      downloads: 1250,
      tags: ['algebra', 'basics', 'equations']
    },
    {
      id: 2,
      title: 'Quadratic Equations Handbook',
      type: 'Reference Books',
      section: 'books',
      chapter: 'Chapter 4',
      pages: 156,
      size: '12.5 MB',
      uploadDate: '2024-01-10',
      difficulty: 'Intermediate',
      rating: 4.9,
      downloads: 890,
      tags: ['quadratic', 'equations', 'solutions']
    },
    {
      id: 3,
      title: 'Geometry Practice Problems',
      type: 'Sample PDFs',
      section: 'sample-pdfs',
      chapter: 'Chapter 6',
      pages: 45,
      size: '3.8 MB',
      uploadDate: '2024-01-20',
      difficulty: 'Advanced',
      rating: 4.7,
      downloads: 670,
      tags: ['geometry', 'practice', 'problems']
    },
    {
      id: 4,
      title: 'Linear Equations Worksheet',
      type: 'Worksheets',
      section: 'worksheets',
      chapter: 'Chapter 3',
      pages: 8,
      size: '1.2 MB',
      uploadDate: '2024-01-25',
      difficulty: 'Beginner',
      rating: 4.6,
      downloads: 2100,
      tags: ['linear', 'equations', 'worksheet']
    },
    {
      id: 5,
      title: 'Calculus Fundamentals',
      type: 'Study Notes',
      section: 'study-notes',
      chapter: 'Chapter 8',
      pages: 67,
      size: '5.4 MB',
      uploadDate: '2024-01-18',
      difficulty: 'Advanced',
      rating: 4.9,
      downloads: 445,
      tags: ['calculus', 'derivatives', 'integrals']
    },
    {
      id: 6,
      title: 'Statistics and Probability Guide',
      type: 'Reference Books',
      section: 'books',
      chapter: 'Chapter 10',
      pages: 189,
      size: '15.2 MB',
      uploadDate: '2024-01-12',
      difficulty: 'Intermediate',
      rating: 4.8,
      downloads: 1120,
      tags: ['statistics', 'probability', 'data']
    }
  ];

  const currentSubject = subjectInfo[subject as keyof typeof subjectInfo];

  const filteredMaterials = studyMaterials.filter(material => {
    const matchesSearch = material.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         material.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesSection = selectedSection === 'all' || material.section === selectedSection;
    return matchesSearch && matchesSection;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-green-100 text-green-800';
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'Advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!currentSubject) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Subject Not Found</h1>
          <Link href={`/study/${classNumber}`}>
            <Button>Back to Class {classNumber}</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header Section */}
      <section className={`bg-gradient-to-r ${currentSubject.color} py-16 text-white`}>
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center mb-6">
              <Link href={`/study/${classNumber}`}>
                <Button variant="outline" size="sm" className="text-white border-white hover:bg-white hover:text-foreground mr-4">
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Back to Class {classNumber}
                </Button>
              </Link>
              
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-3xl mr-4">
                {currentSubject.icon}
              </div>
              
              <div>
                <h1 className="text-3xl md:text-4xl font-bold">{currentSubject.name}</h1>
                <p className="text-xl opacity-90">Class {classNumber} • {currentSubject.description}</p>
              </div>
            </div>

            {/* Section Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
              {sections.map((section) => (
                <div key={section.id} className="bg-white/10 rounded-lg p-4 text-center">
                  <section.icon className="w-6 h-6 mx-auto mb-2" />
                  <div className="text-lg font-bold">{section.count}</div>
                  <div className="text-sm opacity-80">{section.name}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Filters and Search */}
      <section className="py-8 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex flex-1 items-center space-x-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search materials..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Filter className="w-4 h-4 text-muted-foreground" />
                  <select
                    value={selectedSection}
                    onChange={(e) => setSelectedSection(e.target.value)}
                    className="px-3 py-2 border rounded-md bg-background"
                  >
                    <option value="all">All Sections</option>
                    {sections.map((section) => (
                      <option key={section.id} value={section.id}>
                        {section.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="text-sm text-muted-foreground">
                Showing {filteredMaterials.length} of {studyMaterials.length} materials
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Study Materials Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMaterials.map((material) => (
                <Card key={material.id} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between mb-2">
                      <Badge variant="outline" className="text-xs">
                        {material.type}
                      </Badge>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Star className="w-3 h-3 mr-1 fill-yellow-400 text-yellow-400" />
                        {material.rating}
                      </div>
                    </div>
                    
                    <CardTitle className="text-lg leading-tight group-hover:text-primary transition-colors">
                      {material.title}
                    </CardTitle>
                    
                    <CardDescription className="flex items-center text-sm">
                      <FileText className="w-3 h-3 mr-1" />
                      {material.chapter} • {material.pages} pages
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{material.size}</span>
                      <Badge className={`text-xs ${getDifficultyColor(material.difficulty)}`}>
                        {material.difficulty}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {material.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {material.tags.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{material.tags.length - 3}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {new Date(material.uploadDate).toLocaleDateString()}
                      </div>
                      <div>{material.downloads} downloads</div>
                    </div>

                    <div className="flex space-x-2">
                      <Link href={`/study/${classNumber}/${subject}/${material.id}/view`} className="flex-1">
                        <Button size="sm" variant="outline" className="w-full">
                          <Eye className="w-3 h-3 mr-1" />
                          View
                        </Button>
                      </Link>
                      <Button size="sm" className="flex-1">
                        <Download className="w-3 h-3 mr-1" />
                        Download
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredMaterials.length === 0 && (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-12 h-12 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No materials found</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your search terms or filters
                </p>
                <Button onClick={() => { setSearchTerm(''); setSelectedSection('all'); }}>
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}