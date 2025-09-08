import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '../../../backend/utils/database';
import { Test, Question } from '../../../backend/models';
import { requireAuth, requireAdmin } from '../../../backend/middleware/auth';
import { validateRequest, createTestSchema } from '../../../backend/utils/validation';

// GET /api/tests - Get all tests
async function getTestsHandler(request: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const subject = searchParams.get('subject');
    const classNumber = searchParams.get('class');
    const isPublished = searchParams.get('published');

    let query: any = { isActive: true };
    
    // Build query filters
    if (subject) query.subject = subject;
    if (classNumber) query.classNumber = parseInt(classNumber);
    if (isPublished) query.isPublished = isPublished === 'true';

    const tests = await Test.find(query)
      .populate('subject', 'name')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    // Add question count for each test
    const testsWithQuestionCount = await Promise.all(
      tests.map(async (test) => {
        const questionCount = await Question.countDocuments({ test: test._id, isActive: true });
        return {
          ...test.toObject(),
          actualQuestionCount: questionCount
        };
      })
    );

    return NextResponse.json({
      tests: testsWithQuestionCount
    });

  } catch (error: any) {
    console.error('Get tests error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/tests - Create new test (admin only)
async function createTestHandler(request: NextRequest) {
  try {
    const body = await request.json();
    const { user } = request as any;
    
    // Validate request body
    const validation = validateRequest(createTestSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Add creator info
    const testData = {
      ...validation.data!,
      createdBy: user.userId,
      totalQuestions: 0 // Will be updated when questions are added
    };

    const newTest = new Test(testData);
    await newTest.save();

    // Populate referenced fields
    await newTest.populate(['subject', 'createdBy']);

    return NextResponse.json({
      message: 'Test created successfully',
      test: newTest
    }, { status: 201 });

  } catch (error: any) {
    console.error('Create test error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

export const GET = requireAuth(getTestsHandler);
export const POST = requireAdmin(createTestHandler);