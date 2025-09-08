import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '../../../backend/utils/database';
import { Class } from '../../../backend/models';
import { requireAuth, requireAdmin } from '../../../backend/middleware/auth';
import { validateRequest, createClassSchema } from '../../../backend/utils/validation';

// GET /api/classes - Get all classes
async function getClassesHandler(request: NextRequest) {
  try {
    await connectToDatabase();

    const classes = await Class.find({ isActive: true }).sort({ number: 1 });

    return NextResponse.json({
      classes
    });

  } catch (error: any) {
    console.error('Get classes error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/classes - Create new class (admin only)
async function createClassHandler(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    const validation = validateRequest(createClassSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Check if class already exists
    const existingClass = await Class.findOne({ number: validation.data!.number });
    if (existingClass) {
      return NextResponse.json(
        { error: 'Class already exists with this number' },
        { status: 409 }
      );
    }

    const newClass = new Class(validation.data);
    await newClass.save();

    return NextResponse.json({
      message: 'Class created successfully',
      class: newClass
    }, { status: 201 });

  } catch (error: any) {
    console.error('Create class error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

export const GET = requireAuth(getClassesHandler);
export const POST = requireAdmin(createClassHandler);