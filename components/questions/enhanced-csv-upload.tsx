'use client';

import React, { useState, useRef, useCallback } from 'react';
import * as XLSX from 'xlsx';
import {
  Upload,
  Download,
  FileText,
  AlertCircle,
  CheckCircle,
  Eye,
  RefreshCw,
  X,
  FileSpreadsheet,
  HelpCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// Simple Alert components for this file
const Alert = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`p-4 border rounded-lg ${className}`}>{children}</div>
);
const AlertTitle = ({ children }: { children: React.ReactNode }) => (
  <h4 className="font-medium mb-1">{children}</h4>
);
const AlertDescription = ({ children }: { children: React.ReactNode }) => (
  <div className="text-sm text-muted-foreground">{children}</div>
);
import { Separator } from '@/components/ui/separator';
import { BulkUploadResults, BulkUploadResult } from './bulk-upload-results';

export interface CsvValidationError {
  row: number;
  column: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface CsvPreviewData {
  headers: string[];
  rows: string[][];
  totalRows: number;
  validRows: number;
  errors: CsvValidationError[];
  worksheets?: string[]; // For Excel files
  selectedWorksheet?: string;
  fileType?: 'csv' | 'excel';
}

interface EnhancedCsvUploadProps {
  onUpload?: (data: any) => Promise<BulkUploadResult>;
  onClose?: () => void;
}

export function EnhancedCsvUpload({ onUpload, onClose }: EnhancedCsvUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<CsvPreviewData | null>(null);
  const [uploadResult, setUploadResult] = useState<BulkUploadResult | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<CsvValidationError[]>([]);
  const [activeTab, setActiveTab] = useState('upload');
  const [excelWorkbook, setExcelWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [selectedWorksheet, setSelectedWorksheet] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const requiredHeaders = [
    'questionText', 'questionType', 'options', 'correctAnswers',
    'classNumber', 'subject', 'chapter', 'topic'
  ];

  const optionalHeaders = [
    'subtopic', 'difficulty', 'marks', 'explanation', 'hint', 
    'tags', 'source', 'language', 'questionImageUrl', 
    'explanationImageUrl', 'hintImageUrl', 'estimatedTime', 'testTypes'
  ];

  const allHeaders = [...requiredHeaders, ...optionalHeaders];

  // Parse Excel file
  const parseExcelFile = useCallback(async (file: File): Promise<CsvPreviewData | null> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      setExcelWorkbook(workbook);
      
      const worksheetNames = workbook.SheetNames;
      if (worksheetNames.length === 0) {
        throw new Error('Excel file contains no worksheets');
      }
      
      // Use first worksheet by default
      const firstWorksheet = worksheetNames[0];
      setSelectedWorksheet(firstWorksheet);
      
      return parseExcelWorksheet(workbook, firstWorksheet, worksheetNames);
    } catch (error) {
      console.error('Error parsing Excel file:', error);
      return null;
    }
  }, []);
  
