import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '../../../backend/utils/database';
import { Material } from '../../../backend/models';
import { requireAuth, requireAdmin } from '../../../backend/middleware/auth';
import { validateRequest, createMaterialSchema } from '../../../backend/utils/validation';

// GET /api/materials - Get all materials
async function getMaterialsHandler(request: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const subject = searchParams.get('subject');
    const classNumber = searchParams.get('class');
    const type = searchParams.get('type');

    const query: any = { isActive: true };
    
    // Build query filters
    if (subject) query.subject = subject;
    if (classNumber) query.classNumber = parseInt(classNumber);
    if (type) query.type = type;

    const materials = await Material.find(query)
      .populate('subject', 'name')
      .populate('uploadedBy', 'name email')
      .sort({ createdAt: -1 });

    return NextResponse.json({
      materials
    });

  } catch (error: any) {
    console.error('Get materials error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/materials - Create new material (admin only)
async function createMaterialHandler(request: NextRequest) {
  try {
    const body = await request.json();
    const { user } = request as any;
    
    // Validate request body
    const validation = validateRequest(createMaterialSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Add upload info
    const materialData = {
      ...validation.data!,
      uploadedBy: user.userId
    };

    const newMaterial = new Material(materialData);
    await newMaterial.save();

    // Populate referenced fields
    await newMaterial.populate(['subject', 'uploadedBy']);

    return NextResponse.json({
      message: 'Material created successfully',
      material: newMaterial
    }, { status: 201 });

  } catch (error: any) {
    console.error('Create material error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

export const GET = requireAuth(getMaterialsHandler);
export const POST = requireAdmin(createMaterialHandler);