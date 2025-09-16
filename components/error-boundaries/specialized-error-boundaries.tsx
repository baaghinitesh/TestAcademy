'use client';

import React from 'react';
import { AlertTriangle, RefreshCw, BookOpen, Users, FileQuestion, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ErrorBoundary } from '@/components/error-boundary';

// Admin Panel Error Boundary
export function AdminErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary 
      fallback={AdminErrorFallback}
      onError={(error, errorInfo) => {
        // Log admin errors for debugging
        console.error('Admin Panel Error:', error, errorInfo);
      }}
    >
      {children}
    </ErrorBoundary>
  );
}

function AdminErrorFallback({ error, retry }: { error?: Error; retry: () => void }) {
  return (
    <div className="min-h-[400px] flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-red-200">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <Users className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle>Admin Panel Error</CardTitle>
          <CardDescription>
            There was an issue loading the admin interface. This might be a temporary problem.
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex justify-center space-x-2">
          <Button variant="outline" onClick={() => window.location.href = '/admin'}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <Button onClick={retry}>Try Again</Button>
        </CardFooter>
      </Card>
    </div>
  );
}

// Test Taking Error Boundary
export function TestErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary 
      fallback={TestErrorFallback}
      onError={(error, errorInfo) => {
        // Log test errors - important for academic integrity
        console.error('Test Interface Error:', error, errorInfo);
      }}
    >
      {children}
    </ErrorBoundary>
  );
}

function TestErrorFallback({ error, retry }: { error?: Error; retry: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-red-50">
      <Card className="w-full max-w-md border-red-200">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <FileQuestion className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-red-700">Test Error</CardTitle>
          <CardDescription>
            There was an issue with the test interface. Your progress has been saved automatically.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Please contact your instructor if this problem continues.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-700">
              <strong>Note:</strong> Your test data is safely stored and can be recovered.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center space-x-2">
          <Button variant="outline" onClick={() => window.location.href = '/dashboard'}>
            Exit Test
          </Button>
          <Button onClick={retry}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Reload Test
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

// Study Materials Error Boundary
export function StudyErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary 
      fallback={StudyErrorFallback}
      onError={(error, errorInfo) => {
        console.error('Study Materials Error:', error, errorInfo);
      }}
    >
      {children}
    </ErrorBoundary>
  );
}

function StudyErrorFallback({ error, retry }: { error?: Error; retry: () => void }) {
  return (
    <div className="min-h-[400px] flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-orange-200">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
            <BookOpen className="h-6 w-6 text-orange-600" />
          </div>
          <CardTitle className="text-orange-700">Study Materials Error</CardTitle>
          <CardDescription>
            Unable to load study materials. This might be due to a network issue or file access problem.
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex justify-center space-x-2">
          <Button variant="outline" onClick={() => window.location.href = '/study'}>
            Browse Materials
          </Button>
          <Button onClick={retry}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

// Analytics Error Boundary
export function AnalyticsErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary 
      fallback={AnalyticsErrorFallback}
      onError={(error, errorInfo) => {
        console.error('Analytics Error:', error, errorInfo);
      }}
    >
      {children}
    </ErrorBoundary>
  );
}

function AnalyticsErrorFallback({ error, retry }: { error?: Error; retry: () => void }) {
  return (
    <div className="min-h-[400px] flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-purple-200">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
            <BarChart3 className="h-6 w-6 text-purple-600" />
          </div>
          <CardTitle className="text-purple-700">Analytics Error</CardTitle>
          <CardDescription>
            Unable to load analytics data. The reporting system may be temporarily unavailable.
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex justify-center space-x-2">
          <Button variant="outline" onClick={retry}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh Data
          </Button>
          <Button onClick={() => window.location.href = '/admin'}>
            Back to Dashboard
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

// API Error Boundary for data fetching components
export function ApiErrorBoundary({ 
  children, 
  fallbackMessage = "Unable to load data"
}: { 
  children: React.ReactNode;
  fallbackMessage?: string;
}) {
  return (
    <ErrorBoundary 
      fallback={({ error, retry }) => (
        <div className="flex items-center justify-center p-8">
          <Card className="w-full max-w-sm border-gray-200">
            <CardHeader className="text-center pb-4">
              <AlertTriangle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <CardTitle className="text-sm text-gray-600">{fallbackMessage}</CardTitle>
            </CardHeader>
            <CardFooter className="pt-0 flex justify-center">
              <Button size="sm" variant="outline" onClick={retry}>
                <RefreshCw className="mr-2 h-3 w-3" />
                Retry
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  );
}

// Network/Connection Error Boundary
export function NetworkErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary 
      fallback={({ error, retry }) => (
        <div className="min-h-[300px] flex items-center justify-center p-4">
          <Card className="w-full max-w-md border-yellow-200">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
              </div>
              <CardTitle className="text-yellow-700">Connection Error</CardTitle>
              <CardDescription>
                Unable to connect to the server. Please check your internet connection.
              </CardDescription>
            </CardHeader>
            <CardFooter className="flex justify-center space-x-2">
              <Button variant="outline" onClick={() => window.location.reload()}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Reload Page
              </Button>
              <Button onClick={retry}>Try Again</Button>
            </CardFooter>
          </Card>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  );
}