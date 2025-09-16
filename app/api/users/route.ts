import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '../../../backend/utils/database';
import { User } from '../../../backend/models';
import { requireAuth, requireAdmin } from '../../../backend/middleware/auth';

// GET /api/users - Get all users (admin only)
async function getUsersHandler(request: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search');
    const role = searchParams.get('role');
    const status = searchParams.get('status');

    const query: any = {};
    
    // Build query based on filters
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (role) query.role = role;
    if (status) query.isActive = status === 'active';

    // Get paginated results
    const skip = (page - 1) * limit;
    const users = await User.find(query)
      .select('-password') // Exclude password field
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalUsers = await User.countDocuments(query);
    const totalPages = Math.ceil(totalUsers / limit);

    // Get user statistics
    const stats = {
      total: await User.countDocuments(),
      active: await User.countDocuments({ isActive: true }),
      inactive: await User.countDocuments({ isActive: false }),
      byRole: {
        admin: await User.countDocuments({ role: 'admin' }),
        teacher: await User.countDocuments({ role: 'teacher' }),
        student: await User.countDocuments({ role: 'student' })
      },
      recentSignups: await User.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
      })
    };

    return NextResponse.json({
      success: true,
      users,
      pagination: {
        page,
        limit,
        totalUsers,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
      stats
    });

  } catch (error: any) {
    console.error('Get users error:', error);
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

// POST /api/users - Create new user (admin only)
async function createUserHandler(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, role = 'student', password, isActive = true } = body;
    
    // Basic validation
    if (!name || !email || !password) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Name, email, and password are required' 
        },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { 
          success: false,
          error: 'User with this email already exists' 
        },
        { status: 400 }
      );
    }

    // Create new user
    const newUser = new User({
      name,
      email,
      password, // The User model should hash this
      role,
      isActive
    });

    await newUser.save();

    // Remove password from response
    const userResponse = newUser.toObject();
    delete userResponse.password;

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      user: userResponse
    }, { status: 201 });

  } catch (error: any) {
    console.error('Create user error:', error);
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

export const GET = requireAdmin(getUsersHandler);
export const POST = requireAdmin(createUserHandler);