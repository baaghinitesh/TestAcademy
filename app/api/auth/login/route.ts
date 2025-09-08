import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '../../../../backend/utils/database';
import { User } from '../../../../backend/models';
import { setSession } from '../../../../lib/auth/session';
import { validateRequest, loginSchema } from '../../../../backend/utils/validation';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    const validation = validateRequest(loginSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      );
    }

    const { email, password } = validation.data!;

    // Connect to database
    await connectToDatabase();

    // Find user with password field included
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Check password
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Set session cookie
    await setSession({
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      class: user.class
    });

    // Return user data without password
    const { password: _, ...userWithoutPassword } = user.toObject();

    return NextResponse.json({
      message: 'Login successful',
      user: userWithoutPassword
    });

  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}