'use client';

import React, { useState, useEffect } from 'react';
import { 
  Eye, Download, Share2, Heart, Star, ChevronLeft, ChevronRight, 
  ZoomIn, ZoomOut, RotateCw, Maximize2, FileText, Image as ImageIcon,
  Video, ExternalLink, Play, Pause, Volume2, VolumeX
} from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Progress } from '../ui/progress';

interface MaterialViewerProps {
  material: {
    _id: string;
    title: string;
    description?: string;
    contentType: 'text' | 'pdf' | 'video' | 'image' | 'audio' | 'url' | 'mixed';
    textContent?: string;
    htmlContent?: string;
    markdownContent?: string;
    files: Array<{
      originalName: string;
      mimeType: string;
      size: number;
      url: string;
      thumbnailUrl?: string;
      pages?: number;
      duration?: number;
    }>;
    primaryFile?: string;
    externalUrl?: string;
    embedCode?: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    prerequisites: string[];
    learningObjectives: string[];
    viewCount: number;
    downloadCount: number;
    averageRating: number;
    ratingCount: number;
    metadata: {
      wordCount?: number;
      readingTime?: number;
      tags?: string[];
    };
    createdBy: {
      name: string;
      email: string;
    };
    createdAt: string;
  };
  onViewIncrement?: () => void;
  onDownload?: () => void;
  onRate?: (rating: number) => void;
  showAnalytics?: boolean;
}

