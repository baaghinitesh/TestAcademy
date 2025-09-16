import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '../../../../backend/utils/database';
import QuestionEnhanced from '../../../../backend/models/QuestionEnhanced';
import { auth } from '../../../../lib/auth/middleware-mongo';
import * as csv from 'csv-parser';
import { Readable } from 'stream';

interface ChunkUploadSession {
  sessionId: string;
  totalChunks: number;
  uploadedChunks: number;
  results: {
    successful: number;
    failed: number;
    errors: any[];
  };
  batchId: string;
  createdAt: Date;
}

// In-memory storage for upload sessions (in production, use Redis or database)
const uploadSessions = new Map<string, ChunkUploadSession>();

// POST /api/questions/bulk-upload-enhanced - Enhanced bulk upload with chunking
export async function POST(req: NextRequest) {
  try {
    const user = await auth(req);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const chunkIndex = parseInt(formData.get('chunkIndex') as string || '0');
    const totalChunks = parseInt(formData.get('totalChunks') as string || '1');
    const sessionId = formData.get('sessionId') as string || generateSessionId();
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    
    // Initialize or get existing session
    let session = uploadSessions.get(sessionId);
    if (!session) {
      session = {
        sessionId,
        totalChunks,
        uploadedChunks: 0,
        results: {
          successful: 0,
          failed: 0,
          errors: []
        },
        batchId: `batch_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        createdAt: new Date()
      };
      uploadSessions.set(sessionId, session);
    }
    
    // Process the current chunk
    const chunkResult = await processCSVChunk(file, session.batchId, user.id);
    
    // Update session results
    session.results.successful += chunkResult.successful;
    session.results.failed += chunkResult.failed;
    session.results.errors = session.results.errors.concat(chunkResult.errors);
    session.uploadedChunks++;
    
    // Check if all chunks are uploaded
    const isComplete = session.uploadedChunks >= session.totalChunks;
    
    if (isComplete) {
      // Final processing and cleanup
      const finalResult = {
        sessionId,
        batchId: session.batchId,
        isComplete: true,
        totalProcessed: session.results.successful + session.results.failed,
        successful: session.results.successful,
        failed: session.results.failed,
        errors: session.results.errors,
        processingTime: Date.now() - session.createdAt.getTime()
      };
      
      // Clean up session after 1 hour (or move to persistent storage)
      setTimeout(() => uploadSessions.delete(sessionId), 3600000);
      
      return NextResponse.json({
        success: true,
        ...finalResult,
        message: `Bulk upload complete. ${finalResult.successful} questions created, ${finalResult.failed} failed.`
      });
    } else {
      return NextResponse.json({
        success: true,
        sessionId,
        isComplete: false,
        progress: {
          uploadedChunks: session.uploadedChunks,
          totalChunks: session.totalChunks,
          percentage: Math.round((session.uploadedChunks / session.totalChunks) * 100)
        },
        partialResults: {
          successful: session.results.successful,
          failed: session.results.failed
        }
      });
    }
    
  } catch (error: any) {
    console.error('Bulk upload error:', error);
    return NextResponse.json(
      { error: 'Failed to process bulk upload', details: error.message },
      { status: 500 }
    );
  }
}

// GET /api/questions/bulk-upload-enhanced - Get upload session status
export async function GET(req: NextRequest) {
  try {
    const user = await auth(req);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');
    
    if (!sessionId) {
      // Return all active sessions for the user
      const activeSessions = Array.from(uploadSessions.values())
        .filter(session => Date.now() - session.createdAt.getTime() < 3600000); // Within 1 hour
      
      return NextResponse.json({
        success: true,
        activeSessions: activeSessions.map(session => ({
          sessionId: session.sessionId,
          progress: {
            uploadedChunks: session.uploadedChunks,
            totalChunks: session.totalChunks,
            percentage: Math.round((session.uploadedChunks / session.totalChunks) * 100)
          },
          results: session.results,
          createdAt: session.createdAt
        }))
      });
    }
    
    const session = uploadSessions.get(sessionId);
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      session: {
        sessionId: session.sessionId,
        batchId: session.batchId,
        isComplete: session.uploadedChunks >= session.totalChunks,
        progress: {
          uploadedChunks: session.uploadedChunks,
          totalChunks: session.totalChunks,
          percentage: Math.round((session.uploadedChunks / session.totalChunks) * 100)
        },
        results: session.results,
        createdAt: session.createdAt
      }
    });
    
  } catch (error: any) {
    console.error('Session status error:', error);
    return NextResponse.json(
      { error: 'Failed to get session status', details: error.message },
      { status: 500 }
    );
  }
}

// Helper function to process CSV chunk
async function processCSVChunk(file: File, batchId: string, userId: string) {
  return new Promise<{ successful: number; failed: number; errors: any[] }>((resolve, reject) => {
    const results = {
      successful: 0,
      failed: 0,
      errors: [] as any[]
    };
    
    const questions: any[] = [];
    
    const readable = Readable.from(file.stream() as any);
    
    readable
      .pipe(csv())
      .on('data', (row: any) => {
        try {
          // Parse CSV row into question format
          const questionData = parseCSVRowToQuestion(row, batchId, userId);
          questions.push(questionData);
        } catch (error: any) {
          results.failed++;
          results.errors.push({
            row: row,
            error: error.message
          });
        }
      })
      .on('end', async () => {
        try {
          // Batch insert with validation
          const insertResult = await QuestionEnhanced.bulkCreateWithValidation(questions, batchId);
          
          results.successful += insertResult.created;
          results.failed += insertResult.errors.length;
          results.errors = results.errors.concat(insertResult.errors);
          
          resolve(results);
        } catch (error: any) {
          reject(error);
        }
      })
      .on('error', (error: any) => {
        reject(error);
      });
  });
}

// Helper function to parse CSV row to question format
function parseCSVRowToQuestion(row: any, batchId: string, userId: string) {
  // Parse options from CSV columns
  const options = [];
  const maxOptions = 8;
  
  for (let i = 1; i <= maxOptions; i++) {
    const optionText = row[`option_${i}`];
    if (optionText && optionText.trim()) {
      options.push({
        text: optionText.trim(),
        isCorrect: row[`option_${i}_correct`] === 'true' || row[`option_${i}_correct`] === '1',
        imageUrl: row[`option_${i}_image`] || '',
        explanation: row[`option_${i}_explanation`] || ''
      });
    }
  }
  
  if (options.length < 2) {
    throw new Error('Question must have at least 2 options');
  }
  
  // Parse tags
  const tags = row.tags ? row.tags.split(',').map((tag: string) => tag.trim()) : [];
  
  return {
    question: row.question?.trim() || '',
    questionType: row.question_type || 'single-choice',
    options,
    explanation: row.explanation || '',
    hint: row.hint || '',
    marks: parseFloat(row.marks || '1'),
    subject: row.subject_id || '',
    classNumber: parseInt(row.class_number || '5'),
    chapter: row.chapter || '',
    topic: row.topic || '',
    subtopic: row.subtopic || '',
    difficulty: row.difficulty || 'medium',
    questionImageUrl: row.question_image || '',
    explanationImageUrl: row.explanation_image || '',
    hintImageUrl: row.hint_image || '',
    tags,
    source: row.source || '',
    yearCreated: parseInt(row.year_created || new Date().getFullYear().toString()),
    language: row.language || 'en',
    estimatedTime: parseInt(row.estimated_time || '60'),
    batchId,
    importSource: 'csv',
    createdBy: userId
  };
}

// Helper function to generate session ID
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 12)}`;
}

// CSV Template endpoint for enhanced format
export async function OPTIONS(req: NextRequest) {
  const csvTemplate = `question,question_type,option_1,option_1_correct,option_1_image,option_1_explanation,option_2,option_2_correct,option_2_image,option_2_explanation,option_3,option_3_correct,option_3_image,option_3_explanation,option_4,option_4_correct,option_4_image,option_4_explanation,explanation,hint,marks,subject_id,class_number,chapter,topic,subtopic,difficulty,question_image,explanation_image,hint_image,tags,source,year_created,language,estimated_time
"What is 2 + 2?",single-choice,"3",false,"","","4",true,"","","5",false,"","","6",false,"","","The sum of 2 + 2 equals 4","Remember addition basics",1,subject_id_here,5,"Arithmetic","Addition","Basic Addition",easy,"","","","math,addition,basic",2024,en,30
"Which of the following are prime numbers?",multiple-choice,"2",true,"","Prime number divisible only by 1 and itself","3",true,"","Prime number divisible only by 1 and itself","4",false,"","Divisible by 2","5",true,"","Prime number divisible only by 1 and itself","Prime numbers are numbers divisible only by 1 and themselves","Look for numbers with exactly two factors",2,subject_id_here,6,"Number Theory","Prime Numbers","Prime Identification",medium,"","","","math,prime,numbers",2024,en,45`;
  
  return new NextResponse(csvTemplate, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="question_template_enhanced.csv"'
    }
  });
}