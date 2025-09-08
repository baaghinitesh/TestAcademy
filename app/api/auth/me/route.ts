import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '../../../../backend/utils/database';
import { User } from '../../../../backend/models';
import { requireAuth } from '../../../../backend/middleware/auth';

async function getMeHandler(request: NextRequest) {
  try {
    // Get user from auth middleware
    const { user } = request as any;

    // Connect to database
    await connectToDatabase();

    // Get fresh user data
    const userData = await User.findById(user.userId).select('-password');
    if (!userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      user: userData
    });

  } catch (error: any) {
    console.error('Get user profile error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

export const GET = requireAuth(getMeHandler);