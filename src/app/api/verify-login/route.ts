import { NextRequest, NextResponse } from 'next/server';
import { verificationTokens } from '@/lib/verification';
import { initializeDatabase, executeQuery } from '@/lib/mysql';
import { createFastSessionToken } from '@/lib/fast-auth';

export async function POST(request: NextRequest) {
  try {
    // Initialize database to ensure verification_tokens table exists
    console.log('🔧 Initializing database for login verification...');
    await initializeDatabase();
    console.log('✅ Database initialized successfully for login verification');
    
    const { token } = await request.json();
    
    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    console.log('🔍 Verifying login token:', token);

    // Verify the token (with login prefix)
    const loginToken = `login_${token}`;
    const email = await verificationTokens.get(loginToken);
    
    if (!email) {
      console.log('❌ Invalid or expired login token');
      return NextResponse.json(
        { error: 'Invalid or expired login link' },
        { status: 400 }
      );
    }

    console.log('✅ Valid login token found for email:', email);

    // Get user from database
    const rows = await executeQuery(
      'SELECT id, email, first_name, last_name, role FROM users WHERE email = ?',
      [String(email)]
    );

    const users = rows as any[];
    if (users.length === 0) {
      console.log('❌ User not found for email:', email);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const user = users[0];
    console.log('✅ User found:', { id: user.id, email: user.email, role: user.role });

    // Delete the used token (one-time use)
    await verificationTokens.delete(loginToken);
    console.log('✅ Login token deleted after successful use');

    // Create session token
    const sessionToken = createFastSessionToken({
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role
    });

    // Set HTTP-only cookie
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role
      }
    });

    response.cookies.set('session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/'
    });

    console.log('✅ Login successful, session created for user:', user.email);
    return response;

  } catch (error) {
    console.error('❌ Error verifying login token:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage 
      },
      { status: 500 }
    );
  }
}
