import { NextRequest } from 'next/server';
import { verifyJWT } from '@/backend/utils/jwt';
import User from '@/backend/models/User';
import { connectDB } from '@/backend/utils/database';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const token = request.cookies.get('session')?.value;
    
    if (!token) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyJWT(token);
    if (!decoded) {
      return Response.json({ error: 'Invalid token' }, { status: 401 });
    }

    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    return Response.json({ user });
  } catch (error) {
    console.error('Error fetching user:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}