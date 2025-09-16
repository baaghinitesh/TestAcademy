import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '../../../../backend/utils/database';
import { User } from '../../../../backend/models';
import { requireAuth, requireAdmin } from '../../../../backend/middleware/auth';

// GET /api/users/[id] - Get specific user (admin only)
async function getUserHandler(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase();

    const user = await User.findById(params.id).select('-password');
    
    if (!user) {
      return NextResponse.json(
        { 
          success: false,
          error: 'User not found' 
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user
    });

  } catch (error: any) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error', 
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// PATCH /api/users/[id] - Update user (admin only)
async function updateUserHandler(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const { name, email, role, status, isActive, class: userClass } = body;
    
    await connectToDatabase();

    // Find the user
    const user = await User.findById(params.id);
    
    if (!user) {
      return NextResponse.json(
        { 
          success: false,
          error: 'User not found' 
        },
        { status: 404 }
      );
    }

    // Update fields if provided
    if (name !== undefined) user.name = name;
    if (email !== undefined) {
      // Check if email is already taken by another user
      const existingUser = await User.findOne({ email, _id: { $ne: params.id } });
      if (existingUser) {
        return NextResponse.json(
          { 
            success: false,
            error: 'Email already taken by another user' 
          },
          { status: 400 }
        );
      }
      user.email = email;
    }
    if (role !== undefined) user.role = role;
    if (userClass !== undefined) user.class = userClass;
    
    // Handle status updates
    if (status !== undefined) {
      user.status = status;
      user.isActive = status === 'active';
    } else if (isActive !== undefined) {
      user.isActive = isActive;
      user.status = isActive ? 'active' : 'inactive';
    }

    await user.save();

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    return NextResponse.json({
      success: true,
      message: 'User updated successfully',
      user: userResponse
    });

  } catch (error: any) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error', 
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// DELETE /api/users/[id] - Delete user (admin only)
async function deleteUserHandler(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase();

    const user = await User.findById(params.id);
    
    if (!user) {
      return NextResponse.json(
        { 
          success: false,
          error: 'User not found' 
        },
        { status: 404 }
      );
    }

    // Prevent deleting the last admin
    if (user.role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin', isActive: true });
      if (adminCount <= 1) {
        return NextResponse.json(
          { 
            success: false,
            error: 'Cannot delete the last admin user' 
          },
          { status: 400 }
        );
      }
    }

    await User.findByIdAndDelete(params.id);

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error: any) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error', 
        details: error.message 
      },
      { status: 500 }
    );
  }
}

export const GET = requireAdmin(getUserHandler);
export const PATCH = requireAdmin(updateUserHandler);
export const DELETE = requireAdmin(deleteUserHandler);