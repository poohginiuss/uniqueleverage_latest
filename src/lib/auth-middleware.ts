import { NextRequest } from 'next/server';
import { getUserFromSession } from './auth-utils';

/**
 * Authentication middleware for API routes
 * Handles both localStorage-based and cookie-based authentication
 */
export async function authenticateRequest(request: NextRequest) {
  try {
    // Method 1: Try to get email from localStorage (sent in request headers)
    const userEmail = request.headers.get('x-user-email');
    
    if (userEmail) {
      const user = await getUserFromSession(userEmail);
      if (user) {
        return { user, method: 'localStorage' };
      }
    }

    // Method 2: Try cookie-based authentication (for backward compatibility)
    const sessionToken = request.cookies.get('session_token')?.value;
    
    if (sessionToken) {
      try {
        const decoded = JSON.parse(Buffer.from(sessionToken, 'base64').toString());
        
        // Check if token is expired (24 hours)
        const now = Date.now();
        if (decoded.expires && now > decoded.expires) {
          throw new Error('Session expired');
        }
        
        const user = await getUserFromSession(decoded.email);
        if (user) {
          return { user, method: 'cookie' };
        }
      } catch (parseError) {
        // Invalid cookie, continue to next method
      }
    }

    return null;
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

/**
 * Client-side helper to include authentication headers
 */
export function getAuthHeaders() {
  if (typeof window === 'undefined') return {};
  
  const userEmail = localStorage.getItem('userEmail');
  if (!userEmail) return {};
  
  return {
    'x-user-email': userEmail,
  };
}
