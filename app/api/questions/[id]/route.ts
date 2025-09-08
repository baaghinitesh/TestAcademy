import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '../../../../backend/utils/database';
import { Question, Test } from '../../../../backend/models';
import { requireAuth, requireAdmin } from '../../../../backend/middleware/auth';
import { validateRequest, createQuestionSchema } from '../../../../backend/utils/validation';

// GET /api/questions/[id] - Get question by ID
async function getQuestionHandler(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase();

    const question = await Question.findById(params.id);
    if (!question) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      question
    });

  } catch (error: any) {
    console.error('Get question error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/questions/[id] - Update question (admin only)
async function updateQuestionHandler(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    
    // Validate request body (make fields optional for update)
    const updateSchema = createQuestionSchema.partial();
    const validation = validateRequest(updateSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const updatedQuestion = await Question.findByIdAndUpdate(
      params.id,
      validation.data,
      { new: true, runValidators: true }
    );

    if (!updatedQuestion) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    // Update test's total marks if marks changed
    if (validation.data!.marks !== undefined) {
      const totalMarks = await Question.aggregate([
        { $match: { test: updatedQuestion.test, isActive: true } },
        { $group: { _id: null, total: { $sum: '$marks' } } }
      ]);

      await Test.findByIdAndUpdate(updatedQuestion.test, {
        totalMarks: totalMarks[0]?.total || 0
      });
    }

    return NextResponse.json({
      message: 'Question updated successfully',
      question: updatedQuestion
    });

  } catch (error: any) {
    console.error('Update question error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/questions/[id] - Delete question (admin only)
async function deleteQuestionHandler(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase();

    const question = await Question.findByIdAndUpdate(
      params.id,
      { isActive: false },
      { new: true }
    );

    if (!question) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    // Update test's total questions and marks
    const questionCount = await Question.countDocuments({ test: question.test, isActive: true });
    const totalMarks = await Question.aggregate([
      { $match: { test: question.test, isActive: true } },
      { $group: { _id: null, total: { $sum: '$marks' } } }
    ]);

    await Test.findByIdAndUpdate(question.test, {
      totalQuestions: questionCount,
      totalMarks: totalMarks[0]?.total || 0
    });

    return NextResponse.json({
      message: 'Question deleted successfully'
    });

  } catch (error: any) {
    console.error('Delete question error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

export const GET = requireAuth(getQuestionHandler);
export const PUT = requireAdmin(updateQuestionHandler);
export const DELETE = requireAdmin(deleteQuestionHandler);