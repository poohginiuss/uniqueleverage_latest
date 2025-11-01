import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { executeQuery } from '@/lib/mysql';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session_token')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = Buffer.from(sessionToken, 'base64').toString('utf-8');
    const { email } = JSON.parse(decoded);

    const users = await executeQuery('SELECT id FROM users WHERE email = ?', [email]) as any[];
    if (!users || users.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    const userId = users[0].id;

    // Get feed requests
    const feedRequests = await executeQuery(
      'SELECT provider, provider_slug, status, created_at FROM user_feed_requests WHERE user_id = ?',
      [userId]
    ) as any[];

    return NextResponse.json({
      success: true,
      data: feedRequests.map(request => ({
        provider: request.provider,
        providerSlug: request.provider_slug,
        status: request.status,
        sentAt: request.created_at
      }))
    });

  } catch (error) {
    console.error('Error fetching feed requests:', error);
    return NextResponse.json({ error: 'Failed to fetch feed requests' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session_token')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = Buffer.from(sessionToken, 'base64').toString('utf-8');
    const { email } = JSON.parse(decoded);

    const users = await executeQuery('SELECT id FROM users WHERE email = ?', [email]) as any[];
    if (!users || users.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    const userId = users[0].id;

    const { provider, providerSlug, status = 'sent', requestData, responseData } = await request.json();

    if (!provider || !providerSlug) {
      return NextResponse.json({ error: 'Provider and provider slug are required' }, { status: 400 });
    }

    // Save feed request
    await executeQuery(
      `INSERT INTO user_feed_requests 
       (user_id, provider, provider_slug, status, request_data, response_data)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
       status = VALUES(status),
       request_data = VALUES(request_data),
       response_data = VALUES(response_data),
       updated_at = CURRENT_TIMESTAMP`,
      [
        userId,
        provider,
        providerSlug,
        status,
        requestData ? JSON.stringify(requestData) : null,
        responseData ? JSON.stringify(responseData) : null
      ]
    );

    return NextResponse.json({ success: true, message: 'Feed request saved successfully' });

  } catch (error) {
    console.error('Error saving feed request:', error);
    return NextResponse.json({ error: 'Failed to save feed request' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session_token')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = Buffer.from(sessionToken, 'base64').toString('utf-8');
    const { email } = JSON.parse(decoded);

    const users = await executeQuery('SELECT id FROM users WHERE email = ?', [email]) as any[];
    if (!users || users.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    const userId = users[0].id;

    const { providerSlug, status, responseData } = await request.json();

    if (!providerSlug || !status) {
      return NextResponse.json({ error: 'Provider slug and status are required' }, { status: 400 });
    }

    // Update feed request status
    await executeQuery(
      'UPDATE user_feed_requests SET status = ?, response_data = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND provider_slug = ?',
      [
        status,
        responseData ? JSON.stringify(responseData) : null,
        userId,
        providerSlug
      ]
    );

    return NextResponse.json({ success: true, message: 'Feed request updated successfully' });

  } catch (error) {
    console.error('Error updating feed request:', error);
    return NextResponse.json({ error: 'Failed to update feed request' }, { status: 500 });
  }
}
