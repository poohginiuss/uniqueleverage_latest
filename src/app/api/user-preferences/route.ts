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

    const users = await executeQuery('SELECT id, theme_preference, timezone FROM users WHERE email = ?', [email]) as any[];
    if (!users || users.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    const user = users[0];

    return NextResponse.json({
      success: true,
      data: {
        themePreference: user.theme_preference || 'system',
        timezone: user.timezone || 'America/New_York'
      }
    });

  } catch (error) {
    console.error('Error fetching user preferences:', error);
    return NextResponse.json({ error: 'Failed to fetch user preferences' }, { status: 500 });
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

    const { themePreference, timezone } = await request.json();

    if (!themePreference && !timezone) {
      return NextResponse.json({ error: 'At least one preference must be provided' }, { status: 400 });
    }

    // Build update query dynamically
    const updateFields = [];
    const updateValues = [];

    if (themePreference && ['light', 'dark', 'system'].includes(themePreference)) {
      updateFields.push('theme_preference = ?');
      updateValues.push(themePreference);
    }

    if (timezone) {
      updateFields.push('timezone = ?');
      updateValues.push(timezone);
    }

    if (updateFields.length === 0) {
      return NextResponse.json({ error: 'No valid preferences provided' }, { status: 400 });
    }

    updateValues.push(userId);

    await executeQuery(
      `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    return NextResponse.json({ success: true, message: 'User preferences updated successfully' });

  } catch (error) {
    console.error('Error updating user preferences:', error);
    return NextResponse.json({ error: 'Failed to update user preferences' }, { status: 500 });
  }
}
