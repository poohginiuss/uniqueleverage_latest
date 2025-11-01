import { NextResponse } from 'next/server';
import { executeQuery, initializeDatabase } from '@/lib/mysql';

export async function GET() {
  try {
    await initializeDatabase();
    
    // Get active sessions count
    const sessionsCount = await executeQuery(
      'SELECT COUNT(*) as active_sessions FROM user_sessions WHERE expires_at > NOW()'
    );
    
    // Get recent active sessions with user info
    const recentSessions = await executeQuery(
      `SELECT 
        us.user_id, 
        u.email, 
        u.name,
        u.role, 
        us.created_at, 
        us.expires_at 
      FROM user_sessions us 
      JOIN users u ON us.user_id = u.id 
      WHERE us.expires_at > NOW() 
      ORDER BY us.created_at DESC 
      LIMIT 10`
    );
    
    return NextResponse.json({
      success: true,
      activeSessionsCount: Array.isArray(sessionsCount) ? sessionsCount[0] : sessionsCount,
      recentSessions: recentSessions
    });
  } catch (error) {
    console.error('Error checking sessions:', error);
    return NextResponse.json({ 
      error: 'Failed to check sessions',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