export function EnhancedMaterialViewer({ 
  material, 
  onViewIncrement, 
  onDownload, 
  onRate,
  showAnalytics = false 
}: MaterialViewerProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const primaryFile = material.files.find(f => f.originalName === material.primaryFile) || material.files[0];
  
  useEffect(() => {
    // Track view when component mounts
    if (onViewIncrement) {
      onViewIncrement();
    }
  }, [onViewIncrement]);

  const handleDownload = () => {
    if (primaryFile && onDownload) {
      onDownload();
      // Trigger download
      const link = document.createElement('a');
      link.href = primaryFile.url;
      link.download = primaryFile.originalName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleRating = (rating: number) => {
    setUserRating(rating);
    if (onRate) {
      onRate(rating);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderContentViewer = () => {
    switch (material.contentType) {
      case 'text':
        return (
          <div className="prose max-w-none">
            {material.htmlContent ? (
              <div dangerouslySetInnerHTML={{ __html: material.htmlContent }} />
            ) : material.markdownContent ? (
              <div className="whitespace-pre-wrap">{material.markdownContent}</div>
            ) : (
              <div className="whitespace-pre-wrap">{material.textContent}</div>
            )}
          </div>
        );

      case 'pdf':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-muted p-4 rounded-lg">
              <div className="flex items-center space-x-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage <= 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm">
                  Page {currentPage} of {primaryFile?.pages || 1}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(primaryFile?.pages || 1, currentPage + 1))}
                  disabled={currentPage >= (primaryFile?.pages || 1)}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setZoomLevel(Math.max(50, zoomLevel - 25))}
                >
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <span className="text-sm min-w-[60px] text-center">{zoomLevel}%</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setZoomLevel(Math.min(200, zoomLevel + 25))}
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsFullscreen(!isFullscreen)}
                >
                  <Maximize2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            {primaryFile && (
              <div className={`border rounded-lg overflow-auto ${isFullscreen ? 'fixed inset-0 z-50 bg-white' : ''}`}>
                <iframe
                  src={`${primaryFile.url}#page=${currentPage}&zoom=${zoomLevel}`}
                  className="w-full h-[600px]"
                  title={material.title}
                />
              </div>
            )}
          </div>
        );

      case 'video':
        return (
          <div className="space-y-4">
            {primaryFile && (
              <div className="relative">
                <video
                  className="w-full rounded-lg"
                  controls
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                  onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
                >
                  <source src={primaryFile.url} type={primaryFile.mimeType} />
                  Your browser does not support the video tag.
                </video>
                
                {/* Custom video controls overlay */}
                <div className="flex items-center justify-between mt-2 px-4 py-2 bg-muted rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const video = document.querySelector('video');
                        if (video) {
                          isPlaying ? video.pause() : video.play();
                        }
                      }}
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const video = document.querySelector('video');
                        if (video) {
                          video.muted = !video.muted;
                          setIsMuted(video.muted);
                        }
                      }}
                    >
                      {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </Button>
                    
                    <span className="text-sm">
                      {formatDuration(currentTime)} / {formatDuration(duration)}
                    </span>
                  </div>
                  
                  <div className="flex-1 mx-4">
                    <Progress 
                      value={(currentTime / duration) * 100} 
                      className="h-2"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 'image':
        return (
          <div className="space-y-4">
            {material.files.map((file, index) => (
              <div key={index} className="text-center">
                <img
                  src={file.url}
                  alt={file.originalName}
                  className="max-w-full h-auto rounded-lg shadow-lg mx-auto"
                  style={{ transform: `scale(${zoomLevel / 100})` }}
                />
                <p className="text-sm text-muted-foreground mt-2">{file.originalName}</p>
              </div>
            ))}
            
            <div className="flex items-center justify-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setZoomLevel(Math.max(25, zoomLevel - 25))}
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-sm min-w-[60px] text-center">{zoomLevel}%</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setZoomLevel(Math.min(300, zoomLevel + 25))}
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
            </div>
          </div>
        );

      case 'url':
        return (
          <div className="space-y-4">
            {material.embedCode ? (
              <div 
                className="w-full" 
                dangerouslySetInnerHTML={{ __html: material.embedCode }} 
              />
            ) : material.externalUrl ? (
              <div className="text-center p-8 border-2 border-dashed border-muted rounded-lg">
                <ExternalLink className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">External Resource</h3>
                <p className="text-muted-foreground mb-4">
                  This material links to an external resource
                </p>
                <Button asChild>
                  <a href={material.externalUrl} target="_blank" rel="noopener noreferrer">
                    Open External Link
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </a>
                </Button>
              </div>
            ) : null}
          </div>
        );

      default:
        return (
          <div className="text-center p-8 text-muted-foreground">
            <FileText className="w-16 h-16 mx-auto mb-4" />
            <p>Content type not supported for preview</p>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h1 className="text-3xl font-bold mb-2">{material.title}</h1>
          {material.description && (
            <p className="text-muted-foreground mb-4">{material.description}</p>
          )}
          
          <div className="flex items-center space-x-4 mb-4">
            <Badge className={getDifficultyColor(material.difficulty)}>
              {material.difficulty}
            </Badge>
            {material.metadata.readingTime && (
              <Badge variant="outline">
                {material.metadata.readingTime} min read
              </Badge>
            )}
            {material.metadata.wordCount && (
              <Badge variant="outline">
                {material.metadata.wordCount} words
              </Badge>
            )}
          </div>
          
          {/* Rating */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-5 h-5 cursor-pointer ${
                    star <= (userRating || material.averageRating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  }`}
                  onClick={() => handleRating(star)}
                />
              ))}
              <span className="ml-2 text-sm text-muted-foreground">
                ({material.ratingCount} reviews)
              </span>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFavorited(!isFavorited)}
              className={isFavorited ? 'text-red-500' : ''}
            >
              <Heart className={`w-4 h-4 ${isFavorited ? 'fill-current' : ''}`} />
            </Button>
          </div>
        </div>
        
        {/* Action buttons */}
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
          {primaryFile && (
            <Button onClick={handleDownload}>
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          )}
        </div>
      </div>

      {/* Main content */}
      <Tabs defaultValue="content" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="info">Information</TabsTrigger>
          <TabsTrigger value="files">Files</TabsTrigger>
          {showAnalytics && <TabsTrigger value="analytics">Analytics</TabsTrigger>}
        </TabsList>
        
        <TabsContent value="content" className="space-y-4">
          {renderContentViewer()}
        </TabsContent>
        
        <TabsContent value="info" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Learning Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {material.learningObjectives.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Learning Objectives</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {material.learningObjectives.map((objective, index) => (
                        <li key={index}>{objective}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {material.prerequisites.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Prerequisites</h4>
                    <div className="flex flex-wrap gap-2">
                      {material.prerequisites.map((prereq, index) => (
                        <Badge key={index} variant="secondary">
                          {prereq}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {material.metadata.tags && material.metadata.tags.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {material.metadata.tags.map((tag, index) => (
                        <Badge key={index} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Material Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Created by:</span>
                    <p className="text-muted-foreground">{material.createdBy.name}</p>
                  </div>
                  <div>
                    <span className="font-medium">Created:</span>
                    <p className="text-muted-foreground">
                      {new Date(material.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium">Views:</span>
                    <p className="text-muted-foreground">{material.viewCount}</p>
                  </div>
                  <div>
                    <span className="font-medium">Downloads:</span>
                    <p className="text-muted-foreground">{material.downloadCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="files" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {material.files.map((file, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      {file.mimeType.startsWith('image/') ? (
                        <ImageIcon className="w-8 h-8 text-blue-500" />
                      ) : file.mimeType === 'application/pdf' ? (
                        <FileText className="w-8 h-8 text-red-500" />
                      ) : file.mimeType.startsWith('video/') ? (
                        <Video className="w-8 h-8 text-purple-500" />
                      ) : (
                        <FileText className="w-8 h-8 text-gray-500" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{file.originalName}</p>
                      <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                      {file.pages && (
                        <p className="text-xs text-muted-foreground">{file.pages} pages</p>
                      )}
                      {file.duration && (
                        <p className="text-xs text-muted-foreground">{formatDuration(file.duration)}</p>
                      )}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = file.url;
                        link.download = file.originalName;
                        link.click();
                      }}
                    >
                      <Download className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        {showAnalytics && (
          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{material.viewCount}</div>
                  <p className="text-sm text-muted-foreground">Total Views</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{material.downloadCount}</div>
                  <p className="text-sm text-muted-foreground">Downloads</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-600">{material.averageRating.toFixed(1)}</div>
                  <p className="text-sm text-muted-foreground">Avg Rating</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600">{material.ratingCount}</div>
                  <p className="text-sm text-muted-foreground">Reviews</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}