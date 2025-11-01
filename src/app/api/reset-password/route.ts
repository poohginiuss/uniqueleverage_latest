import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, initializeDatabase } from '@/lib/mysql';

export async function GET(request: NextRequest) {
  try {
    await initializeDatabase();
    
    // Get parameters from query string
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const token = searchParams.get('token');
    const timestamp = searchParams.get('t');
    
    if (!email || !token || !timestamp) {
      return NextResponse.redirect(new URL('/login?error=invalid-reset-link', request.url));
    }

    // Check if link is expired (30 minutes)
    const linkTimestamp = parseInt(timestamp);
    const currentTime = Date.now();
    const thirtyMinutes = 30 * 60 * 1000;
    
    if (currentTime - linkTimestamp > thirtyMinutes) {
      return NextResponse.redirect(new URL('/login?error=reset-link-expired', request.url));
    }

    // Check if reset token exists and is valid
    const resetToken = `reset_${token}`;
    const rows = await executeQuery(
      'SELECT email, expires FROM verification_tokens WHERE token = ? AND email = ?',
      [resetToken, email]
    );
    
    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.redirect(new URL('/login?error=invalid-reset-token', request.url));
    }

    const tokenData = rows[0] as any;
    
    // Check if token is expired
    if (Date.now() > tokenData.expires) {
      // Clean up expired token
      await executeQuery(
        'DELETE FROM verification_tokens WHERE token = ?',
        [resetToken]
      );
      return NextResponse.redirect(new URL('/login?error=reset-link-expired', request.url));
    }

    // Token is valid, redirect to password setup page with email parameter
    const setupUrl = new URL('/verify-email', request.url);
    setupUrl.searchParams.set('email', email);
    setupUrl.searchParams.set('mode', 'reset');
    setupUrl.searchParams.set('token', token);
    
    return NextResponse.redirect(setupUrl);

  } catch (error) {
    console.error('Password reset verification error:', error);
    return NextResponse.redirect(new URL('/login?error=internal-error', request.url));
  }
}
