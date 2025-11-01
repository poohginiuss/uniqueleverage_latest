import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { executeQuery } from '@/lib/mysql';

// Encryption functions
function encrypt(text: string, key: string): string {
  const crypto = require('crypto');
  const algorithm = 'aes-256-gcm';
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipher(algorithm, Buffer.from(key, 'hex'));
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return iv.toString('hex') + ':' + encrypted;
}

function decrypt(encryptedText: string, key: string): string {
  const crypto = require('crypto');
  const algorithm = 'aes-256-gcm';
  const parts = encryptedText.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts[1];
  
  const decipher = crypto.createDecipher(algorithm, Buffer.from(key, 'hex'));
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

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

    // Get email integrations
    const integrations = await executeQuery(
      'SELECT provider, provider_email, status, created_at FROM user_email_integrations WHERE user_id = ? AND status = ?',
      [userId, 'active']
    ) as any[];

    return NextResponse.json({
      success: true,
      data: integrations.map(integration => ({
        provider: integration.provider,
        email: integration.provider_email,
        status: integration.status,
        connectedAt: integration.created_at
      }))
    });

  } catch (error) {
    console.error('Error fetching email integrations:', error);
    return NextResponse.json({ error: 'Failed to fetch email integrations' }, { status: 500 });
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

    const {
      provider,
      providerEmail,
      accessToken,
      refreshToken,
      expiresAt
    } = await request.json();

    if (!provider || !providerEmail || !accessToken) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const encryptionKey = process.env.ENCRYPTION_KEY!;
    
    // Encrypt tokens
    const encryptedAccessToken = encrypt(accessToken, encryptionKey);
    const encryptedRefreshToken = refreshToken ? encrypt(refreshToken, encryptionKey) : null;

    // Save email integration
    await executeQuery(
      `INSERT INTO user_email_integrations 
       (user_id, provider, provider_email, access_token, refresh_token, token_expires_at, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
       access_token = VALUES(access_token),
       refresh_token = VALUES(refresh_token),
       token_expires_at = VALUES(token_expires_at),
       status = 'active',
       updated_at = CURRENT_TIMESTAMP`,
      [
        userId,
        provider,
        providerEmail,
        encryptedAccessToken,
        encryptedRefreshToken,
        expiresAt || null,
        'active'
      ]
    );

    return NextResponse.json({ success: true, message: 'Email integration saved successfully' });

  } catch (error) {
    console.error('Error saving email integration:', error);
    return NextResponse.json({ error: 'Failed to save email integration' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
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

    const { provider, providerEmail } = await request.json();

    if (!provider || !providerEmail) {
      return NextResponse.json({ error: 'Provider and email are required' }, { status: 400 });
    }

    // Mark integration as inactive
    await executeQuery(
      'UPDATE user_email_integrations SET status = ? WHERE user_id = ? AND provider = ? AND provider_email = ?',
      ['inactive', userId, provider, providerEmail]
    );

    return NextResponse.json({ success: true, message: 'Email integration disconnected successfully' });

  } catch (error) {
    console.error('Error disconnecting email integration:', error);
    return NextResponse.json({ error: 'Failed to disconnect email integration' }, { status: 500 });
  }
}
