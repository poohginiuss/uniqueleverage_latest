import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { executeQuery } from '@/lib/mysql';
import { google } from 'googleapis';
import { Client } from '@microsoft/microsoft-graph-client';
import crypto from 'crypto';

// Simple encryption/decryption functions
function decrypt(encryptedText: string, key: string): string {
  const [ivHex, encrypted] = encryptedText.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  // Handle both hex and base64 keys
  const keyBuffer = key.includes('=') ? Buffer.from(key, 'base64') : Buffer.from(key, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', keyBuffer, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

export async function POST(request: NextRequest) {
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

    // Get request body
    const { provider, integrationId } = await request.json();

    // Get the integration from database
    const integrations = await executeQuery(
      'SELECT * FROM user_integrations WHERE id = ? AND user_id = ? AND provider = ?',
      [integrationId, userId, provider]
    ) as any[];

    if (!integrations || integrations.length === 0) {
      return NextResponse.json({ error: 'Integration not found' }, { status: 404 });
    }

    const integration = integrations[0];

    // Decrypt tokens
    const encryptionKey = process.env.ENCRYPTION_KEY!;
    const accessToken = decrypt(integration.access_token, encryptionKey);

    let calendarCount = 0;
    let calendarNames: string[] = [];

    if (provider === 'google') {
      // Test Google Calendar connection
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/google/callback`
      );

      oauth2Client.setCredentials({ access_token: accessToken });

      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
      const calendarList = await calendar.calendarList.list();
      
      calendarCount = calendarList.data.items?.length || 0;
      calendarNames = calendarList.data.items?.map(cal => cal.summary || cal.id || 'Unnamed Calendar') || [];

    } else if (provider === 'microsoft') {
      // Test Microsoft Calendar connection
      const graphClient = Client.init({
        authProvider: (done) => {
          done(null, accessToken);
        }
      });

      const calendars = await graphClient.api('/me/calendars').get();
      
      calendarCount = calendars.value?.length || 0;
      calendarNames = calendars.value?.map((cal: any) => cal.name || 'Unnamed Calendar') || [];
    }

    return NextResponse.json({
      success: true,
      provider,
      calendarCount,
      calendarNames,
      message: `Successfully connected to ${provider} and found ${calendarCount} calendars`
    });

  } catch (error: any) {
    console.error('Calendar test error:', error);
    return NextResponse.json({ 
      success: false,
      error: error.message || 'Failed to test calendar connection'
    }, { status: 500 });
  }
}
