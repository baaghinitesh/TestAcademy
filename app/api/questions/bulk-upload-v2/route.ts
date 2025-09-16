import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '../../../../backend/utils/database';
import QuestionEnhanced from '../../../../backend/models/QuestionEnhancedV2';
import Subject from '../../../../backend/models/Subject';
import Test from '../../../../backend/models/Test';
import { auth } from '../../../../lib/auth/middleware-mongo';

interface CSVQuestionRow {
  questionText: string;
  questionType: 'single-choice' | 'multiple-choice' | 'true-false' | 'fill-blank' | 'numerical';
  options: string; // Pipe-separated options
  correctAnswers: string; // Comma-separated correct answer indices or text
  classNumber: number;
  subject: string; // Subject name or ID
  chapter: string;
  topic: string;
  subtopic?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  marks?: number;
  explanation?: string;
  hint?: string;
  tags?: string; // Comma-separated tags
  source?: string;
  language?: string;
  questionImageUrl?: string;
  explanationImageUrl?: string;
  hintImageUrl?: string;
  estimatedTime?: number;
  testTypes?: string; // Comma-separated test types
}

interface UploadSession {
  sessionId: string;
  totalRows: number;
  processedRows: number;
  successfulRows: number;
  failedRows: number;
  batchId: string;
  results: {
    successful: any[];
    failed: any[];
    warnings: any[];
  };
  autoTestSettings?: {
    createTest: boolean;
    testTitle?: string;
    testDescription?: string;
    duration?: number;
  };
  createdAt: Date;
  createdBy: string;
}

// In-memory storage for upload sessions (in production, use Redis)
const uploadSessions = new Map<string, UploadSession>();

// POST /api/questions/bulk-upload-v2 - Enhanced bulk upload with hierarchical validation
export async function POST(req: NextRequest) {
  try {
    const user = await auth(req);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    
    const body = await req.json();
    const { 
      csvData, 
      sessionId,
      autoCreateTest = false,
      testTitle,
      testDescription,
      testDuration = 60,
      validateOnly = false 
    } = body;
    
    if (!csvData || !Array.isArray(csvData)) {
      return NextResponse.json({
        error: 'CSV data is required and must be an array'
      }, { status: 400 });
    }
    
    const batchId = `batch_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const finalSessionId = sessionId || `session_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    
    // Initialize upload session
    const session: UploadSession = {
      sessionId: finalSessionId,
      totalRows: csvData.length,
      processedRows: 0,
      successfulRows: 0,
      failedRows: 0,
      batchId,
      results: {
        successful: [],
        failed: [],
        warnings: []
      },
      autoTestSettings: autoCreateTest ? {
        createTest: true,
        testTitle: testTitle || `Auto-generated Test - ${new Date().toLocaleDateString()}`,
        testDescription: testDescription || 'Automatically created from bulk question upload',
        duration: testDuration
      } : undefined,
      createdAt: new Date(),
      createdBy: user.id
    };
    
    uploadSessions.set(finalSessionId, session);
    
    // Process CSV data in chunks for better performance
    const chunkSize = 50;
    const chunks = [];
    for (let i = 0; i < csvData.length; i += chunkSize) {
      chunks.push(csvData.slice(i, i + chunkSize));
    }
    
    // Get all subjects for validation
    const subjects = await Subject.find({ isActive: true }).lean();
    const subjectMap = new Map();
    subjects.forEach(subject => {
      subjectMap.set(subject.name.toLowerCase(), subject);
      subjectMap.set(subject._id.toString(), subject);
    });
    
    // Process each chunk
    for (const chunk of chunks) {
      const chunkResult = await processCSVChunk(chunk, session, subjectMap, user.id, validateOnly);
      
      // Update session with chunk results
      session.results.successful.push(...chunkResult.successful);
      session.results.failed.push(...chunkResult.failed);
      session.results.warnings.push(...chunkResult.warnings);
      session.successfulRows += chunkResult.successful.length;
      session.failedRows += chunkResult.failed.length;
      session.processedRows += chunk.length;
    }
    
    // Create hierarchical summary
    const hierarchySummary = generateHierarchySummary(session.results.successful);
    
    // Auto-create test if requested and questions were successfully created
    let autoCreatedTest = null;
    if (!validateOnly && autoCreateTest && session.successfulRows > 0) {
      try {
        autoCreatedTest = await createAutoTest(session, hierarchySummary, user.id);
        if (autoCreatedTest) {
          session.results.warnings.push({
            type: 'auto-test-created',
            message: `Auto-created test: ${autoCreatedTest.title}`,
            testId: autoCreatedTest._id
          });
        }
      } catch (error: any) {
        session.results.warnings.push({
          type: 'auto-test-failed',
          message: `Failed to create auto-test: ${error.message}`
        });
      }
    }
    
    // Update subject chapters and topics if new ones were added
    if (!validateOnly && session.successfulRows > 0) {
      await updateSubjectHierarchy(hierarchySummary, subjectMap);
    }
    
    // Clean up session after 2 hours
    setTimeout(() => uploadSessions.delete(finalSessionId), 7200000);
    
    const response = {
      success: true,
      sessionId: finalSessionId,
      batchId,
      validateOnly,
      summary: {
        totalRows: session.totalRows,
        processedRows: session.processedRows,
        successfulRows: session.successfulRows,
        failedRows: session.failedRows,
        warningsCount: session.results.warnings.length
      },
      hierarchySummary,
      autoCreatedTest,
      results: {
        successful: session.results.successful,
        failed: session.results.failed,
        warnings: session.results.warnings
      },
      message: validateOnly 
        ? `Validation complete. ${session.successfulRows} valid questions, ${session.failedRows} errors found.`
        : `Upload complete. ${session.successfulRows} questions created, ${session.failedRows} failed.`
    };
    
    return NextResponse.json(response);
    
  } catch (error: any) {
    console.error('Enhanced bulk upload error:', error);
    return NextResponse.json(
      { error: 'Failed to process bulk upload', details: error.message },
      { status: 500 }
    );
  }
}

