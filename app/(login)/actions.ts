'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation';
import connectToDatabase from '../../backend/utils/database';
import { User } from '../../backend/models';
import bcrypt from 'bcryptjs';
import { setSession } from '@/lib/auth/session';
import { ActionState } from '@/lib/auth/middleware';

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
});

export async function signIn(prevState: ActionState | null, formData: FormData): Promise<ActionState> {
  const validatedFields = signInSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!validatedFields.success) {
    return {
      success: false,
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { email, password } = validatedFields.data;

  try {
    await connectToDatabase();
    
    const user = await User.findOne({ email }).select('+password');
    
    if (!user || !await bcrypt.compare(password, user.password)) {
      return {
        success: false,
        message: 'Invalid email or password',
      };
    }

    await setSession({
      _id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      class: user.class,
    });

    return { success: true };
  } catch (error) {
    console.error('Sign in error:', error);
    return {
      success: false,
      message: 'An error occurred during sign in',
    };
  }
}