import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, JwtPayload } from '../utils/jwt';
import connectToDatabase from '../utils/database';
import { User } from '../models';

export interface AuthRequest extends NextRequest {
  user?: JwtPayload;
}

export const authenticate = async (request: NextRequest): Promise<{ success: boolean; user?: JwtPayload; error?: string }> => {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { success: false, error: 'No token provided' };
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    if (!token) {
      return { success: false, error: 'No token provided' };
    }

    // Verify the token
    const decoded = verifyToken(token);
    
    // Connect to database and verify user still exists
    await connectToDatabase();
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return { success: false, error: 'User not found' };
    }

    return { success: true, user: decoded };
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