// GET /api/questions/bulk-upload-v2 - Get session status or download templates
export async function GET(req: NextRequest) {
  try {
    const user = await auth(req);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');
    const action = searchParams.get('action');
    
    // Download CSV template
    if (action === 'template') {
      const template = generateCSVTemplate();
      return NextResponse.json({
        success: true,
        template,
        message: 'CSV template generated successfully'
      });
    }
    
    // Get session status
    if (sessionId) {
      const session = uploadSessions.get(sessionId);
      if (!session) {
        return NextResponse.json({
          error: 'Session not found or expired'
        }, { status: 404 });
      }
      
      return NextResponse.json({
        success: true,
        session: {
          sessionId: session.sessionId,
          batchId: session.batchId,
          summary: {
            totalRows: session.totalRows,
            processedRows: session.processedRows,
            successfulRows: session.successfulRows,
            failedRows: session.failedRows
          },
          autoTestSettings: session.autoTestSettings,
          createdAt: session.createdAt
        }
      });
    }
    
    // List all active sessions
    const activeSessions = Array.from(uploadSessions.values())
      .filter(session => 
        session.createdBy === user.id && 
        Date.now() - session.createdAt.getTime() < 7200000 // Within 2 hours
      )
      .map(session => ({
        sessionId: session.sessionId,
        batchId: session.batchId,
        totalRows: session.totalRows,
        successfulRows: session.successfulRows,
        failedRows: session.failedRows,
        createdAt: session.createdAt
      }));
    
    return NextResponse.json({
      success: true,
      activeSessions
    });
    
  } catch (error: any) {
    console.error('Get session error:', error);
    return NextResponse.json(
      { error: 'Failed to get session status', details: error.message },
      { status: 500 }
    );
  }
}

