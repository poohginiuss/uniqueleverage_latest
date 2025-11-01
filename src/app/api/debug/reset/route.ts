import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { executeQuery } from '@/lib/mysql';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;

    if (!userId) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    // Get user
    const users = await executeQuery('SELECT id FROM users WHERE id = ?', [userId]) as any[];

    if (!users || users.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Delete all user_calendars for this user
    await executeQuery('DELETE FROM user_calendars WHERE user_id = ?', [userId]);
    
    // Delete all user_integrations for this user
    await executeQuery('DELETE FROM user_integrations WHERE user_id = ?', [userId]);

    return NextResponse.json({ 
      success: true, 
      message: 'All integrations and calendars cleared successfully'
    });

  } catch (error: any) {
    console.error('Error resetting user data:', error);
    return NextResponse.json({ 
      error: 'An unexpected error occurred while resetting data' 
    }, { status: 500 });
  }
}

