import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '../../../../backend/utils/database';
import { Test, Question } from '../../../../backend/models';
import { requireAuth, requireAdmin } from '../../../../backend/middleware/auth';
import { validateRequest, createTestSchema, updateTestSchema } from '../../../../backend/utils/validation';

// GET /api/tests/[id] - Get test by ID
async function getTestHandler(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase();

    const test = await Test.findById(params.id)
      .populate('subject', 'name')
      .populate('createdBy', 'name email');

    if (!test) {
      return NextResponse.json(
        { error: 'Test not found' },
        { status: 404 }
      );
    }

    // Get questions for this test
    const questions = await Question.find({ test: test._id, isActive: true }).sort({ order: 1 });

    return NextResponse.json({
      test,
      questions
    });

  } catch (error: any) {
    console.error('Get test error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/tests/[id] - Update test (admin only)
async function updateTestHandler(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    
    // Validate request body (make fields optional for update)
    const validation = validateRequest(updateTestSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const updatedTest = await Test.findByIdAndUpdate(
      params.id,
      validation.data as any,
      { new: true, runValidators: true }
    ).populate(['subject', 'createdBy']);

    if (!updatedTest) {
      return NextResponse.json(
        { error: 'Test not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Test updated successfully',
      test: updatedTest
    });

  } catch (error: any) {
    console.error('Update test error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/tests/[id] - Delete test (admin only)
async function deleteTestHandler(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase();

    // Also deactivate all questions for this test
    await Question.updateMany(
      { test: params.id },
      { isActive: false }
    );

    const deletedTest = await Test.findByIdAndUpdate(
      params.id,
      { isActive: false },
      { new: true }
    );

    if (!deletedTest) {
      return NextResponse.json(
        { error: 'Test not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Test deleted successfully'
    });

  } catch (error: any) {
    console.error('Delete test error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

export const GET = requireAuth(getTestHandler);
export const PUT = requireAdmin(updateTestHandler);
export const DELETE = requireAdmin(deleteTestHandler);