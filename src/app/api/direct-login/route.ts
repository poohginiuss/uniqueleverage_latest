import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, initializeDatabase } from '@/lib/mysql';
import { createFastSessionToken } from '@/lib/fast-auth';

export async function GET(request: NextRequest) {
  try {
    await initializeDatabase();
    
    // Get email and timestamp from query parameters
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const timestamp = searchParams.get('t');
    
    if (!email || !timestamp) {
      return NextResponse.redirect(new URL('/login?error=invalid-link', request.url));
    }

    // Check if link is expired (30 minutes = 30 * 60 * 1000 milliseconds)
    const linkTimestamp = parseInt(timestamp);
    const currentTime = Date.now();
    const thirtyMinutes = 30 * 60 * 1000;
    
    if (currentTime - linkTimestamp > thirtyMinutes) {
      return NextResponse.redirect(new URL('/login?error=link-expired', request.url));
    }

    // Find user by email
    const users = await executeQuery(
      'SELECT id, email, first_name, last_name, name, username, role FROM users WHERE email = ?',
      [email]
    );
    
    if (!Array.isArray(users) || users.length === 0) {
      return NextResponse.redirect(new URL('/login?error=user-not-found', request.url));
    }

    const user = users[0] as any;

    // Generate fast session token
    const sessionToken = createFastSessionToken(user);
    
    // Store session in database
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);
    
    try {
      await executeQuery(
        'INSERT INTO user_sessions (user_id, session_token, expires_at) VALUES (?, ?, ?)',
        [user.id, sessionToken, expiresAt]
      );
    } catch (dbError) {
      console.warn('Failed to store session in database:', dbError);
    }

    // Update last login
    await executeQuery(
      'UPDATE users SET last_login_at = NOW() WHERE email = ?',
      [user.email]
    );

    // Determine redirect URL based on user role
    let redirectUrl = '/docs/introduction'; // Default for customers
    if (user.role === 'admin') {
      redirectUrl = '/admin';
    }

    // Create redirect response with localStorage data in URL params
    // This will be handled by a client-side script
    const redirectUrlWithAuth = new URL(redirectUrl, request.url);
    redirectUrlWithAuth.searchParams.set('auth', 'success');
    redirectUrlWithAuth.searchParams.set('email', user.email);
    redirectUrlWithAuth.searchParams.set('role', user.role);
    redirectUrlWithAuth.searchParams.set('firstName', user.first_name || '');
    
    const response = NextResponse.redirect(redirectUrlWithAuth);

    // Set HTTP-only cookie
    response.cookies.set('session_token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 hours in seconds
      path: '/'
    });

    return response;

  } catch (error) {
    console.error('Direct login error:', error);
    return NextResponse.redirect(new URL('/login?error=internal-error', request.url));
  }
}
