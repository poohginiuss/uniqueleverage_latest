import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { executeQuery } from '@/lib/mysql';
import { ConfidentialClientApplication } from '@azure/msal-node';
import { Client } from '@microsoft/microsoft-graph-client';
import crypto from 'crypto';

// Simple encryption/decryption functions
function encrypt(text: string, key: string): string {
  const iv = crypto.randomBytes(16);
  // Handle both hex and base64 keys
  const keyBuffer = key.includes('=') ? Buffer.from(key, 'base64') : Buffer.from(key, 'hex');
  const cipher = crypto.createCipheriv('aes-256-cbc', keyBuffer, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      console.error('Microsoft OAuth error:', error);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/docs/integrations?error=microsoft_oauth_failed`);
    }

    if (!code || !state) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/docs/integrations?error=missing_parameters`);
    }

    // Decode state to get user info
    const decodedState = JSON.parse(Buffer.from(state, 'base64').toString('utf-8'));
    const { userId } = decodedState;

    // Get code verifier from cookie
    const cookieStore = await cookies();
    const codeVerifier = cookieStore.get('ms_code_verifier')?.value;

    if (!codeVerifier) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/docs/integrations?error=missing_code_verifier`);
    }

    // Create MSAL instance
    const msalConfig = {
      auth: {
        clientId: process.env.MICROSOFT_CLIENT_ID!,
        clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
        authority: 'https://login.microsoftonline.com/common'
      }
    };

    const msalInstance = new ConfidentialClientApplication(msalConfig);

    // Exchange code for tokens
    const tokenResponse = await msalInstance.acquireTokenByCode({
      scopes: ['https://graph.microsoft.com/Calendars.ReadWrite', 'https://graph.microsoft.com/User.Read'],
      code: code,
      redirectUri: `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/microsoft/callback`,
      codeVerifier: codeVerifier
    });

    console.log('Token response:', {
      hasAccessToken: !!tokenResponse.accessToken,
      expiresOn: tokenResponse.expiresOn,
      scopes: tokenResponse.scopes
    });

    // Get user info from Microsoft Graph
    const graphClient = Client.init({
      authProvider: (done) => {
        done(null, tokenResponse.accessToken);
      }
    });

    const user = await graphClient.api('/me').get();
    const email = user.mail || user.userPrincipalName;

    // Check if access token exists
    if (!tokenResponse.accessToken) {
      throw new Error('No access token received from Microsoft');
    }

    // Encrypt access token
    const encryptedAccessToken = encrypt(tokenResponse.accessToken, process.env.ENCRYPTION_KEY!);
    
    // Microsoft doesn't provide refresh tokens in the initial response
    // They will be handled through the MSAL library's token refresh mechanism
    const encryptedRefreshToken = null;

    // Calculate token expiry
    const tokenExpiresAt = tokenResponse.expiresOn ? new Date(tokenResponse.expiresOn) : new Date(Date.now() + 3600000);

    // Store integration in database
    await executeQuery(`
      INSERT INTO user_integrations 
      (user_id, provider, integration_type, provider_user_id, provider_email, access_token, refresh_token, token_expires_at, scopes, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
      provider_user_id = VALUES(provider_user_id),
      provider_email = VALUES(provider_email),
      access_token = VALUES(access_token),
      refresh_token = VALUES(refresh_token),
      token_expires_at = VALUES(token_expires_at),
      scopes = VALUES(scopes),
      status = VALUES(status),
      updated_at = CURRENT_TIMESTAMP
    `, [
      userId,
      'microsoft',
      'calendar',
      user.id,
      email,
      encryptedAccessToken,
      encryptedRefreshToken || null,
      tokenExpiresAt,
      tokenResponse.scopes?.join(','),
      'active'
    ]);

    // Clear code verifier cookie
    const response = NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/docs/integrations?microsoft_connected=true`);
    response.cookies.delete('ms_code_verifier');

    return response;

  } catch (error) {
    console.error('Microsoft OAuth callback error:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/docs/integrations?error=microsoft_oauth_callback_failed`);
  }
}
