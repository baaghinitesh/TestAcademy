'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, BookOpen, Download, Share2, Star, Clock, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import PDFViewer from '@/components/pdf-viewer';

export default function MaterialViewPage() {
  const params = useParams();
  const router = useRouter();
  const classNumber = params.classNumber as string;
  const subject = params.subject as string;
  const materialId = params.materialId as string;
  
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [material, setMaterial] = useState<any>(null);

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
      }
    };

    fetchUser();
  }, []);

  useEffect(() => {
    // Simulate fetching material data
    const fetchMaterial = async () => {
      try {
        // In a real app, this would be an API call
        const sampleMaterials = [
          {
            id: '1',
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
            views: 3420,
            tags: ['algebra', 'basics', 'equations'],
            description: 'Comprehensive introduction to algebraic concepts including variables, expressions, and basic equation solving techniques.',
            author: 'Dr. Mathematics',
            lastUpdated: '2024-01-15',
            pdfUrl: '/sample-pdfs/algebra-intro.pdf' // This would be a real PDF URL
          },
          {
            id: '2',
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
            views: 2150,
            tags: ['quadratic', 'equations', 'solutions'],
            description: 'Complete guide to quadratic equations covering all solution methods, graphing, and real-world applications.',
            author: 'Prof. Algebra',
            lastUpdated: '2024-01-10',
            pdfUrl: '/sample-pdfs/quadratic-handbook.pdf'
          }
        ];

        const foundMaterial = sampleMaterials.find(m => m.id === materialId);
        if (foundMaterial) {
          setMaterial(foundMaterial);
        } else {
          // Default material for demo
          setMaterial({
            id: materialId,
            title: 'Sample Study Material',
            type: 'Study Notes',
            section: 'study-notes',
            chapter: 'Chapter 1',
            pages: 20,
            size: '1.8 MB',
            uploadDate: '2024-01-20',
            difficulty: 'Beginner',
            rating: 4.5,
            downloads: 500,
            views: 1200,
            tags: ['sample', 'demo'],
            description: 'This is a sample study material for demonstration purposes.',
            author: 'EduTest Team',
            lastUpdated: '2024-01-20',
            pdfUrl: 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf' // Sample PDF for demo
          });
        }
      } catch (error) {
        console.error('Error fetching material:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMaterial();
  }, [materialId]);

  const subjectInfo = {
    'mathematics': { name: 'Mathematics', icon: '📐' },
    'science': { name: 'Science', icon: '🔬' },
    'english': { name: 'English', icon: '📚' },
    'social-studies': { name: 'Social Studies', icon: '🌍' },
    'hindi': { name: 'Hindi', icon: '🇮🇳' }
  };

  const currentSubject = subjectInfo[subject as keyof typeof subjectInfo];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-green-100 text-green-800';
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'Advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDownload = () => {
    if (material?.pdfUrl) {
      const link = document.createElement('a');
      link.href = material.pdfUrl;
      link.download = `${material.title}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: material?.title,
          text: `Check out this study material: ${material?.title}`,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!material || !currentSubject) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Material Not Found</h1>
          <Link href={`/study/${classNumber}/${subject}`}>
            <Button>Back to {currentSubject?.name || 'Subject'}</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href={`/study/${classNumber}/${subject}`}>
                <Button variant="outline" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Back to {currentSubject.name}
                </Button>
              </Link>
              
              <div className="hidden md:flex items-center space-x-2 text-sm text-muted-foreground">
                <span>Class {classNumber}</span>
                <span>•</span>
                <span>{currentSubject.name}</span>
                <span>•</span>
                <span>{material.type}</span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 className="w-4 h-4 mr-1" />
                Share
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="w-4 h-4 mr-1" />
                Download
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Material Info Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <div className="flex items-center space-x-2 mb-2">
                  <div className="text-2xl">{currentSubject.icon}</div>
                  <Badge variant="outline">{material.type}</Badge>
                </div>
                <CardTitle className="text-xl leading-tight">{material.title}</CardTitle>
                <CardDescription>{material.chapter}</CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="bg-muted rounded-lg p-3">
                    <div className="font-bold text-lg">{material.pages}</div>
                    <div className="text-xs text-muted-foreground">Pages</div>
                  </div>
                  <div className="bg-muted rounded-lg p-3">
                    <div className="font-bold text-lg">{material.size}</div>
                    <div className="text-xs text-muted-foreground">Size</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Difficulty:</span>
                    <Badge className={`text-xs ${getDifficultyColor(material.difficulty)}`}>
                      {material.difficulty}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Rating:</span>
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm">{material.rating}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Downloads:</span>
                    <span className="text-sm">{material.downloads.toLocaleString()}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Views:</span>
                    <span className="text-sm">{material.views.toLocaleString()}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-medium">Tags:</div>
                  <div className="flex flex-wrap gap-1">
                    {material.tags.map((tag: string) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 pt-4 border-t">
                  <div className="text-sm">
                    <div className="font-medium">Author:</div>
                    <div className="text-muted-foreground">{material.author}</div>
                  </div>
                  
                  <div className="text-sm">
                    <div className="font-medium">Last Updated:</div>
                    <div className="text-muted-foreground flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {new Date(material.lastUpdated).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {material.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* PDF Viewer */}
          <div className="lg:col-span-3">
            <Card className="h-[calc(100vh-12rem)]">
              <CardContent className="p-0 h-full">
                <PDFViewer 
                  file={material.pdfUrl}
                  title={material.title}
                  className="h-full"
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}