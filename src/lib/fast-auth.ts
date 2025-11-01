import { cookies } from 'next/headers';
import { executeQuery, initializeDatabase } from './mysql';
import crypto from 'crypto';

// Simple session validation without database lookup
export async function fastValidateSession() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session_token')?.value;
    
    if (!sessionToken) {
      return { isAuthenticated: false, user: null };
    }

    // Parse session token to get user info (no database lookup)
    try {
      const decoded = JSON.parse(Buffer.from(sessionToken, 'base64').toString());
      
      // Check if token is expired (24 hours)
      const now = Date.now();
      if (decoded.expires && now > decoded.expires) {
        return { isAuthenticated: false, user: null };
      }
      
      return { 
        isAuthenticated: true, 
        user: {
          id: decoded.userId,
          email: decoded.email,
          role: decoded.role,
          firstName: decoded.firstName,
          lastName: decoded.lastName,
          name: decoded.name,
          username: decoded.username
        }
      };
    } catch (parseError) {
      // If token is malformed, fallback to database validation
      return await validateSessionFromDB(sessionToken);
    }
  } catch (error) {
    console.error('Fast session validation error:', error);
    return { isAuthenticated: false, user: null };
  }
}

// Fallback database validation (only when needed)
async function validateSessionFromDB(sessionToken: string) {
  try {
    await initializeDatabase();
    
    const sessions = await executeQuery(
      `SELECT us.user_id, us.expires_at, u.email, u.role, u.first_name, u.last_name, u.name, u.username 
       FROM user_sessions us 
       JOIN users u ON us.user_id = u.id 
       WHERE us.session_token = ? AND us.expires_at > NOW()`,
      [sessionToken]
    );

    if (!Array.isArray(sessions) || sessions.length === 0) {
      return { isAuthenticated: false, user: null };
    }

    const session = sessions[0] as any;
    return { 
      isAuthenticated: true, 
      user: { 
        id: session.user_id, 
        email: session.email, 
        role: session.role,
        firstName: session.first_name,
        lastName: session.last_name,
        name: session.name,
        username: session.username
      } 
    };
  } catch (error) {
    console.error('Database session validation error:', error);
    return { isAuthenticated: false, user: null };
  }
}

// Create a fast session token (JWT-like but simpler)
export function createFastSessionToken(user: any) {
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    firstName: user.first_name,
    lastName: user.last_name,
    name: user.name,
    username: user.username,
    expires: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
  };
  
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}
