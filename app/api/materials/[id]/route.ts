import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '../../../../backend/utils/database';
import { Material } from '../../../../backend/models';
import { requireAuth, requireAdmin } from '../../../../backend/middleware/auth';
import { validateRequest, createMaterialSchema } from '../../../../backend/utils/validation';

// GET /api/materials/[id] - Get material by ID
async function getMaterialHandler(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase();

    const material = await Material.findById(params.id)
      .populate('subject', 'name')
      .populate('uploadedBy', 'name email');

    if (!material) {
      return NextResponse.json(
        { error: 'Material not found' },
        { status: 404 }
      );
    }

    // Increment view count
    await Material.findByIdAndUpdate(params.id, { $inc: { viewCount: 1 } });

    return NextResponse.json({
      material
    });

  } catch (error: any) {
    console.error('Get material error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/materials/[id] - Update material (admin only)
async function updateMaterialHandler(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    
    // Validate request body (make fields optional for update)
    const updateSchema = createMaterialSchema.partial();
    const validation = validateRequest(updateSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const updatedMaterial = await Material.findByIdAndUpdate(
      params.id,
      validation.data,
      { new: true, runValidators: true }
    ).populate(['subject', 'uploadedBy']);

    if (!updatedMaterial) {
      return NextResponse.json(
        { error: 'Material not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Material updated successfully',
      material: updatedMaterial
    });

  } catch (error: any) {
    console.error('Update material error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/materials/[id] - Delete material (admin only)
async function deleteMaterialHandler(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase();

    const deletedMaterial = await Material.findByIdAndUpdate(
      params.id,
      { isActive: false },
      { new: true }
    );

    if (!deletedMaterial) {
      return NextResponse.json(
        { error: 'Material not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Material deleted successfully'
    });

  } catch (error: any) {
    console.error('Delete material error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

export const GET = requireAuth(getMaterialHandler);
export const PUT = requireAdmin(updateMaterialHandler);
export const DELETE = requireAdmin(deleteMaterialHandler);