  // Validate CSV structure
  const validateCsv = useCallback((headers: string[], rows: string[][]): CsvValidationError[] => {
    const errors: CsvValidationError[] = [];
    
    // Check required headers
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    missingHeaders.forEach(header => {
      errors.push({
        row: 0,
        column: header,
        message: `Required column '${header}' is missing`,
        severity: 'error'
      });
    });

    // Validate rows
    rows.forEach((row, index) => {
      const rowNumber = index + 2; // +2 because index starts at 0 and we skip header
      
      // Check if row has enough columns
      if (row.length < headers.length) {
        errors.push({
          row: rowNumber,
          column: 'general',
          message: `Row has ${row.length} columns but expected ${headers.length}`,
          severity: 'error'
        });
      }

      // Validate required fields
      headers.forEach((header, colIndex) => {
        const value = row[colIndex]?.trim() || '';
        
        if (requiredHeaders.includes(header) && !value) {
          errors.push({
            row: rowNumber,
            column: header,
            message: `Required field '${header}' is empty`,
            severity: 'error'
          });
        }

        // Specific validations
        if (header === 'questionType' && value) {
          const validTypes = ['single-choice', 'multiple-choice', 'true-false', 'numerical', 'fill-in-blank'];
          if (!validTypes.includes(value)) {
            errors.push({
              row: rowNumber,
              column: header,
              message: `Invalid question type '${value}'. Must be one of: ${validTypes.join(', ')}`,
              severity: 'error'
            });
          }
        }

        if (header === 'classNumber' && value) {
          const classNum = parseInt(value);
          if (isNaN(classNum) || classNum < 6 || classNum > 12) {
            errors.push({
              row: rowNumber,
              column: header,
              message: `Invalid class number '${value}'. Must be between 6 and 12`,
              severity: 'error'
            });
          }
        }

        if (header === 'difficulty' && value) {
          const validDifficulties = ['easy', 'medium', 'hard'];
          if (!validDifficulties.includes(value.toLowerCase())) {
            errors.push({
              row: rowNumber,
              column: header,
              message: `Invalid difficulty '${value}'. Must be one of: ${validDifficulties.join(', ')}`,
              severity: 'warning'
            });
          }
        }
      });
    });

    return errors;
  }, [requiredHeaders]);
  
  // Parse specific Excel worksheet
  const parseExcelWorksheet = useCallback((workbook: XLSX.WorkBook, worksheetName: string, worksheetNames: string[]): CsvPreviewData => {
    const worksheet = workbook.Sheets[worksheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];
    
    if (jsonData.length < 2) {
      throw new Error('Worksheet must have at least a header row and one data row');
    }
    
    const headers = jsonData[0].map(h => h?.toString().trim() || '');
    const rows = jsonData.slice(1).filter(row => row.some(cell => cell !== undefined && cell !== null && cell.toString().trim() !== ''));
    
    const errors = validateCsv(headers, rows);
    const validRows = rows.length - errors.filter(e => e.severity === 'error').length;
    
    return {
      headers,
      rows: rows.map(row => row.map(cell => cell?.toString() || '')),
      totalRows: rows.length,
      validRows,
      errors,
      worksheets: worksheetNames,
      selectedWorksheet: worksheetName,
      fileType: 'excel'
    };
  }, [validateCsv]);
  
  // Handle worksheet change
  const handleWorksheetChange = useCallback((worksheetName: string) => {
    if (!excelWorkbook) return;
    
    setSelectedWorksheet(worksheetName);
    const previewData = parseExcelWorksheet(excelWorkbook, worksheetName, excelWorkbook.SheetNames);
    setCsvPreview(previewData);
    setValidationErrors(previewData.errors);
  }, [excelWorkbook, parseExcelWorksheet]);

  // Generate CSV template
  const generateTemplate = useCallback((type: 'basic' | 'complete' = 'basic', format: 'csv' | 'excel' = 'csv') => {
    const headers = type === 'basic' ? requiredHeaders : allHeaders;
    
    const sampleRows = [
      type === 'basic' ? [
        'What is 2 + 2?',
        'single-choice',
        'A) 3|B) 4|C) 5|D) 6',
        'B',
        '6',
        'Mathematics',
        'Basic Arithmetic',
        'Addition'
      ] : [
        'What is 2 + 2?',
        'single-choice',
        'A) 3|B) 4|C) 5|D) 6',
        'B',
        '6',
        'Mathematics',
        'Basic Arithmetic',
        'Addition',
        'Simple Addition',
        'easy',
        '1',
        'Addition is combining two or more numbers',
        'Think about counting objects',
        'math,arithmetic,basic',
        'Textbook Chapter 1',
        'English',
        '',
        '',
        '',
        '60',
        'practice,assessment'
      ]
    ];

    if (format === 'excel') {
      // Create Excel workbook
      const wb = XLSX.utils.book_new();
      const wsData = [headers, ...sampleRows];
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      
      // Set column widths for better readability
      const colWidths = headers.map((header, idx) => {
        const maxLength = Math.max(
          header.length,
          ...sampleRows.map(row => (row[idx] || '').toString().length)
        );
        return { wch: Math.min(Math.max(maxLength + 2, 10), 50) };
      });
      ws['!cols'] = colWidths;
      
      XLSX.utils.book_append_sheet(wb, ws, 'Questions');
      XLSX.writeFile(wb, `question-template-${type}.xlsx`);
    } else {
      // Create CSV file
      const csvContent = [headers.join(','), ...sampleRows.map(row => row.join(','))].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `question-template-${type}.csv`;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }
  }, [requiredHeaders, allHeaders]);

