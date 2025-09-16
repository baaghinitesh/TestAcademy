export interface ActionState {
  success: boolean;
  message?: string;
  errors?: {
    [key: string]: string[];
  };
}

export interface SessionData {
  userId: string;
  email: string;
  name: string;
  role: 'student' | 'admin';
  class?: number;
  expires: string;
}