import { NextRequest, NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/mysql';
import { authenticateRequest } from '@/lib/auth-middleware';

export async function GET(request: NextRequest) {
  try {
    await initializeDatabase();
    
    // Use authentication middleware
    const authResult = await authenticateRequest(request);
    
    if (!authResult) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { user } = authResult;
    
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Current user API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
