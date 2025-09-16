import jwt from 'jsonwebtoken';
import { IUser } from '../models/User';

const JWT_SECRET = process.env.AUTH_SECRET || 'your-super-secret-jwt-key-change-in-production-lms-2024';

export interface JwtPayload {
  userId: string;
  email: string;
  role: 'student' | 'admin';
  name: string;
}

export const generateToken = (user: IUser): string => {
  const payload: JwtPayload = {
    userId: (user._id as any).toString(),
    email: user.email,
    role: user.role,
    name: user.name
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '7d', // Token expires in 7 days
    issuer: 'lms-app',
    audience: 'lms-users'
  });
};

export const verifyToken = (token: string): JwtPayload => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'lms-app',
      audience: 'lms-users'
    }) as JwtPayload;
    
    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

// Alias for backward compatibility
export const verifyJWT = verifyToken;

export const generateRefreshToken = (user: IUser): string => {
  const payload = {
    userId: (user._id as any).toString(),
    email: user.email,
    tokenType: 'refresh'
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '30d', // Refresh token expires in 30 days
    issuer: 'lms-app',
    audience: 'lms-users'
  });
};