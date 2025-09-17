'use client';

import React, { useState } from 'react';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  Download,
  Eye,
  EyeOff,
  Filter,
  Search,
  AlertCircle,
  FileText,
  BarChart3,
  Clock,
  Target,
  BookOpen,
  Tag,
  User
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

export interface BulkUploadError {
  row: number;
  field?: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  suggestion?: string;
}

export interface BulkUploadResult {
  sessionId: string;
  totalRows: number;
  processedRows: number;
  successfulRows: number;
  failedRows: number;
  status: 'processing' | 'completed' | 'failed' | 'partial';
  errors: BulkUploadError[];
  warnings: BulkUploadError[];
  successful: any[];
  failed: any[];
  startTime: string;
  endTime?: string;
  processingTime?: number;
  hierarchySummary?: {
    [classNumber: string]: {
      [subject: string]: {
        [chapter: string]: {
          topics: string[];
          count: number;
        };
      };
    };
  };
  autoTestCreated?: {
    testId: string;
    testTitle: string;
    questionCount: number;
  };
}

interface BulkUploadResultsProps {
  results: BulkUploadResult;
  onClose?: () => void;
  onRetry?: () => void;
  onDownloadReport?: () => void;
}

export function BulkUploadResults({
  results,
  onClose,
  onRetry,
  onDownloadReport
}: BulkUploadResultsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<'all' | 'error' | 'warning' | 'info'>('all');
  const [expandedErrors, setExpandedErrors] = useState<Set<number>>(new Set());
  const [showDetails, setShowDetails] = useState(false);

  const allIssues = [...results.errors, ...results.warnings].sort((a, b) => a.row - b.row);
  
  const filteredIssues = allIssues.filter(issue => {
    const matchesSearch = !searchTerm || 
      issue.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.field?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.row.toString().includes(searchTerm);
    
    const matchesSeverity = severityFilter === 'all' || issue.severity === severityFilter;
    
    return matchesSearch && matchesSeverity;
  });

  const successRate = results.totalRows > 0 ? (results.successfulRows / results.totalRows) * 100 : 0;
  const errorRate = results.totalRows > 0 ? (results.failedRows / results.totalRows) * 100 : 0;

  const toggleErrorExpansion = (row: number) => {
    const newExpanded = new Set(expandedErrors);
    if (newExpanded.has(row)) {
      newExpanded.delete(row);
    } else {
      newExpanded.add(row);
    }
    setExpandedErrors(newExpanded);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error': return 'text-red-600 bg-red-50 border-red-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'info': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error': return <XCircle className="h-4 w-4" />;
      case 'warning': return <AlertTriangle className="h-4 w-4" />;
      case 'info': return <Info className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50 border-green-200';
      case 'failed': return 'text-red-600 bg-red-50 border-red-200';
      case 'partial': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'processing': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const generateReport = () => {
    const report = {
      sessionId: results.sessionId,
      summary: {
        totalRows: results.totalRows,
        successful: results.successfulRows,
        failed: results.failedRows,
        successRate: `${successRate.toFixed(1)}%`,
        processingTime: results.processingTime ? formatDuration(results.processingTime) : 'N/A'
      },
      issues: filteredIssues.map(issue => ({
        row: issue.row,
        severity: issue.severity,
        field: issue.field,
        message: issue.message,
        suggestion: issue.suggestion
      })),
      hierarchy: results.hierarchySummary,
      autoTest: results.autoTestCreated
    };
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bulk-upload-report-${results.sessionId}.json`;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                Bulk Upload Results
                <Badge className={getStatusColor(results.status)}>
                  {results.status.charAt(0).toUpperCase() + results.status.slice(1)}
                </Badge>
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Session ID: {results.sessionId}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDetails(!showDetails)}
              >
                {showDetails ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {showDetails ? 'Hide' : 'Show'} Details
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={generateReport}
              >
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
              {onClose && (
                <Button variant="outline" size="sm" onClick={onClose}>
                  Close
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Progress Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{results.successfulRows}</div>
              <div className="text-sm text-muted-foreground">Successful</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{results.failedRows}</div>
              <div className="text-sm text-muted-foreground">Failed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{results.totalRows}</div>
              <div className="text-sm text-muted-foreground">Total Rows</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{successRate.toFixed(1)}%</div>
              <div className="text-sm text-muted-foreground">Success Rate</div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{results.processedRows} / {results.totalRows}</span>
            </div>
            <Progress 
              value={(results.processedRows / results.totalRows) * 100} 
              className="h-2"
            />
          </div>
          
          {/* Processing Time */}
          {results.processingTime && (
            <div className="mt-4 text-sm text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Processing time: {formatDuration(results.processingTime)}
            </div>
          )}
          
          {/* Auto-created Test */}
          {results.autoTestCreated && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 text-green-800">
                <CheckCircle className="h-4 w-4" />
                <strong>Auto-test Created Successfully</strong>
              </div>
              <div className="text-sm text-green-700 mt-1">
                Test "{results.autoTestCreated.testTitle}" created with {results.autoTestCreated.questionCount} questions
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {showDetails && (
        <Tabs defaultValue="issues" className="space-y-4">
          <TabsList>
            <TabsTrigger value="issues" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Issues ({filteredIssues.length})
            </TabsTrigger>
            <TabsTrigger value="hierarchy" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Hierarchy
            </TabsTrigger>
            <TabsTrigger value="successful" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Successful ({results.successfulRows})
            </TabsTrigger>
          </TabsList>

          {/* Issues Tab */}
          <TabsContent value="issues" className="space-y-4">
            {/* Filters */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search issues..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <Select value={severityFilter} onValueChange={(value: any) => setSeverityFilter(value)}>
                    <SelectTrigger className="w-48">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Filter by severity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Severities</SelectItem>
                      <SelectItem value="error">Errors Only</SelectItem>
                      <SelectItem value="warning">Warnings Only</SelectItem>
                      <SelectItem value="info">Info Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Issues List */}
            {filteredIssues.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Issues Found ({filteredIssues.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="max-h-96">
                    <div className="space-y-3">
                      {filteredIssues.map((issue, index) => (
                        <Collapsible
                          key={`${issue.row}-${index}`}
                          open={expandedErrors.has(issue.row)}
                          onOpenChange={() => toggleErrorExpansion(issue.row)}
                        >
                          <CollapsibleTrigger asChild>
                            <div className={`p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors ${getSeverityColor(issue.severity)}`}>
                              <div className="flex items-start justify-between">
                                <div className="flex items-start gap-3">
                                  {getSeverityIcon(issue.severity)}
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline" className="text-xs">
                                        Row {issue.row}
                                      </Badge>
                                      {issue.field && (
                                        <Badge variant="outline" className="text-xs">
                                          {issue.field}
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="font-medium">{issue.message}</div>
                                  </div>
                                </div>
                                <Badge className={getSeverityColor(issue.severity)}>
                                  {issue.severity}
                                </Badge>
                              </div>
                            </div>
                          </CollapsibleTrigger>
                          
                          <CollapsibleContent>
                            {issue.suggestion && (
                              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <div className="flex items-start gap-2">
                                  <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                  <div>
                                    <div className="font-medium text-blue-800 text-sm">Suggestion:</div>
                                    <div className="text-blue-700 text-sm">{issue.suggestion}</div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </CollapsibleContent>
                        </Collapsible>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <h3 className="text-lg font-semibold mb-2">No Issues Found</h3>
                  <p className="text-muted-foreground">
                    All questions were processed successfully without any errors or warnings.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Hierarchy Tab */}
          <TabsContent value="hierarchy">
            {results.hierarchySummary ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Question Hierarchy Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(results.hierarchySummary).map(([classNum, subjects]) => (
                      <div key={classNum} className="space-y-3">
                        <h3 className="font-semibold flex items-center gap-2">
                          <BookOpen className="h-4 w-4" />
                          Class {classNum}
                        </h3>
                        
                        <div className="grid gap-3 ml-6">
                          {Object.entries(subjects).map(([subject, chapters]) => (
                            <div key={subject} className="space-y-2">
                              <h4 className="font-medium flex items-center gap-2 text-sm">
                                <Tag className="h-3 w-3" />
                                {subject}
                              </h4>
                              
                              <div className="grid gap-2 ml-5">
                                {Object.entries(chapters).map(([chapter, details]) => (
                                  <div key={chapter} className="p-2 bg-muted/50 rounded-lg">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="font-medium text-sm">{chapter}</span>
                                      <Badge variant="secondary" className="text-xs">
                                        {details.count} questions
                                      </Badge>
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      Topics: {details.topics.join(', ')}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No Hierarchy Data</h3>
                  <p className="text-muted-foreground">
                    Hierarchy information is not available for this upload session.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Successful Questions Tab */}
          <TabsContent value="successful">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Successfully Processed Questions ({results.successfulRows})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {results.successful.length > 0 ? (
                  <ScrollArea className="max-h-96">
                    <div className="space-y-2">
                      {results.successful.map((item, index) => (
                        <div key={index} className="p-3 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                Row {item.row}
                              </Badge>
                              <span className="text-sm font-medium">
                                {item.data?.questionText?.substring(0, 60)}
                                {item.data?.questionText?.length > 60 ? '...' : ''}
                              </span>
                            </div>
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          </div>
                          
                          {item.questionId && (
                            <div className="mt-2 text-xs text-muted-foreground">
                              Question ID: {item.questionId}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="text-center py-8">
                    <XCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No Successful Questions</h3>
                    <p className="text-muted-foreground">
                      No questions were successfully processed in this upload.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Action Buttons */}
      {results.status === 'failed' || results.status === 'partial' ? (
        <div className="flex justify-center gap-2">
          {onRetry && (
            <Button onClick={onRetry} variant="outline">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Retry Upload
            </Button>
          )}
          <Button onClick={generateReport}>
            <Download className="h-4 w-4 mr-2" />
            Download Full Report
          </Button>
        </div>
      ) : null}
    </div>
  );
}