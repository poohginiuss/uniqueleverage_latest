import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { executeQuery } from '@/lib/mysql';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session_token')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Decode session token to get user email
    const decoded = Buffer.from(sessionToken, 'base64').toString('utf-8');
    const { email } = JSON.parse(decoded);

    // Get user ID
    const users = await executeQuery('SELECT id FROM users WHERE email = ?', [email]) as any[];

    if (!users || users.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userId = users[0].id;
    const { adAccountId, adAccountName } = await request.json();

    if (!adAccountId || !adAccountName) {
      return NextResponse.json({ error: 'Ad account ID and name are required' }, { status: 400 });
    }

    // Get the user's Facebook integration to associate with
    const integrations = await executeQuery(
      'SELECT id FROM user_integrations WHERE user_id = ? AND provider = ? AND integration_type = ? AND status = ?',
      [userId, 'facebook', 'advertising', 'active']
    ) as any[];

    if (!integrations || integrations.length === 0) {
      return NextResponse.json({ error: 'Facebook integration not found' }, { status: 404 });
    }

    const integrationId = integrations[0].id;

    // Store the ad account connection
    await executeQuery(`
      INSERT INTO user_ad_accounts 
      (user_id, integration_id, ad_account_id, ad_account_name, platform, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
      ON DUPLICATE KEY UPDATE
      ad_account_name = VALUES(ad_account_name),
      status = 'active',
      updated_at = NOW()
    `, [
      userId,
      integrationId,
      adAccountId,
      adAccountName,
      'facebook',
      'active'
    ]);

    return NextResponse.json({
      success: true,
      message: 'Ad account connected successfully'
    });

  } catch (error: any) {
    console.error('Error connecting ad account:', error);
    return NextResponse.json({
      error: 'Failed to connect ad account'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session_token')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Decode session token to get user email
    const decoded = Buffer.from(sessionToken, 'base64').toString('utf-8');
    const { email } = JSON.parse(decoded);

    // Get user ID
    const users = await executeQuery('SELECT id FROM users WHERE email = ?', [email]) as any[];

    if (!users || users.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userId = users[0].id;
    const { adAccountId } = await request.json();

    if (!adAccountId) {
      return NextResponse.json({ error: 'Ad account ID is required' }, { status: 400 });
    }

    // Delete the ad account connection
    await executeQuery(
      'DELETE FROM user_ad_accounts WHERE user_id = ? AND ad_account_id = ?',
      [userId, adAccountId]
    );

    return NextResponse.json({
      success: true,
      message: 'Ad account disconnected successfully'
    });

  } catch (error: any) {
    console.error('Error disconnecting ad account:', error);
    return NextResponse.json({
      error: 'Failed to disconnect ad account'
    }, { status: 500 });
  }
}

