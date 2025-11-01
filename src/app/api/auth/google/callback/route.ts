import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { executeQuery } from '@/lib/mysql';
import { google } from 'googleapis';
import crypto from 'crypto';

// Simple encryption/decryption functions
function encrypt(text: string, key: string): string {
  const algorithm = 'aes-256-cbc';
  const keyBuffer = Buffer.from(key.padEnd(32, '0').slice(0, 32));
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, keyBuffer, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decrypt(encryptedText: string, key: string): string {
  const algorithm = 'aes-256-cbc';
  const keyBuffer = Buffer.from(key.padEnd(32, '0').slice(0, 32));
  const [ivHex, encrypted] = encryptedText.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv(algorithm, keyBuffer, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    
    if (error) {
      console.error('Google OAuth error:', error);
      return NextResponse.redirect(new URL('/docs/integrations?error=oauth_denied', request.url));
    }
    
    if (!code || !state) {
      return NextResponse.redirect(new URL('/docs/integrations?error=invalid_callback', request.url));
    }
    
    // Verify state token
    const tokens = await executeQuery(
      'SELECT email FROM verification_tokens WHERE token = ? AND expires > ?',
      [state, Date.now()]
    ) as any[];
    
    if (!tokens || tokens.length === 0) {
      return NextResponse.redirect(new URL('/docs/integrations?error=invalid_state', request.url));
    }
    
    const email = tokens[0].email;
    
    // Get user ID
    const users = await executeQuery(
      'SELECT id FROM users WHERE email = ?',
      [email]
    ) as any[];
    
    if (!users || users.length === 0) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    const userId = users[0].id;
    
    // Exchange code for tokens
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/google/callback`
    );
    
    const { tokens: googleTokens } = await oauth2Client.getToken(code);
    
    if (!googleTokens.access_token || !googleTokens.refresh_token) {
      throw new Error('Failed to get tokens from Google');
    }
    
    // Set credentials and get user info from Google
    oauth2Client.setCredentials(googleTokens);
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();
    const googleEmail = userInfo.data.email;
    
    if (!googleEmail) {
      throw new Error('Failed to get email from Google');
    }
    
    // Encrypt tokens before storing
    const encryptionKey = process.env.ENCRYPTION_KEY!;
    const encryptedAccessToken = encrypt(googleTokens.access_token, encryptionKey);
    const encryptedRefreshToken = encrypt(googleTokens.refresh_token, encryptionKey);
    
    // Store integration in database
    await executeQuery(`
      INSERT INTO user_integrations 
      (user_id, provider, integration_type, provider_email, access_token, refresh_token, token_expires_at, scopes, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
      access_token = VALUES(access_token),
      refresh_token = VALUES(refresh_token),
      token_expires_at = VALUES(token_expires_at),
      scopes = VALUES(scopes),
      status = VALUES(status),
      updated_at = CURRENT_TIMESTAMP
    `, [
      userId,
      'google',
      'calendar',
      googleEmail,
      encryptedAccessToken,
      encryptedRefreshToken,
      new Date(googleTokens.expiry_date || Date.now() + 3600000),
      JSON.stringify(['https://www.googleapis.com/auth/calendar.readonly', 'https://www.googleapis.com/auth/userinfo.email']),
      'active'
    ]);
    
    // Clean up state token
    await executeQuery('DELETE FROM verification_tokens WHERE token = ?', [state]);
    
    // Redirect back to integrations page
    return NextResponse.redirect(new URL('/docs/integrations?google_connected=true', request.url));
    
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    return NextResponse.redirect(new URL('/docs/integrations?error=oauth_callback_failed', request.url));
  }
}