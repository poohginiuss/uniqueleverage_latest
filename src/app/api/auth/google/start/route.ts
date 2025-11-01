import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { executeQuery } from '@/lib/mysql';

export async function GET(request: NextRequest) {
  try {
    // Get user from session
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session_token')?.value;
    
    if (!sessionToken) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Decode session token to get user email
    const decoded = Buffer.from(sessionToken, 'base64').toString('utf-8');
    const { email } = JSON.parse(decoded);
    
    // Get user ID from database
    const users = await executeQuery(
      'SELECT id FROM users WHERE email = ?',
      [email]
    ) as any[];
    
    if (!users || users.length === 0) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    const userId = users[0].id;
    
    // Generate OAuth state token
    const stateToken = Buffer.from(JSON.stringify({
      userId,
      timestamp: Date.now(),
      random: Math.random().toString(36)
    })).toString('base64');
    
    // Store state token in verification_tokens table (expires in 10 minutes)
    await executeQuery(
      'INSERT INTO verification_tokens (token, email, expires) VALUES (?, ?, ?)',
      [stateToken, email, Date.now() + 10 * 60 * 1000]
    );
    
    // Build Google OAuth URL
    const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    googleAuthUrl.searchParams.set('client_id', process.env.GOOGLE_CLIENT_ID!);
    googleAuthUrl.searchParams.set('redirect_uri', `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/google/callback`);
    googleAuthUrl.searchParams.set('response_type', 'code');
    googleAuthUrl.searchParams.set('scope', 'https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/userinfo.email');
    googleAuthUrl.searchParams.set('access_type', 'offline');
    googleAuthUrl.searchParams.set('prompt', 'consent');
    googleAuthUrl.searchParams.set('state', stateToken);
    
    return NextResponse.redirect(googleAuthUrl.toString());
    
  } catch (error) {
    console.error('Google OAuth start error:', error);
    return NextResponse.redirect(new URL('/docs/integrations?error=oauth_start_failed', request.url));
  }
}
