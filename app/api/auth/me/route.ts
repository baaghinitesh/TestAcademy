import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '../../../../backend/utils/database';
import { User } from '../../../../backend/models';
import { getSession } from '../../../../lib/auth/session';

export async function GET(request: NextRequest) {
  try {
    // Get session from cookie
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Connect to database
    await connectToDatabase();

    // Get fresh user data
    const userData = await User.findById(session.userId).select('-password');
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