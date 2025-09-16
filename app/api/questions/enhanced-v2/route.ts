import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '../../../../backend/utils/database';
import QuestionEnhanced from '../../../../backend/models/QuestionEnhancedV2';
import Subject from '../../../../backend/models/Subject';
import Test from '../../../../backend/models/Test';
import { auth } from '../../../../lib/auth/middleware-mongo';

// GET /api/questions/enhanced-v2 - Advanced filtering and search
export async function GET(req: NextRequest) {
  try {
    const user = await auth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    
    const { searchParams } = new URL(req.url);
    
    // Enhanced filtering parameters
    const classNumber = searchParams.get('classNumber');
    const subjectId = searchParams.get('subjectId');
    const chapter = searchParams.get('chapter');
    const topic = searchParams.get('topic');
    const subtopic = searchParams.get('subtopic');
    const difficulty = searchParams.get('difficulty');
    const questionType = searchParams.get('questionType');
    const hasImage = searchParams.get('hasImage');
    const hasExplanation = searchParams.get('hasExplanation');
    const isVerified = searchParams.get('isVerified');
    const batchId = searchParams.get('batchId');
    const tags = searchParams.get('tags');
    const search = searchParams.get('search');
    const source = searchParams.get('source');
    const language = searchParams.get('language');
    const testType = searchParams.get('testType');
    
    // Pagination and sorting
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1;
    
    // Build query
    const query: any = { isActive: true };
    
    if (classNumber) query.classNumber = parseInt(classNumber);
    if (subjectId) query.subject = subjectId;
    if (chapter) query.chapter = new RegExp(chapter, 'i');
    if (topic) query.topic = new RegExp(topic, 'i');
    if (subtopic) query.subtopic = new RegExp(subtopic, 'i');
    if (difficulty) query.difficulty = difficulty;
    if (questionType) query.questionType = questionType;
    if (hasImage) query.hasImage = hasImage === 'true';
    if (hasExplanation) query.hasExplanation = hasExplanation === 'true';
    if (isVerified) query.isVerified = isVerified === 'true';
    if (batchId) query.batchId = batchId;
    if (source) query.source = new RegExp(source, 'i');
    if (language) query.language = language;
    if (testType) query.testTypes = testType;
    
    // Tag filtering
    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      query.tags = { $in: tagArray };
    }
    
    // Text search
    if (search) {
      query.$or = [
        { question: new RegExp(search, 'i') },
        { tags: new RegExp(search, 'i') },
        { chapter: new RegExp(search, 'i') },
        { topic: new RegExp(search, 'i') },
        { explanation: new RegExp(search, 'i') }
      ];
    }
    
    // Admin-only filters
    if (user.role === 'admin') {
      const includeInactive = searchParams.get('includeInactive') === 'true';
      if (includeInactive) {
        delete query.isActive;
      }
    } else {
      // Students can only see verified questions
      query.isVerified = true;
    }
    
    // Execute query with population
    const questions = await QuestionEnhanced
      .find(query)
      .populate('subject', 'name code')
      .populate('test', 'title')
      .populate('createdBy', 'name email')
      .populate('verifiedBy', 'name')
      .sort({ [sortBy]: sortOrder })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();
    
    // Get total count
    const total = await QuestionEnhanced.countDocuments(query);
    
    // Get hierarchy statistics
    const hierarchyStats = await QuestionEnhanced.aggregate([
      { $match: query },
      {
        $group: {
          _id: {
            classNumber: '$classNumber',
            subject: '$subject',
            chapter: '$chapter',
            topic: '$topic'
          },
          count: { $sum: 1 },
          avgMarks: { $avg: '$marks' },
          difficulties: { $addToSet: '$difficulty' }
        }
      },
      {
        $group: {
          _id: {
            classNumber: '$_id.classNumber',
            subject: '$_id.subject',
            chapter: '$_id.chapter'
          },
          topics: {
            $push: {
              topic: '$_id.topic',
              count: '$count',
              avgMarks: '$avgMarks',
              difficulties: '$difficulties'
            }
          },
          totalInChapter: { $sum: '$count' }
        }
      },
      {
        $group: {
          _id: {
            classNumber: '$_id.classNumber',
            subject: '$_id.subject'
          },
          chapters: {
            $push: {
              chapter: '$_id.chapter',
              topics: '$topics',
              count: '$totalInChapter'
            }
          },
          totalInSubject: { $sum: '$totalInChapter' }
        }
      }
    ]);
    
    return NextResponse.json({
      success: true,
      data: {
        questions,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        },
        hierarchyStats,
        filters: {
          classNumber,
          subjectId,
          chapter,
          topic,
          difficulty,
          questionType,
          search
        }
      }
    });
    
  } catch (error: any) {
    console.error('Enhanced questions fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch questions', details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/questions/enhanced-v2 - Create new question with enhanced validation
export async function POST(req: NextRequest) {
  try {
    const user = await auth(req);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    
    const body = await req.json();
    const {
      question,
      questionType,
      options,
      classNumber,
      subject,
      chapter,
      topic,
      subtopic,
      difficulty,
      marks,
      explanation,
      hint,
      questionImageUrl,
      explanationImageUrl,
      hintImageUrl,
      tags,
      source,
      language,
      testTypes,
      estimatedTime
    } = body;
    
    // Validation
    if (!question || !questionType || !options || !classNumber || !subject || !chapter || !topic) {
      return NextResponse.json({
        error: 'Missing required fields: question, questionType, options, classNumber, subject, chapter, topic'
      }, { status: 400 });
    }
    
    // Validate subject exists
    const subjectDoc = await Subject.findById(subject);
    if (!subjectDoc) {
      return NextResponse.json({ error: 'Subject not found' }, { status: 404 });
    }
    
    // Validate options based on question type
    const correctOptions = options.filter((opt: any) => opt.isCorrect);
    
    if (questionType === 'single-choice' && correctOptions.length !== 1) {
      return NextResponse.json({
        error: 'Single-choice questions must have exactly one correct answer'
      }, { status: 400 });
    }
    
    if (questionType === 'multiple-choice' && correctOptions.length < 1) {
      return NextResponse.json({
        error: 'Multiple-choice questions must have at least one correct answer'
      }, { status: 400 });
    }
    
    if (questionType === 'true-false' && (options.length !== 2 || correctOptions.length !== 1)) {
      return NextResponse.json({
        error: 'True/false questions must have exactly 2 options with 1 correct answer'
      }, { status: 400 });
    }
    
    // Create question
    const questionData = new QuestionEnhanced({
      question,
      questionType,
      options: options.map((opt: any, index: number) => ({
        ...opt,
        order: index + 1
      })),
      classNumber: parseInt(classNumber),
      subject,
      chapter,
      topic,
      subtopic,
      difficulty: difficulty || 'medium',
      marks: parseFloat(marks) || 1,
      explanation,
      hint,
      questionImageUrl,
      explanationImageUrl,
      hintImageUrl,
      tags: Array.isArray(tags) ? tags : [],
      source,
      language: language || 'English',
      testTypes: Array.isArray(testTypes) ? testTypes : ['practice', 'quiz'],
      estimatedTime: parseInt(estimatedTime) || 60,
      createdBy: user.id,
      importSource: 'Manual'
    });
    
    await questionData.save();
    
    // Populate for response
    await questionData.populate('subject', 'name code');
    await questionData.populate('createdBy', 'name email');
    
    return NextResponse.json({
      success: true,
      data: questionData,
      message: 'Question created successfully'
    });
    
  } catch (error: any) {
    console.error('Question creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create question', details: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/questions/enhanced-v2 - Bulk operations
export async function PUT(req: NextRequest) {
  try {
    const user = await auth(req);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    
    const body = await req.json();
    const { operation, questionIds, updates } = body;
    
    if (!operation || !questionIds || !Array.isArray(questionIds)) {
      return NextResponse.json({
        error: 'Missing required fields: operation, questionIds'
      }, { status: 400 });
    }
    
    let result;
    
    switch (operation) {
      case 'activate':
        result = await QuestionEnhanced.updateMany(
          { _id: { $in: questionIds } },
          { isActive: true, updatedAt: new Date() }
        );
        break;
        
      case 'deactivate':
        result = await QuestionEnhanced.updateMany(
          { _id: { $in: questionIds } },
          { isActive: false, updatedAt: new Date() }
        );
        break;
        
      case 'verify':
        result = await QuestionEnhanced.updateMany(
          { _id: { $in: questionIds } },
          { 
            isVerified: true, 
            verifiedBy: user.id, 
            verifiedAt: new Date(),
            updatedAt: new Date()
          }
        );
        break;
        
      case 'unverify':
        result = await QuestionEnhanced.updateMany(
          { _id: { $in: questionIds } },
          { 
            isVerified: false, 
            verifiedBy: null, 
            verifiedAt: null,
            updatedAt: new Date()
          }
        );
        break;
        
      case 'update':
        if (!updates) {
          return NextResponse.json({
            error: 'Updates object is required for update operation'
          }, { status: 400 });
        }
        result = await QuestionEnhanced.updateMany(
          { _id: { $in: questionIds } },
          { ...updates, updatedAt: new Date() }
        );
        break;
        
      case 'delete':
        result = await QuestionEnhanced.deleteMany(
          { _id: { $in: questionIds } }
        );
        break;
        
      default:
        return NextResponse.json({
          error: 'Invalid operation. Supported: activate, deactivate, verify, unverify, update, delete'
        }, { status: 400 });
    }
    
    return NextResponse.json({
      success: true,
      data: {
        operation,
        affectedCount: result.modifiedCount || result.deletedCount,
        matchedCount: result.matchedCount
      },
      message: `Bulk ${operation} completed successfully`
    });
    
  } catch (error: any) {
    console.error('Bulk operation error:', error);
    return NextResponse.json(
      { error: 'Failed to perform bulk operation', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/questions/enhanced-v2 - Delete question
export async function DELETE(req: NextRequest) {
  try {
    const user = await auth(req);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    
    const { searchParams } = new URL(req.url);
    const questionId = searchParams.get('id');
    
    if (!questionId) {
      return NextResponse.json({
        error: 'Question ID is required'
      }, { status: 400 });
    }
    
    const question = await QuestionEnhanced.findByIdAndDelete(questionId);
    
    if (!question) {
      return NextResponse.json({
        error: 'Question not found'
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Question deleted successfully'
    });
    
  } catch (error: any) {
    console.error('Question deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete question', details: error.message },
      { status: 500 }
    );
  }
}