import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Get session token from cookies
  const sessionToken = request.cookies.get('session_token')?.value;
  
  let user: any = null;
  
  // Decode session token if it exists
  if (sessionToken) {
    try {
      const decoded = JSON.parse(Buffer.from(sessionToken, 'base64').toString());
      
      // Check if token is expired
      const now = Date.now();
      if (decoded.expires && now <= decoded.expires) {
        user = decoded;
      }
    } catch (e) {
      // Invalid token, treat as not authenticated
      user = null;
    }
  }
  
  // Handle /login page
  if (pathname === '/login') {
    if (user) {
      // User is authenticated, redirect based on role
      if (user.role === 'admin') {
        return NextResponse.redirect(new URL('/admin', request.url));
      } else {
        return NextResponse.redirect(new URL('/docs/introduction', request.url));
      }
    }
    // Not authenticated, allow access to login page
    return NextResponse.next();
  }
  
  // Handle /admin page
  if (pathname.startsWith('/admin')) {
    if (!user) {
      // Not authenticated, redirect to login
      return NextResponse.redirect(new URL('/login', request.url));
    }
    if (user.role !== 'admin') {
      // Authenticated but not admin, redirect to customer area
      return NextResponse.redirect(new URL('/docs/introduction', request.url));
    }
    // Admin user, allow access
    return NextResponse.next();
  }
  
  // All other routes
  return NextResponse.next();
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    '/login',
    '/admin/:path*',
  ],
};

