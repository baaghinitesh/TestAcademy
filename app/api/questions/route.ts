import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '../../../backend/utils/database';
import { Question, Test } from '../../../backend/models';
import { requireAuth, requireAdmin } from '../../../backend/middleware/auth';
import { validateRequest, createQuestionSchema } from '../../../backend/utils/validation';

// GET /api/questions - Get questions by test
async function getQuestionsHandler(request: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const testId = searchParams.get('test');

    if (!testId) {
      return NextResponse.json(
        { error: 'Test ID is required' },
        { status: 400 }
      );
    }

    const questions = await Question.find({ test: testId, isActive: true }).sort({ order: 1 });

    return NextResponse.json({
      questions
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