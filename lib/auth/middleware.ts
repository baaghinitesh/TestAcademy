// Middleware types for auth context
export interface ActionState {
  success: boolean;
  error?: string;
  user?: {
    id: string;
    email: string;
    name: string;
    role: 'admin' | 'student';
    class?: number;
  };
}

export interface SessionData {
  userId: string;
  email: string;
  name: string;
  role: 'admin' | 'student';
  class?: number;
  expires: string;
}