// Process CSV chunk with enhanced validation
async function processCSVChunk(
  rows: any[], 
  session: UploadSession, 
  subjectMap: Map<string, any>, 
  userId: string, 
  validateOnly: boolean
) {
  const successful: any[] = [];
  const failed: any[] = [];
  const warnings: any[] = [];
  
  for (let i = 0; i < rows.length; i++) {
    const rowIndex = session.processedRows + i + 1;
    const row: CSVQuestionRow = rows[i];
    
    try {
      // Validate required fields
      const validation = validateCSVRow(row, rowIndex, subjectMap);
      
      if (!validation.isValid) {
        failed.push({
          row: rowIndex,
          data: row,
          errors: validation.errors
        });
        continue;
      }
      
      if (validation.warnings.length > 0) {
        warnings.push(...validation.warnings.map(warning => ({
          row: rowIndex,
          type: 'validation-warning',
          message: warning
        })));
      }
      
      // If validation only, don't create the question
      if (validateOnly) {
        successful.push({
          row: rowIndex,
          data: row,
          validation: 'passed'
        });
        continue;
      }
      
      // Create question document
      const questionData = await createQuestionFromCSVRow(row, session.batchId, userId, rowIndex);
      
      successful.push({
        row: rowIndex,
        data: row,
        questionId: questionData._id,
        created: true
      });
      
    } catch (error: any) {
      failed.push({
        row: rowIndex,
        data: row,
        errors: [`Unexpected error: ${error.message}`]
      });
    }
  }
  
  return { successful, failed, warnings };
}

