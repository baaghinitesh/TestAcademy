import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '../../../../backend/utils/database';
import { Subject } from '../../../../backend/models';
import { requireAuth, requireAdmin } from '../../../../backend/middleware/auth';
import { validateRequest, createSubjectSchema } from '../../../../backend/utils/validation';

// GET /api/subjects/[id] - Get subject by ID
async function getSubjectHandler(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase();

    const subject = await Subject.findById(params.id);
    if (!subject) {
      return NextResponse.json(
        { error: 'Subject not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      subject
    });

  } catch (error: any) {
    console.error('Get subject error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/subjects/[id] - Update subject (admin only)
async function updateSubjectHandler(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    
    // Validate request body (make fields optional for update)
    const updateSchema = createSubjectSchema.partial();
    const validation = validateRequest(updateSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const updatedSubject = await Subject.findByIdAndUpdate(
      params.id,
      validation.data,
      { new: true, runValidators: true }
    );

    if (!updatedSubject) {
      return NextResponse.json(
        { error: 'Subject not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Subject updated successfully',
      subject: updatedSubject
    });

  } catch (error: any) {
    console.error('Update subject error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/subjects/[id] - Delete subject (admin only)
async function deleteSubjectHandler(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase();

    const deletedSubject = await Subject.findByIdAndUpdate(
      params.id,
      { isActive: false },
      { new: true }
    );

    if (!deletedSubject) {
      return NextResponse.json(
        { error: 'Subject not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Subject deleted successfully'
    });

  } catch (error: any) {
    console.error('Delete subject error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

export const GET = requireAuth(getSubjectHandler);
export const PUT = requireAdmin(updateSubjectHandler);
export const DELETE = requireAdmin(deleteSubjectHandler);