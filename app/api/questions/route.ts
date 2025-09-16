import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '../../../backend/utils/database';
import { Question, Test } from '../../../backend/models';
import { requireAuth, requireAdmin } from '../../../backend/middleware/auth';
import { validateRequest, createQuestionSchema } from '../../../backend/utils/validation';

// GET /api/questions - Get questions with enhanced filtering
async function getQuestionsHandler(request: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const testId = searchParams.get('test');
    const subjectId = searchParams.get('subject');
    const classNumber = searchParams.get('classNumber');
    const chapter = searchParams.get('chapter');
    const topic = searchParams.get('topic');
    const difficulty = searchParams.get('difficulty');
    const tags = searchParams.get('tags');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    let query: any = { isActive: true };
    
    // Build query based on filters
    if (testId) query.test = testId;
    if (subjectId) query.subject = subjectId;
    if (classNumber) query.classNumber = parseInt(classNumber);
    if (chapter) query.chapter = chapter;
    if (topic) query.topic = topic;
    if (difficulty) query.difficulty = difficulty;
    if (tags) query.tags = { $in: tags.split(',') };
    if (search) {
      query.$or = [
        { question: { $regex: search, $options: 'i' } },
        { explanation: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } }
      ];
    }

    // Get paginated results with populated references
    const skip = (page - 1) * limit;
    const questions = await Question.find(query)
      .populate('subject', 'name')
      .populate('test', 'title')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1, order: 1 })
      .skip(skip)
      .limit(limit);

    const totalQuestions = await Question.countDocuments(query);
    const totalPages = Math.ceil(totalQuestions / limit);

    return NextResponse.json({
      questions,
      pagination: {
        page,
        limit,
        totalQuestions,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });

  } catch (error: any) {
    console.error('Get questions error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/questions - Create new question (admin only)
async function createQuestionHandler(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    const validation = validateRequest(createQuestionSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Verify test exists
    const test = await Test.findById(validation.data!.test);
    if (!test) {
      return NextResponse.json(
        { error: 'Test not found' },
        { status: 404 }
      );
    }

    const newQuestion = new Question(validation.data);
    await newQuestion.save();

    // Update test's total questions and marks
    const questionCount = await Question.countDocuments({ test: test._id, isActive: true });
    const totalMarks = await Question.aggregate([
      { $match: { test: test._id, isActive: true } },
      { $group: { _id: null, total: { $sum: '$marks' } } }
    ]);

    await Test.findByIdAndUpdate(test._id, {
      totalQuestions: questionCount,
      totalMarks: totalMarks[0]?.total || 0
    });

    return NextResponse.json({
      message: 'Question created successfully',
      question: newQuestion
    }, { status: 201 });

  } catch (error: any) {
    console.error('Create question error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

export const GET = requireAuth(getQuestionsHandler);
export const POST = requireAdmin(createQuestionHandler);