import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import bcryptjs from 'bcryptjs';

const key = new TextEncoder().encode(process.env.AUTH_SECRET || 'your-super-secret-jwt-key-change-in-production-lms-2024');

export type SessionData = {
  userId: string;
  email: string;
  name: string;
  role: 'student' | 'admin';
  class?: number;
  expires: string;
};

export async function signToken(payload: SessionData) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7 days from now')
    .sign(key);
}

export async function verifyToken(input: string) {
  try {
    const { payload } = await jwtVerify(input, key, {
      algorithms: ['HS256'],
    });
    return payload as SessionData;
  } catch (error) {
    return null;
  }
}

export async function getSession(): Promise<SessionData | null> {
  const session = (await cookies()).get('session')?.value;
  if (!session) return null;
  return await verifyToken(session);
}

export async function setSession(user: {
  _id: string;
  name: string;
  email: string;
  role: 'student' | 'admin';
  class?: number;
}) {
  const expiresInSevenDays = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const session: SessionData = {
    userId: user._id,
    email: user.email,
    name: user.name,
    role: user.role,
    class: user.class,
    expires: expiresInSevenDays.toISOString(),
  };
  
  const encryptedSession = await signToken(session);
  (await cookies()).set('session', encryptedSession, {
    expires: expiresInSevenDays,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });
}

export async function clearSession() {
  (await cookies()).delete('session');
}

export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return session !== null && new Date() < new Date(session.expires);
}

export async function isAdmin(): Promise<boolean> {
  const session = await getSession();
  return session?.role === 'admin';
}

export async function isStudent(): Promise<boolean> {
  const session = await getSession();
  return session?.role === 'student';
}

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return await bcryptjs.hash(password, saltRounds);
}

export async function comparePasswords(
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> {
  return await bcryptjs.compare(plainPassword, hashedPassword);
}