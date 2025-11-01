import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { executeQuery } from '@/lib/mysql';
import { ConfidentialClientApplication } from '@azure/msal-node';

export async function GET(request: NextRequest) {
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
    const users = await executeQuery(
      'SELECT id FROM users WHERE email = ?',
      [email]
    ) as any[];
    
    if (!users || users.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
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

    // Generate state parameter for security
    const state = Buffer.from(JSON.stringify({ 
      userId: users[0].id,
      timestamp: Date.now() 
    })).toString('base64');

    // Generate PKCE parameters
    const crypto = require('crypto');
    const codeVerifier = crypto.randomBytes(32).toString('base64url');
    const codeChallenge = crypto
      .createHash('sha256')
      .update(codeVerifier)
      .digest('base64url');

    // Get the Microsoft OAuth URL
    const authUrl = await msalInstance.getAuthCodeUrl({
      scopes: ['https://graph.microsoft.com/Calendars.ReadWrite', 'https://graph.microsoft.com/User.Read'],
      redirectUri: `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/microsoft/callback`,
      state: state,
      codeChallenge: codeChallenge,
      codeChallengeMethod: 'S256',
      prompt: 'select_account' // Force account selection
    });

    // Create redirect response
    const response = NextResponse.redirect(authUrl);

    // Store code verifier in httpOnly cookie
    response.cookies.set('ms_code_verifier', codeVerifier, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600 // 10 minutes
    });

    return response;

  } catch (error) {
    console.error('Microsoft OAuth start error:', error);
    return NextResponse.json({ 
      error: 'Failed to initiate Microsoft OAuth' 
    }, { status: 500 });
  }
}
