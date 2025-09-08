'use client';

import React, { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  Download, 
  Maximize, 
  Minimize,
  RotateCw,
  Search,
  BookOpen
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

interface PDFViewerProps {
  file: string;
  title?: string;
  className?: string;
}

export default function PDFViewer({ file, title, className = '' }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.2);
  const [rotation, setRotation] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [searchText, setSearchText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setLoading(false);
    setError('');
  };

  const onDocumentLoadError = (error: any) => {
    console.error('Error loading PDF:', error);
    setError('Failed to load PDF. Please try again.');
    setLoading(false);
  };

  const goToPreviousPage = () => {
    setPageNumber(pageNumber <= 1 ? 1 : pageNumber - 1);
  };

  const goToNextPage = () => {
    setPageNumber(pageNumber >= numPages ? numPages : pageNumber + 1);
  };

  const zoomIn = () => {
    setScale(Math.min(scale + 0.2, 3.0));
  };

  const zoomOut = () => {
    setScale(Math.max(scale - 0.2, 0.5));
  };

  const resetZoom = () => {
    setScale(1.2);
  };

  const rotate = () => {
    setRotation((rotation + 90) % 360);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handlePageInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const page = parseInt(e.target.value);
    if (page >= 1 && page <= numPages) {
      setPageNumber(page);
    }
  };

  const downloadPDF = () => {
    const link = document.createElement('a');
    link.href = file;
    link.download = title || 'document.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isFullscreen]);

  const containerClass = isFullscreen 
    ? 'fixed inset-0 z-50 bg-background' 
    : `relative ${className}`;

  return (
    <div className={containerClass}>
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-primary" />
            <span className="font-medium text-sm">{title}</span>
          </div>
          
          {numPages > 0 && (
            <Badge variant="secondary" className="text-xs">
              {numPages} pages
            </Badge>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {/* Search */}
          <div className="hidden md:flex items-center space-x-2">
            <Search className="w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search in document..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-48 h-8 text-sm"
            />
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center space-x-1">
            <Button size="sm" variant="outline" onClick={zoomOut}>
              <ZoomOut className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={resetZoom}>
              <span className="text-xs font-mono">{Math.round(scale * 100)}%</span>
            </Button>
            <Button size="sm" variant="outline" onClick={zoomIn}>
              <ZoomIn className="w-4 h-4" />
            </Button>
          </div>

          {/* Rotate */}
          <Button size="sm" variant="outline" onClick={rotate}>
            <RotateCw className="w-4 h-4" />
          </Button>

          {/* Download */}
          <Button size="sm" variant="outline" onClick={downloadPDF}>
            <Download className="w-4 h-4" />
          </Button>

          {/* Fullscreen */}
          <Button size="sm" variant="outline" onClick={toggleFullscreen}>
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Navigation */}
      {numPages > 0 && (
        <div className="flex items-center justify-between p-4 border-b bg-muted/30">
          <div className="flex items-center space-x-2">
            <Button size="sm" variant="outline" onClick={goToPreviousPage} disabled={pageNumber <= 1}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm">Page</span>
              <Input
                type="number"
                min={1}
                max={numPages}
                value={pageNumber}
                onChange={handlePageInput}
                className="w-16 h-8 text-center text-sm"
              />
              <span className="text-sm text-muted-foreground">of {numPages}</span>
            </div>
            
            <Button size="sm" variant="outline" onClick={goToNextPage} disabled={pageNumber >= numPages}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <div className="text-sm text-muted-foreground">
            Zoom: {Math.round(scale * 100)}% | Rotation: {rotation}°
          </div>
        </div>
      )}

      {/* PDF Content */}
      <div className="flex-1 overflow-auto bg-gray-100">
        <div className="flex justify-center p-4">
          {loading && (
            <div className="flex items-center justify-center h-96">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center h-96 space-y-4">
              <div className="text-red-500 text-center">
                <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">Error Loading PDF</h3>
                <p className="text-sm">{error}</p>
              </div>
              <Button onClick={() => window.location.reload()}>
                Retry
              </Button>
            </div>
          )}

          {!loading && !error && (
            <Document
              file={file}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={
                <div className="flex items-center justify-center h-96">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
              }
            >
              <Page
                pageNumber={pageNumber}
                scale={scale}
                rotate={rotation}
                loading={
                  <div className="flex items-center justify-center h-96 bg-white border border-gray-300">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                }
                error={
                  <div className="flex items-center justify-center h-96 bg-white border border-gray-300">
                    <div className="text-red-500 text-center">
                      <p>Failed to load page {pageNumber}</p>
                    </div>
                  </div>
                }
                className="shadow-lg border border-gray-300"
              />
            </Document>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between p-4 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="text-sm text-muted-foreground">
          {title && `Document: ${title}`}
        </div>
        
        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
          <span>PDF Viewer</span>
          {isFullscreen && (
            <Button size="sm" variant="outline" onClick={toggleFullscreen}>
              <Minimize className="w-4 h-4 mr-1" />
              Exit Fullscreen
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}