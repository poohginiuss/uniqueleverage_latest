import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { executeQuery, initializeDatabase } from '@/lib/mysql';
import { createFastSessionToken } from '@/lib/fast-auth';

export async function POST(request: NextRequest) {
  try {
    await initializeDatabase();
    
    const { email, password, remember } = await request.json();
    
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // Determine if input is email or username
    const isEmail = email.includes('@');
    console.log('=== LOGIN DEBUG ===');
    console.log('Input:', email);
    console.log('Is email format:', isEmail);
    
    let users;
    
    if (isEmail) {
      console.log('Looking up by email');
      users = await executeQuery(
        'SELECT id, email, password, first_name, last_name, name, username, role FROM users WHERE email = ?',
        [email]
      );
    } else {
      console.log('Looking up by username (admin only)');
      users = await executeQuery(
        'SELECT id, email, password, first_name, last_name, name, username, role FROM users WHERE username = ? AND role = "admin"',
        [email]
      );
    }
    
    console.log('Database query result:', users);
    console.log('Users found:', Array.isArray(users) ? users.length : 'Not an array');
    
    if (!Array.isArray(users) || users.length === 0) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const user = users[0] as any;
    console.log('User found:', user);
    console.log('User role from DB:', user.role);
    console.log('User role type:', typeof user.role);

    // Verify password
    const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
    console.log('Password verification:', user.password === hashedPassword);
    if (user.password !== hashedPassword) {
      console.log('Password verification failed');
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Generate fast session token (no database storage needed)
    const sessionToken = createFastSessionToken(user);
    
    // Session management: Limit to 10 active sessions per user
    // Set expiration based on "Remember Me" checkbox
    const expiresAt = new Date();
    if (remember) {
      // Remember me: 30 days
      expiresAt.setDate(expiresAt.getDate() + 30);
    } else {
      // Default: 24 hours
      expiresAt.setHours(expiresAt.getHours() + 24);
    }
    
    try {
      // Step 1: Clean up expired sessions first
      await executeQuery(
        'DELETE FROM user_sessions WHERE expires_at <= NOW()'
      );
      
      // Step 2: Count current active sessions for this user
      const sessionCount = await executeQuery(
        'SELECT COUNT(*) as count FROM user_sessions WHERE user_id = ? AND expires_at > NOW()',
        [user.id]
      );
      
      const currentSessions = Array.isArray(sessionCount) && sessionCount[0] ? (sessionCount[0] as any).count : 0;
      
      // Step 3: If user has 10 or more sessions, delete the oldest ones
      if (currentSessions >= 10) {
        const sessionsToDelete = currentSessions - 9; // Keep 9, so new one makes 10
        await executeQuery(
          `DELETE FROM user_sessions 
           WHERE user_id = ? 
           AND expires_at > NOW() 
           ORDER BY created_at ASC 
           LIMIT ?`,
          [user.id, sessionsToDelete]
        );
        console.log(`Cleaned up ${sessionsToDelete} old session(s) for user ${user.id}`);
      }
      
      // Step 4: Insert new session
      await executeQuery(
        'INSERT INTO user_sessions (user_id, session_token, expires_at, remember_me) VALUES (?, ?, ?, ?)',
        [user.id, sessionToken, expiresAt, remember || false]
      );
      
      console.log(`Session created for user ${user.id}. Active sessions: ${Math.min(currentSessions + 1, 10)}`);
    } catch (dbError) {
      // Don't fail login if database operations fail
      console.warn('Failed to manage sessions in database:', dbError);
    }

    // Update last login
    await executeQuery(
      'UPDATE users SET last_login_at = NOW() WHERE email = ?',
      [user.email]
    );

    // Create response
    const responseData = { 
      success: true, 
      message: 'Login successful',
      user: { 
        email: user.email, 
        firstName: user.first_name, 
        lastName: user.last_name, 
        name: user.name, 
        username: user.username, 
        role: user.role 
      }
    };
    
    console.log('Login response data:', responseData);
    console.log('Role in response:', responseData.user.role);
    console.log('Role comparison (=== "admin"):', responseData.user.role === 'admin');
    
    const response = NextResponse.json(responseData);

    // Set HTTP-only cookie with appropriate expiration
    const cookieMaxAge = remember ? 30 * 24 * 60 * 60 : 24 * 60 * 60; // 30 days or 24 hours in seconds
    response.cookies.set('session_token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: cookieMaxAge,
      path: '/'
    });

    return response;

  } catch (error) {
    console.error('Session creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get session token from cookie
    const sessionToken = request.cookies.get('session_token')?.value;
    
    if (!sessionToken) {
      return NextResponse.json({ error: 'No session token' }, { status: 401 });
    }

    // Fast validation (no database lookup)
    try {
      const decoded = JSON.parse(Buffer.from(sessionToken, 'base64').toString());
      
      // Check if token is expired (24 hours)
      const now = Date.now();
      if (decoded.expires && now > decoded.expires) {
        return NextResponse.json({ error: 'Session expired' }, { status: 401 });
      }
      
      return NextResponse.json({
        success: true,
        user: {
          email: decoded.email,
          firstName: decoded.firstName,
          lastName: decoded.lastName,
          name: decoded.name,
          username: decoded.username,
          role: decoded.role
        }
      });
    } catch (parseError) {
      return NextResponse.json({ error: 'Invalid session token' }, { status: 401 });
    }

  } catch (error) {
    console.error('Session validation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await initializeDatabase();
    
    // Get session token from cookie
    const sessionToken = request.cookies.get('session_token')?.value;
    
    if (sessionToken) {
      // Delete this specific session from database
      await executeQuery(
        'DELETE FROM user_sessions WHERE session_token = ?',
        [sessionToken]
      );
      
      // Also clean up expired sessions (housekeeping)
      await executeQuery(
        'DELETE FROM user_sessions WHERE expires_at <= NOW()'
      );
    }

    // Create response
    const response = NextResponse.json({ success: true, message: 'Logged out successfully' });
    
    // Clear the cookie
    response.cookies.set('session_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/'
    });

    return response;

  } catch (error) {
    console.error('Session deletion error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
