import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '../../../backend/utils/database';
import { Attempt, Test, Question, User } from '../../../backend/models';
import { requireAuth, requireStudent } from '../../../backend/middleware/auth';
import { validateRequest, startAttemptSchema } from '../../../backend/utils/validation';

// GET /api/attempts - Get user's attempts
async function getAttemptsHandler(request: NextRequest) {
  try {
    const { user } = request as any;
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const testId = searchParams.get('test');

    const query: any = { student: user.userId };
    if (testId) query.test = testId;

    const attempts = await Attempt.find(query)
      .populate('test', 'title duration totalMarks passingMarks')
      .sort({ createdAt: -1 });

    return NextResponse.json({
      attempts
    });

  } catch (error: any) {
    console.error('Get attempts error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/attempts - Start new attempt
async function startAttemptHandler(request: NextRequest) {
  try {
    const body = await request.json();
    const { user } = request as any;
    
    // Validate request body
    const validation = validateRequest(startAttemptSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const { testId } = validation.data!;

    // Verify test exists and is published
    const test = await Test.findById(testId);
    if (!test) {
      return NextResponse.json(
        { error: 'Test not found' },
        { status: 404 }
      );
    }

    if (!test.isPublished || !test.isActive) {
      return NextResponse.json(
        { error: 'Test is not available for attempts' },
        { status: 400 }
      );
    }

    // Check if test has time restrictions
    const now = new Date();
    if (test.startTime && now < test.startTime) {
      return NextResponse.json(
        { error: 'Test has not started yet' },
        { status: 400 }
      );
    }

    if (test.endTime && now > test.endTime) {
      return NextResponse.json(
        { error: 'Test has ended' },
        { status: 400 }
      );
    }

    // Check existing attempts
    const existingAttempts = await Attempt.countDocuments({
      test: testId,
      student: user.userId
    });

    if (existingAttempts >= test.allowedAttempts) {
      return NextResponse.json(
        { error: 'Maximum allowed attempts reached' },
        { status: 400 }
      );
    }

    // Check for any in-progress attempts
    const inProgressAttempt = await Attempt.findOne({
      test: testId,
      student: user.userId,
      status: 'in-progress'
    });

    if (inProgressAttempt) {
      // Return existing in-progress attempt
      return NextResponse.json({
        message: 'Resuming existing attempt',
        attempt: inProgressAttempt,
        isResume: true
      });
    }

    // Get test questions
    const questions = await Question.find({ test: testId, isActive: true }).sort({ order: 1 });

    if (questions.length === 0) {
      return NextResponse.json(
        { error: 'Test has no questions' },
        { status: 400 }
      );
    }

    // Create new attempt
    const newAttempt = new Attempt({
      test: testId,
      student: user.userId,
      attemptNumber: existingAttempts + 1,
      totalMarks: test.totalMarks,
      startTime: new Date(),
      answers: questions.map(q => ({
        questionId: q._id,
        selectedOptions: [],
        isCorrect: false,
        marksObtained: 0,
        timeSpent: 0
      }))
    });

    await newAttempt.save();

    return NextResponse.json({
      message: 'Attempt started successfully',
      attempt: newAttempt,
      questions: questions.map(q => ({
        _id: q._id,
        question: q.question,
        options: q.options.map((opt: any, idx: number) => ({ text: opt.text, index: idx })),
        questionType: q.questionType,
        marks: q.marks,
        order: q.order
      })),
      isResume: false
    }, { status: 201 });

  } catch (error: any) {
    console.error('Start attempt error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

export const GET = requireAuth(getAttemptsHandler);
export const POST = requireStudent(startAttemptHandler);