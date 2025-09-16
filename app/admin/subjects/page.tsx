'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Book,
  FolderOpen,
  Tag,
  MoreHorizontal,
  BookMarked,
  ChevronDown,
  ChevronRight,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Subject {
  _id: string;
  name: string;
  description?: string;
  classNumbers: number[];
  chapters: Map<number, Chapter[]>;
  icon?: string;
  color?: string;
  isActive: boolean;
  createdAt: string;
  totalQuestions: number;
  totalTests: number;
  totalMaterials: number;
}

interface Chapter {
  name: string;
  description?: string;
  topics: string[];
  isActive: boolean;
}

interface SubjectFormData {
  name: string;
  description: string;
  classNumbers: number[];
  icon: string;
  color: string;
}

interface ChapterFormData {
  name: string;
  description: string;
  topics: string[];
  classNumber: number;
}

export default function SubjectsManagement() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set());
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isChapterDialogOpen, setIsChapterDialogOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [editingChapter, setEditingChapter] = useState<{ subject: Subject; chapter: Chapter; classNumber: number } | null>(null);
  
  const [subjectFormData, setSubjectFormData] = useState<SubjectFormData>({
    name: '',
    description: '',
    classNumbers: [],
    icon: 'book',
    color: '#3b82f6'
  });

  const [chapterFormData, setChapterFormData] = useState<ChapterFormData>({
    name: '',
    description: '',
    topics: [],
    classNumber: 5
  });

  const [newTopic, setNewTopic] = useState('');
  const [selectedSubjectForChapter, setSelectedSubjectForChapter] = useState<Subject | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const classes = [5, 6, 7, 8, 9, 10];
  const icons = [
    { name: 'book', icon: '📚' },
    { name: 'science', icon: '🔬' },
    { name: 'math', icon: '🔢' },
    { name: 'language', icon: '📝' },
    { name: 'history', icon: '🏛️' },
    { name: 'geography', icon: '🌍' },
    { name: 'art', icon: '🎨' },
    { name: 'music', icon: '🎵' }
  ];

  const colors = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', 
    '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'
  ];

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      // Mock data for now - replace with actual API call
      const mockSubjects: Subject[] = [
        {
          _id: '1',
          name: 'Mathematics',
          description: 'Study of numbers, shapes, and patterns',
          classNumbers: [5, 6, 7, 8, 9, 10],
          chapters: new Map([
            [10, [
              {
                name: 'Algebra',
                description: 'Linear equations and quadratic expressions',
                topics: ['Linear Equations', 'Quadratic Equations', 'Polynomials', 'Factorization'],
                isActive: true
              },
              {
                name: 'Geometry',
                description: 'Coordinate geometry and trigonometry',
                topics: ['Coordinate Geometry', 'Triangles', 'Circles', 'Trigonometry'],
                isActive: true
              }
            ]],
            [9, [
              {
                name: 'Number Systems',
                description: 'Real numbers and their properties',
                topics: ['Rational Numbers', 'Irrational Numbers', 'Real Numbers'],
                isActive: true
              }
            ]]
          ]),
          icon: 'math',
          color: '#3b82f6',
          isActive: true,
          createdAt: '2024-01-15T08:00:00Z',
          totalQuestions: 450,
          totalTests: 25,
          totalMaterials: 35
        },
        {
          _id: '2',
          name: 'Physics',
          description: 'Study of matter, energy, and their interactions',
          classNumbers: [6, 7, 8, 9, 10],
          chapters: new Map([
            [10, [
              {
                name: 'Light',
                description: 'Reflection, refraction, and optical phenomena',
                topics: ['Reflection of Light', 'Refraction of Light', 'Lens', 'Human Eye'],
                isActive: true
              }
            ]]
          ]),
          icon: 'science',
          color: '#10b981',
          isActive: true,
          createdAt: '2024-01-15T08:00:00Z',
          totalQuestions: 320,
          totalTests: 18,
          totalMaterials: 28
        }
      ];
      
      setSubjects(mockSubjects);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching subjects:', error);
      setLoading(false);
    }
  };

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const errors: Record<string, string> = {};
    if (!subjectFormData.name.trim()) errors.name = 'Subject name is required';
    if (subjectFormData.classNumbers.length === 0) errors.classNumbers = 'At least one class must be selected';
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      const response = await fetch('/api/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subjectFormData)
      });

      if (response.ok) {
        setIsCreateDialogOpen(false);
        resetSubjectForm();
        fetchSubjects();
      }
    } catch (error) {
      console.error('Error creating subject:', error);
    }
  };

  const handleCreateChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const errors: Record<string, string> = {};
    if (!chapterFormData.name.trim()) errors.name = 'Chapter name is required';
    if (!selectedSubjectForChapter) errors.subject = 'Please select a subject';
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      const response = await fetch(`/api/subjects/${selectedSubjectForChapter!._id}/chapters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(chapterFormData)
      });

      if (response.ok) {
        setIsChapterDialogOpen(false);
        resetChapterForm();
        fetchSubjects();
      }
    } catch (error) {
      console.error('Error creating chapter:', error);
    }
  };

  const addTopic = () => {
    if (newTopic.trim()) {
      setChapterFormData(prev => ({
        ...prev,
        topics: [...prev.topics, newTopic.trim()]
      }));
      setNewTopic('');
    }
  };

  const removeTopic = (index: number) => {
    setChapterFormData(prev => ({
      ...prev,
      topics: prev.topics.filter((_, i) => i !== index)
    }));
  };

  const toggleSubjectExpansion = (subjectId: string) => {
    const newExpanded = new Set(expandedSubjects);
    if (newExpanded.has(subjectId)) {
      newExpanded.delete(subjectId);
    } else {
      newExpanded.add(subjectId);
    }
    setExpandedSubjects(newExpanded);
  };

  const resetSubjectForm = () => {
    setSubjectFormData({
      name: '',
      description: '',
      classNumbers: [],
      icon: 'book',
      color: '#3b82f6'
    });
    setFormErrors({});
  };

  const resetChapterForm = () => {
    setChapterFormData({
      name: '',
      description: '',
      topics: [],
      classNumber: 5
    });
    setNewTopic('');
    setSelectedSubjectForChapter(null);
    setFormErrors({});
  };

  const filteredSubjects = subjects.filter(subject =>
    subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    subject.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading subjects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Subject Management</h1>
          <p className="text-muted-foreground">
            Manage subjects, chapters, and topics across all classes
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex flex-wrap gap-2">
          <Dialog open={isChapterDialogOpen} onOpenChange={setIsChapterDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2" size="sm">
                <FolderOpen className="h-4 w-4" />
                Add Chapter
              </Button>
            </DialogTrigger>
          </Dialog>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2" size="sm">
                <Plus className="h-4 w-4" />
                Add Subject
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:gap-6 grid-cols-2 sm:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Subjects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{subjects.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Chapters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {subjects.reduce((acc, subject) => {
                let chapterCount = 0;
                subject.chapters.forEach(chapters => {
                  chapterCount += chapters.length;
                });
                return acc + chapterCount;
              }, 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {subjects.reduce((acc, subject) => acc + subject.totalQuestions, 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Tests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {subjects.reduce((acc, subject) => acc + subject.totalTests, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search subjects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Subjects List */}
      <div className="space-y-4">
        {filteredSubjects.map((subject) => (
          <Card key={subject._id} className="overflow-hidden">
            <CardHeader 
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => toggleSubjectExpansion(subject._id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    {expandedSubjects.has(subject._id) ? (
                      <ChevronDown className="h-5 w-5" />
                    ) : (
                      <ChevronRight className="h-5 w-5" />
                    )}
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-medium"
                      style={{ backgroundColor: subject.color }}
                    >
                      {icons.find(icon => icon.name === subject.icon)?.icon || '📚'}
                    </div>
                  </div>
                  <div>
                    <CardTitle className="text-lg">{subject.name}</CardTitle>
                    <CardDescription>{subject.description}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="hidden sm:flex flex-wrap gap-1">
                    {subject.classNumbers.map((cls) => (
                      <Badge key={cls} variant="secondary" className="text-xs">
                        Class {cls}
                      </Badge>
                    ))}
                  </div>
                  <div className="hidden md:flex space-x-6 text-sm text-muted-foreground">
                    <span>{subject.totalQuestions} questions</span>
                    <span>{subject.totalTests} tests</span>
                    <span>{subject.totalMaterials} materials</span>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Subject
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Settings className="h-4 w-4 mr-2" />
                        Settings
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardHeader>

            {expandedSubjects.has(subject._id) && (
              <CardContent className="pt-0">
                <Tabs defaultValue={subject.classNumbers[0]?.toString()} className="w-full">
                  <TabsList className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 mb-4">
                    {subject.classNumbers.map((cls) => (
                      <TabsTrigger key={cls} value={cls.toString()}>
                        Class {cls}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  
                  {subject.classNumbers.map((cls) => (
                    <TabsContent key={cls} value={cls.toString()}>
                      <div className="space-y-3">
                        {subject.chapters.get(cls)?.map((chapter, index) => (
                          <div key={index} className="border rounded-lg p-4 bg-muted/20">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium flex items-center gap-2">
                                <BookMarked className="h-4 w-4" />
                                {chapter.name}
                              </h4>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                  <DropdownMenuItem>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit Chapter
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="text-red-600">
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                            {chapter.description && (
                              <p className="text-sm text-muted-foreground mb-2">{chapter.description}</p>
                            )}
                            <div className="flex flex-wrap gap-1">
                              {chapter.topics.map((topic, topicIndex) => (
                                <Badge key={topicIndex} variant="outline" className="text-xs">
                                  <Tag className="h-3 w-3 mr-1" />
                                  {topic}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )) || (
                          <p className="text-muted-foreground text-center py-4">
                            No chapters added for Class {cls} yet
                          </p>
                        )}
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {/* Create Subject Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Subject</DialogTitle>
            <DialogDescription>
              Add a new subject with classes, chapters, and topics.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateSubject} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Subject Name</Label>
              <Input
                id="name"
                value={subjectFormData.name}
                onChange={(e) => setSubjectFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter subject name"
              />
              {formErrors.name && <p className="text-sm text-red-600">{formErrors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={subjectFormData.description}
                onChange={(e) => setSubjectFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter subject description"
              />
            </div>

            <div className="space-y-2">
              <Label>Available for Classes</Label>
              <div className="grid grid-cols-3 gap-2">
                {classes.map((cls) => (
                  <div key={cls} className="flex items-center space-x-2">
                    <Checkbox
                      id={`class-${cls}`}
                      checked={subjectFormData.classNumbers.includes(cls)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSubjectFormData(prev => ({
                            ...prev,
                            classNumbers: [...prev.classNumbers, cls]
                          }));
                        } else {
                          setSubjectFormData(prev => ({
                            ...prev,
                            classNumbers: prev.classNumbers.filter(c => c !== cls)
                          }));
                        }
                      }}
                    />
                    <Label htmlFor={`class-${cls}`} className="text-sm">Class {cls}</Label>
                  </div>
                ))}
              </div>
              {formErrors.classNumbers && <p className="text-sm text-red-600">{formErrors.classNumbers}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Icon</Label>
                <div className="grid grid-cols-4 gap-2">
                  {icons.map((iconOption) => (
                    <Button
                      key={iconOption.name}
                      type="button"
                      variant={subjectFormData.icon === iconOption.name ? "default" : "outline"}
                      className="h-12 text-lg"
                      onClick={() => setSubjectFormData(prev => ({ ...prev, icon: iconOption.name }))}
                    >
                      {iconOption.icon}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Color</Label>
                <div className="grid grid-cols-4 gap-2">
                  {colors.map((color) => (
                    <Button
                      key={color}
                      type="button"
                      className="h-12 w-12 p-0 border-2"
                      style={{ 
                        backgroundColor: color,
                        borderColor: subjectFormData.color === color ? '#000' : 'transparent'
                      }}
                      onClick={() => setSubjectFormData(prev => ({ ...prev, color }))}
                    >
                      {subjectFormData.color === color && (
                        <span className="text-white text-lg">✓</span>
                      )}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => {
                setIsCreateDialogOpen(false);
                resetSubjectForm();
              }}>
                Cancel
              </Button>
              <Button type="submit">Create Subject</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create Chapter Dialog */}
      <Dialog open={isChapterDialogOpen} onOpenChange={setIsChapterDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Chapter</DialogTitle>
            <DialogDescription>
              Add a new chapter with topics to a subject.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateChapter} className="space-y-4">
            <div className="space-y-2">
              <Label>Subject</Label>
              <Select
                value={selectedSubjectForChapter?._id || ''}
                onValueChange={(value) => setSelectedSubjectForChapter(subjects.find(s => s._id === value) || null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject._id} value={subject._id}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formErrors.subject && <p className="text-sm text-red-600">{formErrors.subject}</p>}
            </div>

            <div className="space-y-2">
              <Label>Class</Label>
              <Select
                value={chapterFormData.classNumber.toString()}
                onValueChange={(value) => setChapterFormData(prev => ({ ...prev, classNumber: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {selectedSubjectForChapter?.classNumbers.map((cls) => (
                    <SelectItem key={cls} value={cls.toString()}>
                      Class {cls}
                    </SelectItem>
                  )) || classes.map((cls) => (
                    <SelectItem key={cls} value={cls.toString()}>
                      Class {cls}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="chapterName">Chapter Name</Label>
              <Input
                id="chapterName"
                value={chapterFormData.name}
                onChange={(e) => setChapterFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter chapter name"
              />
              {formErrors.name && <p className="text-sm text-red-600">{formErrors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="chapterDescription">Description (Optional)</Label>
              <Textarea
                id="chapterDescription"
                value={chapterFormData.description}
                onChange={(e) => setChapterFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter chapter description"
              />
            </div>

            <div className="space-y-2">
              <Label>Topics</Label>
              <div className="flex gap-2">
                <Input
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value)}
                  placeholder="Enter topic name"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTopic())}
                />
                <Button type="button" onClick={addTopic}>Add</Button>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {chapterFormData.topics.map((topic, index) => (
                  <Badge key={index} variant="secondary" className="cursor-pointer" onClick={() => removeTopic(index)}>
                    {topic} ×
                  </Badge>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => {
                setIsChapterDialogOpen(false);
                resetChapterForm();
              }}>
                Cancel
              </Button>
              <Button type="submit">Create Chapter</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}