import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { signToken, verifyToken } from '@/lib/auth/session';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get('session');

  let res = NextResponse.next();
  
  // Set pathname header for layout route detection
  res.headers.set('x-pathname', pathname);
  
  // Protect admin routes with role-based access
  if (pathname.startsWith('/admin')) {
    if (!sessionCookie) {
      return NextResponse.redirect(new URL('/sign-in', request.url));
    }
    
    try {
      const session = await verifyToken(sessionCookie.value);
      
      // Check if user has admin role
      if (!session || session.role !== 'admin') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    } catch (error) {
      return NextResponse.redirect(new URL('/sign-in', request.url));
    }
  }
  
  // Protect dashboard routes (requires any authenticated user)
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/test') || pathname.startsWith('/study')) {
    if (!sessionCookie) {
      return NextResponse.redirect(new URL('/sign-in', request.url));
    }
    
    try {
      await verifyToken(sessionCookie.value);
    } catch (error) {
      return NextResponse.redirect(new URL('/sign-in', request.url));
    }
  }

  if (sessionCookie && request.method === 'GET') {
    try {
      const parsed = await verifyToken(sessionCookie.value);
      if (parsed) {
        const expiresInOneDay = new Date(Date.now() + 24 * 60 * 60 * 1000);

        res.cookies.set({
          name: 'session',
          value: await signToken({
            userId: parsed.userId,
            email: parsed.email,
            name: parsed.name,
            role: parsed.role,
            class: parsed.class,
            expires: expiresInOneDay.toISOString()
          }),
          httpOnly: true,
          secure: true,
          sameSite: 'lax',
          expires: expiresInOneDay
        });
      }
    } catch (error) {
      // Error updating session
      res.cookies.delete('session');
    }
  }

  return res;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
  runtime: 'nodejs'
};
