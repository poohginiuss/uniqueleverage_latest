import { NextResponse } from 'next/server';
import { executeQuery, initializeDatabase } from '@/lib/mysql';

export async function GET() {
  try {
    await initializeDatabase();
    
    // Get all active sessions grouped by user
    const sessionsByUser = await executeQuery(
      `SELECT 
        u.email, 
        u.name,
        u.role,
        COUNT(*) as session_count,
        MIN(us.created_at) as first_session,
        MAX(us.created_at) as latest_session
      FROM user_sessions us 
      JOIN users u ON us.user_id = u.id 
      WHERE us.expires_at > NOW() 
      GROUP BY u.id, u.email, u.name, u.role
      ORDER BY session_count DESC`
    );
    
    // Get total user count
    const totalUsers = await executeQuery('SELECT COUNT(*) as total FROM users');
    
    // Get total active sessions
    const totalSessions = await executeQuery(
      'SELECT COUNT(*) as total FROM user_sessions WHERE expires_at > NOW()'
    );
    
    return NextResponse.json({
      success: true,
      totalUsers: Array.isArray(totalUsers) && totalUsers[0] ? (totalUsers[0] as any).total : 0,
      totalActiveSessions: Array.isArray(totalSessions) && totalSessions[0] ? (totalSessions[0] as any).total : 0,
      sessionsByUser: sessionsByUser
    });
  } catch (error) {
    console.error('Error checking sessions:', error);
    return NextResponse.json({ 
      error: 'Failed to check sessions',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

