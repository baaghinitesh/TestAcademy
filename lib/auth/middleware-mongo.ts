import { getSession } from '@/lib/auth/session';
import { getUser } from '@/lib/db/queries-mongo';

export async function requireAuth() {
  const session = await getSession();
  
  if (!session) {
    throw new Error('Authentication required');
  }
  
  const user = await getUser();
  
  if (!user) {
    throw new Error('User not found');
  }
  
  return user;
}

export async function requireAdmin() {
  const user = await requireAuth();
  
  if (user.role !== 'admin') {
    throw new Error('Admin access required');
  }
  
  return user;
}

export async function requireStudent() {
  const user = await requireAuth();
  
  if (user.role !== 'student') {
    throw new Error('Student access required');
  }
  
  return user;
}

export function withAuth<T extends any[]>(
  handler: (user: any, ...args: T) => Promise<any>
) {
  return async (...args: T) => {
    try {
      const user = await requireAuth();
      return await handler(user, ...args);
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Authentication failed'
      };
    }
  };
}

export function withAdminAuth<T extends any[]>(
  handler: (user: any, ...args: T) => Promise<any>
) {
  return async (...args: T) => {
    try {
      const user = await requireAdmin();
      return await handler(user, ...args);
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Admin access required'
      };
    }
  };
}

export function withStudentAuth<T extends any[]>(
  handler: (user: any, ...args: T) => Promise<any>
) {
  return async (...args: T) => {
    try {
      const user = await requireStudent();
      return await handler(user, ...args);
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Student access required'
      };
    }
  };
}