'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import connectToDatabase from '@/backend/utils/database';
import User from '@/backend/models/User';
import { signToken } from '@/lib/auth/session';

// Login Schema
const signInSchema = z.object({
  email: z.string().email().min(3).max(255),
  password: z.string().min(8).max(100)
});

// Register Schema  
const signUpSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email().min(3).max(255),
  password: z.string().min(8).max(100),
  role: z.enum(['student', 'admin']).default('student'),
  class: z.number().min(5).max(10).optional()
});

export const signIn = async (prevState: any, formData: FormData) => {
  try {
    const data = {
      email: formData.get('email') as string,
      password: formData.get('password') as string
    };

    const validation = signInSchema.safeParse(data);
    if (!validation.success) {
      return {
        error: 'Invalid email or password format.',
        email: data.email,
        password: data.password
      };
    }

    const { email, password } = validation.data;

    // Connect to database
    await connectToDatabase();

    // Find user by email and include password field
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return {
        error: 'Invalid email or password. Please try again.',
        email,
        password: ''
      };
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      return {
        error: 'Invalid email or password. Please try again.',
        email,
        password: ''
      };
    }

    // Create session
    const sessionData = {
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    };

    const token = await signToken(sessionData);
    
    // Set session cookie
    (await cookies()).set('session', token, {
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    // Redirect based on role
    if (user.role === 'admin') {
      redirect('/admin');
    } else {
      redirect('/dashboard');
    }

  } catch (error) {
    console.error('Sign in error:', error);
    return {
      error: 'An error occurred during sign in. Please try again.',
      email: '',
      password: ''
    };
  }
};

export const signUp = async (prevState: any, formData: FormData) => {
  try {
    const data = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      role: (formData.get('role') as string) || 'student',
      class: formData.get('class') ? parseInt(formData.get('class') as string) : undefined
    };

    const validation = signUpSchema.safeParse(data);
    if (!validation.success) {
      return {
        error: 'Please check your input and try again.',
        ...data
      };
    }

    const { name, email, password, role, class: classNumber } = validation.data;

    // Connect to database
    await connectToDatabase();

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return {
        error: 'User with this email already exists.',
        name,
        email,
        password: '',
        role,
        class: classNumber
      };
    }

    // Create new user
    const userData: any = {
      name,
      email,
      password,
      role
    };

    if (role === 'student' && classNumber) {
      userData.class = classNumber;
      userData.enrolledSubjects = ['Mathematics', 'Science', 'English'];
    }

    const newUser = new User(userData);
    await newUser.save();

    // Create session for new user
    const sessionData = {
      userId: newUser._id.toString(),
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    };

    const token = await signToken(sessionData);
    
    // Set session cookie
    (await cookies()).set('session', token, {
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    // Redirect based on role
    if (newUser.role === 'admin') {
      redirect('/admin');
    } else {
      redirect('/dashboard');
    }

  } catch (error) {
    console.error('Sign up error:', error);
    return {
      error: 'An error occurred during registration. Please try again.',
      name: '',
      email: '',
      password: '',
      role: 'student',
      class: undefined
    };
  }
};

export async function signOut() {
  try {
    (await cookies()).delete('session');
    redirect('/');
  } catch (error) {
    console.error('Sign out error:', error);
  }
}