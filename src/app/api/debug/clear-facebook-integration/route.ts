import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/mysql';
import { fastValidateSession } from '@/lib/fast-auth';

export async function POST() {
  try {
    const { isAuthenticated, user } = await fastValidateSession();
    if (!isAuthenticated || !user) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    // Clear Facebook integration for this user
    await executeQuery(
      'DELETE FROM user_integrations WHERE user_id = ? AND provider = ?',
      [user.id, 'facebook']
    );

    // Clear Facebook pages for this user
    await executeQuery(
      'DELETE FROM user_pages WHERE user_id = ? AND platform = ?',
      [user.id, 'facebook']
    );

    // Clear Facebook ad accounts for this user
    await executeQuery(
      'DELETE FROM user_ad_accounts WHERE user_id = ? AND platform = ?',
      [user.id, 'facebook']
    );

    return NextResponse.json({ 
      success: true, 
      message: 'Facebook integration cleared. Please reconnect Facebook.' 
    });

  } catch (error) {
    console.error('Error clearing Facebook integration:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to clear Facebook integration' 
    }, { status: 500 });
  }
}