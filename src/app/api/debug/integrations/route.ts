import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { executeQuery } from '@/lib/mysql';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session_token')?.value;
    
    if (!sessionToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Decode session token to get user email
    const decoded = Buffer.from(sessionToken, 'base64').toString('utf-8');
    const { email } = JSON.parse(decoded);
    
    // Get user ID
    const users = await executeQuery(
      'SELECT id FROM users WHERE email = ?',
      [email]
    ) as any[];
    
    if (!users || users.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    const userId = users[0].id;

    // Get all integrations for this user
    const integrations = await executeQuery(
      'SELECT id, provider, integration_type, provider_email, status, created_at FROM user_integrations WHERE user_id = ?',
      [userId]
    ) as any[];

    return NextResponse.json({
      success: true,
      userId,
      integrations
    });

  } catch (error: any) {
    console.error('Debug integrations error:', error);
    return NextResponse.json({ error: 'Failed to fetch integrations' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session_token')?.value;
    
    if (!sessionToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Decode session token to get user email
    const decoded = Buffer.from(sessionToken, 'base64').toString('utf-8');
    const { email } = JSON.parse(decoded);
    
    // Get user ID
    const users = await executeQuery(
      'SELECT id FROM users WHERE email = ?',
      [email]
    ) as any[];
    
    if (!users || users.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    const userId = users[0].id;

    // Delete all integrations for this user
    await executeQuery(
      'DELETE FROM user_integrations WHERE user_id = ?',
      [userId]
    );

    // Also delete any associated calendars
    await executeQuery(
      `DELETE uc FROM user_calendars uc 
       INNER JOIN user_integrations ui ON uc.integration_id = ui.id 
       WHERE ui.user_id = ?`,
      [userId]
    );

    return NextResponse.json({
      success: true,
      message: 'All integrations cleared'
    });

  } catch (error: any) {
    console.error('Clear integrations error:', error);
    return NextResponse.json({ error: 'Failed to clear integrations' }, { status: 500 });
  }
}