  // Parse CSV file
  const parseCsvFile = useCallback(async (file: File): Promise<CsvPreviewData | null> => {
    try {
      const text = await file.text();
      const lines = text.trim().split('\n');
      
      if (lines.length < 2) {
        throw new Error('CSV file must have at least a header row and one data row');
      }

      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const rows = lines.slice(1).map(line => {
        // Simple CSV parsing - for production, consider a proper CSV parser
        const values = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            values.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        values.push(current.trim());
        
        return values;
      }).filter(row => row.some(cell => cell.length > 0)); // Filter out empty rows

      const errors = validateCsv(headers, rows);
      const validRows = rows.length - errors.filter(e => e.severity === 'error').length;

      return {
        headers,
        rows,
        totalRows: rows.length,
        validRows,
        errors
      };
    } catch (error) {
      console.error('Error parsing CSV:', error);
      return null;
    }
  }, [validateCsv]);

  // Handle file selection
  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(csv|xlsx?)$/i)) {
      alert('Please select a CSV or Excel file');
      return;
    }

    setSelectedFile(file);
    setUploadResult(null);
    
    // Parse and preview the file
    if (file.name.endsWith('.csv')) {
      const preview = await parseCsvFile(file);
      setCsvPreview(preview);
      setValidationErrors(preview?.errors || []);
      if (preview) {
        setActiveTab('preview');
      }
    } else if (file.name.match(/\.(xlsx?|xlsm|xlsb)$/i)) {
      // Handle Excel files
      const preview = await parseExcelFile(file);
      setCsvPreview(preview);
      setValidationErrors(preview?.errors || []);
      if (preview) {
        setActiveTab('preview');
      }
    } else {
      alert('Unsupported file format. Please select a CSV or Excel file.');
      return;
    }
  }, [parseCsvFile, parseExcelFile]);

  // Handle upload
  const handleUpload = useCallback(async () => {
    if (!selectedFile || !onUpload) return;

    setIsUploading(true);
    try {
      const result = await onUpload(csvPreview);
      setUploadResult(result);
      setActiveTab('results');
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  }, [selectedFile, csvPreview, onUpload]);

  // Reset form
  const reset = useCallback(() => {
    setSelectedFile(null);
    setCsvPreview(null);
    setUploadResult(null);
    setValidationErrors([]);
    setActiveTab('upload');
    setExcelWorkbook(null);
    setSelectedWorksheet('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const errorCount = validationErrors.filter(e => e.severity === 'error').length;
  const warningCount = validationErrors.filter(e => e.severity === 'warning').length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Enhanced CSV & Excel Upload
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="upload">Upload</TabsTrigger>
              <TabsTrigger value="preview" disabled={!csvPreview}>Preview</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
              <TabsTrigger value="results" disabled={!uploadResult}>Results</TabsTrigger>
            </TabsList>

            {/* Upload Tab */}
            <TabsContent value="upload" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="file-upload">Select CSV or Excel File</Label>
                  <Input
                    ref={fileInputRef}
                    id="file-upload"
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileSelect}
                    className="mt-1"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Supports CSV and Excel (.xlsx, .xls) files. Maximum file size: 10MB
                  </p>
                </div>

                {selectedFile && (
                  <Card className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <span className="font-medium">{selectedFile.name}</span>
                        <Badge variant="secondary">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </Badge>
                      </div>
                      <Button variant="ghost" size="sm" onClick={reset}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                )}

                <Alert>
                  <HelpCircle className="h-4 w-4" />
                  <AlertTitle>Upload Guidelines</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc list-inside space-y-1 mt-2">
                      <li>Use the provided templates for best results</li>
                      <li>Required columns: questionText, questionType, options, correctAnswers, classNumber, subject, chapter, topic</li>
                      <li>Separate multiple options with pipe (|) character</li>
                      <li>For multiple correct answers, separate with commas</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              </div>
            </TabsContent>

            {/* Preview Tab */}
            <TabsContent value="preview" className="space-y-4">
              {csvPreview && (
                <div className="space-y-4">
                  {/* Worksheet Selector for Excel files */}
                  {csvPreview.fileType === 'excel' && csvPreview.worksheets && csvPreview.worksheets.length > 1 && (
                    <Card className="p-4">
                      <div className="flex items-center gap-4">
                        <FileSpreadsheet className="h-5 w-5 text-green-600" />
                        <div className="flex-1">
                          <Label htmlFor="worksheet-select" className="text-sm font-medium">
                            Select Worksheet
                          </Label>
                          <select 
                            id="worksheet-select"
                            value={selectedWorksheet}
                            onChange={(e) => handleWorksheetChange(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          >
                            {csvPreview.worksheets.map(name => (
                              <option key={name} value={name}>{name}</option>
                            ))}
                          </select>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {csvPreview.worksheets.length} sheets
                        </Badge>
                      </div>
                    </Card>
                  )}
                  
                  {/* File Type Indicator */}
                  <div className="flex items-center gap-2 mb-4">
                    {csvPreview.fileType === 'excel' ? (
                      <>
                        <FileSpreadsheet className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-muted-foreground">
                          Excel file: {csvPreview.selectedWorksheet || 'Sheet1'}
                        </span>
                      </>
                    ) : (
                      <>
                        <FileText className="h-4 w-4 text-blue-600" />
                        <span className="text-sm text-muted-foreground">CSV file</span>
                      </>
                    )}
                  </div>

                  {/* Summary */}
                  <div className="grid grid-cols-3 gap-4">
                    <Card className="p-4 text-center">
                      <div className="text-2xl font-bold text-blue-600">{csvPreview.totalRows}</div>
                      <div className="text-sm text-muted-foreground">Total Rows</div>
                    </Card>
                    <Card className="p-4 text-center">
                      <div className="text-2xl font-bold text-green-600">{csvPreview.validRows}</div>
                      <div className="text-sm text-muted-foreground">Valid Rows</div>
                    </Card>
                    <Card className="p-4 text-center">
                      <div className="text-2xl font-bold text-red-600">{errorCount}</div>
                      <div className="text-sm text-muted-foreground">Errors</div>
                    </Card>
                  </div>

                  {/* Validation Results */}
                  {validationErrors.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Validation Results</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {validationErrors.slice(0, 10).map((error, index) => (
                            <div
                              key={index}
                              className={`p-2 rounded-lg border ${
                                error.severity === 'error' 
                                  ? 'border-red-200 bg-red-50 text-red-800'
                                  : 'border-yellow-200 bg-yellow-50 text-yellow-800'
                              }`}
                            >
                              <div className="flex items-start gap-2">
                                {error.severity === 'error' ? 
                                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" /> :
                                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                }
                                <div>
                                  <div className="font-medium text-sm">
                                    Row {error.row} - {error.column}
                                  </div>
                                  <div className="text-sm">{error.message}</div>
                                </div>
                              </div>
                            </div>
                          ))}
                          {validationErrors.length > 10 && (
                            <div className="text-sm text-muted-foreground text-center p-2">
                              ...and {validationErrors.length - 10} more issues
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Data Preview */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Data Preview (First 5 rows)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              {csvPreview.headers.slice(0, 6).map((header, index) => (
                                <th key={index} className="text-left p-2 font-medium">
                                  {header}
                                </th>
                              ))}
                              {csvPreview.headers.length > 6 && (
                                <th className="text-left p-2 font-medium">...</th>
                              )}
                            </tr>
                          </thead>
                          <tbody>
                            {csvPreview.rows.slice(0, 5).map((row, rowIndex) => (
                              <tr key={rowIndex} className="border-b">
                                {row.slice(0, 6).map((cell, cellIndex) => (
                                  <td key={cellIndex} className="p-2 max-w-32 truncate">
                                    {cell}
                                  </td>
                                ))}
                                {row.length > 6 && <td className="p-2">...</td>}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Upload Button */}
                  <div className="flex justify-center">
                    <Button
                      onClick={handleUpload}
                      disabled={errorCount > 0 || isUploading}
                      className="px-8"
                    >
                      {isUploading ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Upload {csvPreview.validRows} Questions
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Templates Tab */}
            <TabsContent value="templates" className="space-y-4">
              <div className="space-y-4">
                <Alert>
                  <FileSpreadsheet className="h-4 w-4" />
                  <AlertTitle>File Templates</AlertTitle>
                  <AlertDescription>
                    Download pre-formatted templates in CSV or Excel format to ensure proper data structure
                  </AlertDescription>
                </Alert>

                <div className="space-y-6">
                  {/* Basic Templates */}
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Basic Templates
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-blue-600" />
                            <h4 className="font-medium">CSV Format</h4>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Basic template with required columns only
                          </p>
                          <Button 
                            variant="outline" 
                            onClick={() => generateTemplate('basic', 'csv')}
                            className="w-full"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download CSV
                          </Button>
                        </div>
                      </Card>

                      <Card className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <FileSpreadsheet className="h-5 w-5 text-green-600" />
                            <h4 className="font-medium">Excel Format</h4>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Basic template with enhanced Excel formatting
                          </p>
                          <Button 
                            variant="outline" 
                            onClick={() => generateTemplate('basic', 'excel')}
                            className="w-full"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download Excel
                          </Button>
                        </div>
                      </Card>
                    </div>
                  </div>

                  {/* Complete Templates */}
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <FileSpreadsheet className="h-4 w-4" />
                      Complete Templates
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-blue-600" />
                            <h4 className="font-medium">CSV Format</h4>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            All columns included for comprehensive data entry
                          </p>
                          <Button 
                            variant="outline" 
                            onClick={() => generateTemplate('complete', 'csv')}
                            className="w-full"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download CSV
                          </Button>
                        </div>
                      </Card>

                      <Card className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <FileSpreadsheet className="h-5 w-5 text-green-600" />
                            <h4 className="font-medium">Excel Format</h4>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            All columns with Excel validation and formatting
                          </p>
                          <Button 
                            variant="outline" 
                            onClick={() => generateTemplate('complete', 'excel')}
                            className="w-full"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download Excel
                          </Button>
                        </div>
                      </Card>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <h3 className="font-semibold">Column Descriptions</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <h4 className="font-medium text-red-600 mb-2">Required Columns</h4>
                      <ul className="space-y-1">
                        {requiredHeaders.map(header => (
                          <li key={header} className="flex items-start gap-2">
                            <span className="font-mono text-xs bg-red-50 px-1 rounded">{header}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium text-blue-600 mb-2">Optional Columns</h4>
                      <ul className="space-y-1">
                        {optionalHeaders.slice(0, 8).map(header => (
                          <li key={header} className="flex items-start gap-2">
                            <span className="font-mono text-xs bg-blue-50 px-1 rounded">{header}</span>
                          </li>
                        ))}
                        <li className="text-muted-foreground">...and more</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Results Tab */}
            <TabsContent value="results">
              {uploadResult && (
                <BulkUploadResults
                  results={uploadResult}
                  onClose={() => setActiveTab('upload')}
                  onRetry={reset}
                />
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}