// Enhanced CSV row validation
function validateCSVRow(row: CSVQuestionRow, rowIndex: number, subjectMap: Map<string, any>) {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Required field validation
  if (!row.questionText?.trim()) {
    errors.push('Question text is required');
  }
  
  if (!row.questionType || !['single-choice', 'multiple-choice', 'true-false', 'fill-blank', 'numerical'].includes(row.questionType)) {
    errors.push('Valid question type is required (single-choice, multiple-choice, true-false, fill-blank, numerical)');
  }
  
  if (!row.options?.trim()) {
    errors.push('Options are required');
  }
  
  if (!row.correctAnswers?.trim()) {
    errors.push('Correct answers are required');
  }
  
  if (!row.classNumber || isNaN(row.classNumber) || row.classNumber < 5 || row.classNumber > 12) {
    errors.push('Valid class number (5-12) is required');
  }
  
  if (!row.subject?.trim()) {
    errors.push('Subject is required');
  }
  
  if (!row.chapter?.trim()) {
    errors.push('Chapter is required for proper hierarchical organization');
  }
  
  if (!row.topic?.trim()) {
    errors.push('Topic is required for proper hierarchical organization');
  }
  
  // Subject validation
  if (row.subject) {
    const subjectKey = row.subject.toLowerCase();
    if (!subjectMap.has(subjectKey) && !subjectMap.has(row.subject)) {
      errors.push(`Subject "${row.subject}" not found. Please create the subject first.`);
    }
  }
  
  // Options validation
  if (row.options) {
    const options = row.options.split('|').map(opt => opt.trim()).filter(Boolean);
    if (options.length < 2) {
      errors.push('At least 2 options are required (separate with |)');
    }
    
    if (row.questionType === 'true-false' && options.length !== 2) {
      errors.push('True/false questions must have exactly 2 options');
    }
    
    // Validate correct answers
    if (row.correctAnswers) {
      const correctAnswers = row.correctAnswers.split(',').map(ans => ans.trim());
      const invalidAnswers = correctAnswers.filter(ans => {
        const index = parseInt(ans) - 1;
        return isNaN(index) || index < 0 || index >= options.length;
      });
      
      if (invalidAnswers.length > 0) {
        errors.push('Invalid correct answer indices. Use 1,2,3... format matching option positions');
      }
      
      // Question type specific validation
      if (row.questionType === 'single-choice' && correctAnswers.length !== 1) {
        errors.push('Single-choice questions must have exactly one correct answer');
      }
      
      if (row.questionType === 'multiple-choice' && correctAnswers.length < 1) {
        errors.push('Multiple-choice questions must have at least one correct answer');
      }
      
      if (row.questionType === 'true-false' && correctAnswers.length !== 1) {
        errors.push('True/false questions must have exactly one correct answer');
      }
    }
  }
  
  // Optional field validation with warnings
  if (!row.difficulty) {
    warnings.push('Difficulty not specified, defaulting to "medium"');
  }
  
  if (!row.marks || isNaN(row.marks)) {
    warnings.push('Marks not specified, defaulting to 1');
  }
  
  if (row.marks && (row.marks < 0.5 || row.marks > 20)) {
    errors.push('Marks must be between 0.5 and 20');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// Create question from CSV row
async function createQuestionFromCSVRow(
  row: CSVQuestionRow, 
  batchId: string, 
  userId: string, 
  rowIndex: number
) {
  // Get subject ID
  const subjects = await Subject.find({ isActive: true }).lean();
  const subject = subjects.find(s => 
    s.name.toLowerCase() === row.subject.toLowerCase() || 
    s._id.toString() === row.subject
  );
  
  if (!subject) {
    throw new Error(`Subject "${row.subject}" not found`);
  }
  
  // Parse options
  const optionsArray = row.options.split('|').map(opt => opt.trim()).filter(Boolean);
  const correctAnswersArray = row.correctAnswers.split(',').map(ans => parseInt(ans.trim()) - 1);
  
  // Build options with correct flags
  const options = optionsArray.map((text, index) => ({
    text,
    isCorrect: correctAnswersArray.includes(index),
    order: index + 1
  }));
  
  // Parse tags
  const tags = row.tags ? row.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [];
  
  // Parse test types
  const testTypes = row.testTypes ? 
    row.testTypes.split(',').map(type => type.trim()).filter(Boolean) : 
    ['practice', 'quiz'];
  
  // Create question
  const questionData = new QuestionEnhanced({
    question: row.questionText,
    questionType: row.questionType,
    options,
    classNumber: row.classNumber,
    subject: subject._id,
    chapter: row.chapter,
    topic: row.topic,
    subtopic: row.subtopic,
    difficulty: row.difficulty || 'medium',
    marks: row.marks || 1,
    explanation: row.explanation,
    hint: row.hint,
    questionImageUrl: row.questionImageUrl,
    explanationImageUrl: row.explanationImageUrl,
    hintImageUrl: row.hintImageUrl,
    tags,
    source: row.source,
    language: row.language || 'English',
    testTypes,
    estimatedTime: row.estimatedTime || 60,
    batchId,
    importSource: 'CSV',
    csvRowNumber: rowIndex,
    createdBy: userId
  });
  
  await questionData.save();
  return questionData;
}

// Generate hierarchy summary
function generateHierarchySummary(successfulQuestions: any[]) {
  const hierarchy: any = {};
  
  successfulQuestions.forEach(item => {
    const { classNumber, subject, chapter, topic, subtopic } = item.data;
    
    if (!hierarchy[classNumber]) {
      hierarchy[classNumber] = {};
    }
    
    if (!hierarchy[classNumber][subject]) {
      hierarchy[classNumber][subject] = {};
    }
    
    if (!hierarchy[classNumber][subject][chapter]) {
      hierarchy[classNumber][subject][chapter] = {
        topics: new Set(),
        count: 0
      };
    }
    
    hierarchy[classNumber][subject][chapter].topics.add(topic);
    hierarchy[classNumber][subject][chapter].count++;
  });
  
  // Convert sets to arrays for JSON serialization
  Object.keys(hierarchy).forEach(classNum => {
    Object.keys(hierarchy[classNum]).forEach(subject => {
      Object.keys(hierarchy[classNum][subject]).forEach(chapter => {
        hierarchy[classNum][subject][chapter].topics = 
          Array.from(hierarchy[classNum][subject][chapter].topics);
      });
    });
  });
  
  return hierarchy;
}

// Auto-create test from uploaded questions
async function createAutoTest(session: UploadSession, hierarchySummary: any, userId: string) {
  const { autoTestSettings } = session;
  if (!autoTestSettings?.createTest) return null;
  
  // Find the most common class/subject combination
  let maxQuestions = 0;
  let selectedClass = null;
  let selectedSubject = null;
  
  Object.entries(hierarchySummary).forEach(([classNum, subjects]: [string, any]) => {
    Object.entries(subjects).forEach(([subject, chapters]: [string, any]) => {
      const totalQuestions = Object.values(chapters).reduce(
        (sum: number, chapter: any) => sum + chapter.count, 0
      );
      if (totalQuestions > maxQuestions) {
        maxQuestions = totalQuestions;
        selectedClass = parseInt(classNum);
        selectedSubject = subject;
      }
    });
  });
  
  if (!selectedClass || !selectedSubject || maxQuestions === 0) {
    throw new Error('No suitable questions found for auto-test creation');
  }
  
  // Get subject document
  const subjectDoc = await Subject.findOne({ 
    name: new RegExp(`^${selectedSubject}$`, 'i') 
  });
  
  if (!subjectDoc) {
    throw new Error('Subject not found for auto-test creation');
  }
  
  // Get questions from batch for this class/subject
  const batchQuestions = await QuestionEnhanced.find({
    batchId: session.batchId,
    classNumber: selectedClass,
    subject: subjectDoc._id,
    isActive: true
  }).sort({ createdAt: 1 });
  
  if (batchQuestions.length === 0) {
    throw new Error('No questions found in batch for auto-test creation');
  }
  
  // Calculate test parameters
  const totalMarks = batchQuestions.reduce((sum, q) => sum + q.marks, 0);
  const passingMarks = Math.ceil(totalMarks * 0.4); // 40% passing marks
  
  // Create test
  const testData = new Test({
    title: autoTestSettings.testTitle || `Auto Test - ${selectedSubject} Class ${selectedClass}`,
    description: autoTestSettings.testDescription || `Auto-generated test from ${batchQuestions.length} questions`,
    subject: subjectDoc._id,
    classNumber: selectedClass,
    duration: autoTestSettings.duration || 60,
    totalQuestions: batchQuestions.length,
    totalMarks,
    passingMarks,
    instructions: [
      'Read all questions carefully',
      'Select the best answer for each question',
      'You can review and change answers before submitting',
      `Time limit: ${autoTestSettings.duration || 60} minutes`
    ],
    isActive: true,
    isPublished: false, // Auto-created tests start as drafts
    allowedAttempts: 1,
    showResults: true,
    showCorrectAnswers: false,
    randomizeQuestions: true,
    randomizeOptions: true,
    createdBy: userId
  });
  
  await testData.save();
  
  // Associate questions with test and set order
  await QuestionEnhanced.updateMany(
    { _id: { $in: batchQuestions.map(q => q._id) } },
    { test: testData._id }
  );
  
  // Set question order
  for (let i = 0; i < batchQuestions.length; i++) {
    await QuestionEnhanced.findByIdAndUpdate(
      batchQuestions[i]._id,
      { order: i + 1 }
    );
  }
  
  return testData;
}

// Update subject hierarchy with new chapters/topics
async function updateSubjectHierarchy(hierarchySummary: any, subjectMap: Map<string, any>) {
  for (const [classNum, subjects] of Object.entries(hierarchySummary)) {
    for (const [subjectName, chapters] of Object.entries(subjects as any)) {
      const subject = Array.from(subjectMap.values()).find((s: any) => 
        s.name.toLowerCase() === subjectName.toLowerCase()
      );
      
      if (!subject) continue;
      
      const classNumber = parseInt(classNum);
      const existingChapters = subject.chapters?.get(classNumber) || [];
      const existingChapterNames = new Set(existingChapters.map((c: any) => c.name));
      
      const newChapters = [...existingChapters];
      
      for (const [chapterName, chapterData] of Object.entries(chapters as any)) {
        if (!existingChapterNames.has(chapterName)) {
          newChapters.push({
            name: chapterName,
            description: `Auto-generated from CSV upload`,
            topics: (chapterData as any).topics,
            isActive: true
          });
        } else {
          // Update existing chapter with new topics
          const existingChapter = newChapters.find(c => c.name === chapterName);
          if (existingChapter) {
            const existingTopics = new Set(existingChapter.topics || []);
            (chapterData as any).topics.forEach((topic: string) => {
              existingTopics.add(topic);
            });
            existingChapter.topics = Array.from(existingTopics);
          }
        }
      }
      
      // Update subject document
      await Subject.findByIdAndUpdate(subject._id, {
        [`chapters.${classNumber}`]: newChapters
      });
    }
  }
}

// Generate CSV template
function generateCSVTemplate() {
  return {
    headers: [
      'questionText',
      'questionType',
      'options',
      'correctAnswers',
      'classNumber',
      'subject',
      'chapter',
      'topic',
      'subtopic',
      'difficulty',
      'marks',
      'explanation',
      'hint',
      'tags',
      'source',
      'language',
      'questionImageUrl',
      'explanationImageUrl',
      'hintImageUrl',
      'estimatedTime',
      'testTypes'
    ],
    sampleRows: [
      {
        questionText: 'What is the capital of France?',
        questionType: 'single-choice',
        options: 'Paris|London|Berlin|Madrid',
        correctAnswers: '1',
        classNumber: 8,
        subject: 'Geography',
        chapter: 'European Geography',
        topic: 'Capital Cities',
        subtopic: 'Western Europe',
        difficulty: 'easy',
        marks: 1,
        explanation: 'Paris is the capital and largest city of France.',
        hint: 'Think of the city of lights',
        tags: 'europe,capitals,france',
        source: 'Geography Textbook',
        language: 'English',
        questionImageUrl: '',
        explanationImageUrl: '',
        hintImageUrl: '',
        estimatedTime: 30,
        testTypes: 'practice,quiz'
      },
      {
        questionText: 'Which of the following are prime numbers?',
        questionType: 'multiple-choice',
        options: '2|3|4|5|6',
        correctAnswers: '1,2,4',
        classNumber: 7,
        subject: 'Mathematics',
        chapter: 'Number Theory',
        topic: 'Prime Numbers',
        subtopic: '',
        difficulty: 'medium',
        marks: 2,
        explanation: 'Prime numbers are only divisible by 1 and themselves. 2, 3, and 5 are prime numbers.',
        hint: 'Check which numbers have only two factors',
        tags: 'numbers,prime,mathematics',
        source: 'Math Workbook',
        language: 'English',
        questionImageUrl: '',
        explanationImageUrl: '',
        hintImageUrl: '',
        estimatedTime: 60,
        testTypes: 'practice,exam'
      }
    ],
    instructions: {
      questionText: 'The main question text (required)',
      questionType: 'single-choice | multiple-choice | true-false | fill-blank | numerical',
      options: 'Separate options with | (pipe) symbol',
      correctAnswers: 'For single-choice: 1 | For multiple-choice: 1,3,4 (comma-separated option numbers)',
      classNumber: 'Class number between 5-12',
      subject: 'Subject name (must exist in system)',
      chapter: 'Chapter name (required for organization)',
      topic: 'Topic name (required for organization)',
      subtopic: 'Optional subtopic for granular organization',
      difficulty: 'easy | medium | hard (defaults to medium)',
      marks: 'Number between 0.5-20 (defaults to 1)',
      explanation: 'Optional explanation for the correct answer',
      hint: 'Optional hint to help students',
      tags: 'Comma-separated tags for categorization',
      source: 'Optional source reference',
      language: 'Language of the question (defaults to English)',
      questionImageUrl: 'Optional image URL for the question',
      explanationImageUrl: 'Optional image URL for the explanation',
      hintImageUrl: 'Optional image URL for the hint',
      estimatedTime: 'Time in seconds (defaults to 60)',
      testTypes: 'Comma-separated test types: practice,quiz,exam,mock-test,chapter-test'
    }
  };
}

export { uploadSessions };