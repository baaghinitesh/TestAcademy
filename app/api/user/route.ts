import { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth/session';
import User from '@/backend/models/User';
import { connectDB } from '@/backend/utils/database';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const session = await getSession();
    
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await User.findById(session.userId).select('-password');
    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    return Response.json({ user });
  } catch (error) {
    console.error('Error fetching user:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}