import { NextRequest, NextResponse } from 'next/server';
import { getSession, SessionData } from '../../lib/auth/session';
import connectToDatabase from '../utils/database';
import { User } from '../models';

export interface AuthRequest extends NextRequest {
  user?: SessionData;
}

export const authenticate = async (request: NextRequest): Promise<{ success: boolean; user?: SessionData; error?: string }> => {
  try {
    const session = await getSession();
    
    if (!session) {
      return { success: false, error: 'No session found' };
    }
    
    // Connect to database and verify user still exists
    await connectToDatabase();
    const user = await User.findById(session.userId);
    
    if (!user) {
      return { success: false, error: 'User not found' };
    }

    return { success: true, user: session };
  } catch (error: any) {
    return { success: false, error: error.message || 'Authentication failed' };
  }
};

export const requireAuth = (handler: Function) => {
  return async (request: NextRequest) => {
    const authResult = await authenticate(request);
    
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: 401 }
      );
    }

    // Add user to request object
    (request as AuthRequest).user = authResult.user;
    
    return handler(request);
  };
};

export const requireRole = (roles: string[]) => {
  return (handler: Function) => {
    return async (request: NextRequest) => {
      const authResult = await authenticate(request);
      
      if (!authResult.success) {
        return NextResponse.json(
          { error: authResult.error },
          { status: 401 }
        );
      }

      if (!roles.includes(authResult.user!.role)) {
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        );
      }

      // Add user to request object
      (request as AuthRequest).user = authResult.user;
      
      return handler(request);
    };
  };
};

export const requireAdmin = (handler: Function) => {
  return requireRole(['admin'])(handler);
};

export const requireStudent = (handler: Function) => {
  return requireRole(['student'])(handler);
};