import { NextResponse } from 'next/server';
import { executeQuery, initializeDatabase } from '@/lib/mysql';

/**
 * Admin endpoint to clean up excess sessions
 * This enforces the 10-session limit for all users retroactively
 */
export async function POST() {
  try {
    await initializeDatabase();
    
    // Step 1: Delete all expired sessions
    const expiredResult = await executeQuery(
      'DELETE FROM user_sessions WHERE expires_at <= NOW()'
    );
    
    // Step 2: Get all users with active sessions
    const usersWithSessions = await executeQuery(
      `SELECT DISTINCT user_id 
       FROM user_sessions 
       WHERE expires_at > NOW()`
    );
    
    let totalCleaned = 0;
    const cleanupResults = [];
    
    // Step 3: For each user, keep only the 10 most recent sessions
    if (Array.isArray(usersWithSessions)) {
      for (const userRow of usersWithSessions) {
        const userId = (userRow as any).user_id;
        
        // Count sessions for this user
        const sessionCount = await executeQuery(
          'SELECT COUNT(*) as count FROM user_sessions WHERE user_id = ? AND expires_at > NOW()',
          [userId]
        );
        
        const count = Array.isArray(sessionCount) && sessionCount[0] ? (sessionCount[0] as any).count : 0;
        
        if (count > 10) {
          const toDelete = count - 10;
          
          // Delete oldest sessions, keeping only 10 most recent
          await executeQuery(
            `DELETE FROM user_sessions 
             WHERE user_id = ? 
             AND expires_at > NOW() 
             ORDER BY created_at ASC 
             LIMIT ?`,
            [userId, toDelete]
          );
          
          totalCleaned += toDelete;
          cleanupResults.push({
            userId,
            sessionsRemoved: toDelete,
            sessionsRemaining: 10
          });
        }
      }
    }
    
    // Step 4: Get final statistics
    const finalStats = await executeQuery(
      `SELECT 
        COUNT(*) as total_sessions,
        COUNT(DISTINCT user_id) as users_with_sessions,
        MAX(session_count) as max_sessions_per_user
       FROM (
         SELECT user_id, COUNT(*) as session_count
         FROM user_sessions
         WHERE expires_at > NOW()
         GROUP BY user_id
       ) as user_sessions_count`
    );
    
    return NextResponse.json({
      success: true,
      message: 'Session cleanup completed',
      expiredSessionsDeleted: Array.isArray(expiredResult) ? 0 : (expiredResult as any).affectedRows || 0,
      excessSessionsCleaned: totalCleaned,
      cleanupDetails: cleanupResults,
      finalStatistics: Array.isArray(finalStats) && finalStats[0] ? finalStats[0] : null
    });
    
  } catch (error) {
    console.error('Session cleanup error:', error);
    return NextResponse.json({ 
      error: 'Failed to clean up sessions',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

