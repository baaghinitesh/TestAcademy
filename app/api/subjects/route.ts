import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '../../../backend/utils/database';
import { Subject } from '../../../backend/models';
import { requireAuth, requireAdmin } from '../../../backend/middleware/auth';
import { validateRequest, createSubjectSchema } from '../../../backend/utils/validation';

// GET /api/subjects - Get all subjects
async function getSubjectsHandler(request: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const classNumber = searchParams.get('class');

    let query: any = { isActive: true };
    
    // Filter by class if provided
    if (classNumber) {
      query.classNumbers = { $in: [parseInt(classNumber)] };
    }

    const subjects = await Subject.find(query).sort({ name: 1 });

    return NextResponse.json({
      subjects
    });

  } catch (error: any) {
    console.error('Get subjects error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/subjects - Create new subject (admin only)
async function createSubjectHandler(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    const validation = validateRequest(createSubjectSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Check if subject already exists
    const existingSubject = await Subject.findOne({ name: validation.data!.name });
    if (existingSubject) {
      return NextResponse.json(
        { error: 'Subject already exists with this name' },
        { status: 409 }
      );
    }

    const newSubject = new Subject(validation.data);
    await newSubject.save();

    return NextResponse.json({
      message: 'Subject created successfully',
      subject: newSubject
    }, { status: 201 });

  } catch (error: any) {
    console.error('Create subject error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

export const GET = requireAuth(getSubjectsHandler);
export const POST = requireAdmin(createSubjectHandler);