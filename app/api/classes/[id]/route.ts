import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '../../../../backend/utils/database';
import { Class } from '../../../../backend/models';
import { requireAuth, requireAdmin } from '../../../../backend/middleware/auth';
import { validateRequest, createClassSchema } from '../../../../backend/utils/validation';

// GET /api/classes/[id] - Get class by ID
async function getClassHandler(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase();

    const classData = await Class.findById(params.id);
    if (!classData) {
      return NextResponse.json(
        { error: 'Class not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      class: classData
    });

  } catch (error: any) {
    console.error('Get class error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/classes/[id] - Update class (admin only)
async function updateClassHandler(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    
    // Validate request body (make fields optional for update)
    const updateSchema = createClassSchema.partial();
    const validation = validateRequest(updateSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const updatedClass = await Class.findByIdAndUpdate(
      params.id,
      validation.data,
      { new: true, runValidators: true }
    );

    if (!updatedClass) {
      return NextResponse.json(
        { error: 'Class not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Class updated successfully',
      class: updatedClass
    });

  } catch (error: any) {
    console.error('Update class error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/classes/[id] - Delete class (admin only)
async function deleteClassHandler(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase();

    const deletedClass = await Class.findByIdAndUpdate(
      params.id,
      { isActive: false },
      { new: true }
    );

    if (!deletedClass) {
      return NextResponse.json(
        { error: 'Class not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Class deleted successfully'
    });

  } catch (error: any) {
    console.error('Delete class error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

export const GET = requireAuth(getClassHandler);
export const PUT = requireAdmin(updateClassHandler);
export const DELETE = requireAdmin(deleteClassHandler);