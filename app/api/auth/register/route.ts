import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '../../../../backend/utils/database';
import { User } from '../../../../backend/models';
import { generateToken } from '../../../../backend/utils/jwt';
import { validateRequest, registerSchema } from '../../../../backend/utils/validation';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    const validation = validateRequest(registerSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      );
    }

    const { name, email, password, role, class: userClass, enrolledSubjects } = validation.data!;

    // Connect to database
    await connectToDatabase();

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists with this email' },
        { status: 409 }
      );
    }

    // For students, class is required
    if (role === 'student' && !userClass) {
      return NextResponse.json(
        { error: 'Class is required for students' },
        { status: 400 }
      );
    }

    // Create new user
    const userData: any = {
      name,
      email: email.toLowerCase(),
      password,
      role
    };

    if (role === 'student') {
      userData.class = userClass;
      userData.enrolledSubjects = enrolledSubjects || [];
    }

    const user = new User(userData);
    await user.save();

    // Generate JWT token
    const token = generateToken(user);

    // Return user data without password
    const { password: _, ...userWithoutPassword } = user.toObject();

    return NextResponse.json({
      message: 'User registered successfully',
      user: userWithoutPassword,
      token
    }, { status: 201 });

  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}