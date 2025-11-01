import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { executeQuery } from '@/lib/mysql';
import crypto from 'crypto';

// Encryption functions - more robust key handling
function encrypt(text: string, key: string): string {
  const iv = crypto.randomBytes(16);
  // Always treat key as base64, pad if needed
  let keyBuffer: Buffer;
  try {
    keyBuffer = Buffer.from(key, 'base64');
  } catch {
    // If not valid base64, convert to base64 first
    const base64Key = Buffer.from(key, 'utf8').toString('base64');
    keyBuffer = Buffer.from(base64Key, 'base64');
  }
  
  // Ensure key is exactly 32 bytes for AES-256
  if (keyBuffer.length !== 32) {
    keyBuffer = crypto.createHash('sha256').update(keyBuffer).digest();
  }
  
  const cipher = crypto.createCipheriv('aes-256-cbc', keyBuffer, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

export async function GET(request: NextRequest) {
  try {
    console.log('Facebook OAuth callback started');
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    console.log('Callback parameters:', { code: code ? 'present' : 'missing', state: state ? 'present' : 'missing', error });

    // Check for OAuth errors
    if (error) {
      console.error('Facebook OAuth error:', error);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/docs/integrations?facebook_error=${error}`);
    }

    if (!code || !state) {
      console.error('Missing code or state:', { code: !!code, state: !!state });
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/docs/integrations?facebook_error=missing_params`);
    }

    // Decode state to get user ID (more robust validation)
    let userId;
    try {
      console.log('Decoding state parameter:', state);
      
      // Handle URL encoding issues
      let decodedState;
      try {
        decodedState = JSON.parse(Buffer.from(state, 'base64').toString('utf-8'));
      } catch (decodeError) {
        console.error('Base64 decode failed, trying URL decode:', decodeError);
        // Try URL decoding first, then base64
        const urlDecoded = decodeURIComponent(state);
        decodedState = JSON.parse(Buffer.from(urlDecoded, 'base64').toString('utf-8'));
      }
      
      userId = decodedState.userId;
      
      console.log('Decoded state:', { userId, timestamp: decodedState.timestamp });
      
      // Verify state has required fields and is recent (within 10 minutes)
      if (!userId || !decodedState.timestamp) {
        console.error('Invalid state format:', decodedState);
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/docs/integrations?facebook_error=invalid_state`);
      }
      
      const stateAge = Date.now() - decodedState.timestamp;
      if (stateAge > 600000) { // 10 minutes
        console.error('State expired:', { stateAge, maxAge: 600000 });
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/docs/integrations?facebook_error=state_expired`);
      }
    } catch (error) {
      console.error('Error decoding state:', error);
      console.error('State value:', state);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/docs/integrations?facebook_error=state_decode_failed`);
    }

    // Exchange code for access token
    console.log('Exchanging code for access token');
    const tokenUrl = `https://graph.facebook.com/v18.0/oauth/access_token?` +
      `client_id=${process.env.FACEBOOK_APP_ID}` +
      `&redirect_uri=${encodeURIComponent(`${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/facebook/callback`)}` +
      `&client_secret=${process.env.FACEBOOK_APP_SECRET}` +
      `&code=${code}`;
    
    console.log('Token exchange URL:', tokenUrl.replace(process.env.FACEBOOK_APP_SECRET!, '[REDACTED]'));
    
    const tokenResponse = await fetch(tokenUrl);

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error('Facebook token exchange error:', errorData);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/docs/integrations?facebook_error=token_exchange_failed`);
    }

    const tokenData = await tokenResponse.json();
    console.log('Token exchange successful');
    const { access_token } = tokenData;

    // Get user info from Facebook
    console.log('Getting user info from Facebook');
    const userInfoResponse = await fetch(
      `https://graph.facebook.com/v18.0/me?fields=id,name,email&access_token=${access_token}`
    );

    if (!userInfoResponse.ok) {
      console.error('Failed to get Facebook user info');
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/docs/integrations?facebook_error=user_info_failed`);
    }

    const userInfo = await userInfoResponse.json();
    console.log('User info retrieved:', { id: userInfo.id, name: userInfo.name, email: userInfo.email });
    const { id: facebookUserId, name, email } = userInfo;

    // Encrypt access token
    console.log('Encrypting access token');
    const encryptionKey = process.env.ENCRYPTION_KEY!;
    const encryptedAccessToken = encrypt(access_token, encryptionKey);
    console.log('Access token encrypted successfully');

    // Store integration in database
    console.log('Storing integration in database');
    const integrationResult = await executeQuery(`
      INSERT INTO user_integrations 
      (user_id, provider, integration_type, provider_user_id, provider_email, access_token, refresh_token, scopes, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
      provider_user_id = VALUES(provider_user_id),
      provider_email = VALUES(provider_email),
      access_token = VALUES(access_token),
      scopes = VALUES(scopes),
      status = VALUES(status),
      updated_at = CURRENT_TIMESTAMP
    `, [
      userId,
      'facebook',
      'advertising',
      facebookUserId,
      email || name,
      encryptedAccessToken,
      null, // Facebook doesn't provide long-lived refresh tokens in this flow
      JSON.stringify(['ads_management', 'ads_read', 'pages_read_engagement', 'business_management', 'email']),
      'active'
    ]) as any;

    console.log('Integration stored successfully:', integrationResult);

    // Get the integration ID (either newly inserted or existing)
    const integrationId = integrationResult.insertId || (await executeQuery(
      'SELECT id FROM user_integrations WHERE user_id = ? AND provider = ? AND integration_type = ?',
      [userId, 'facebook', 'advertising']
    ) as any[])[0]?.id;

    console.log('Facebook integration created/updated:', {
      userId,
      integrationId,
      facebookUserId,
      email: email || name
    });

    // Fetch the user's Facebook Pages they granted access to
    const pagesResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/accounts?fields=id,name,category,access_token&access_token=${access_token}`
    );

    if (pagesResponse.ok) {
      const pagesData = await pagesResponse.json();
      const pages = pagesData.data || [];
      
      // Store each page in the database
      for (const page of pages) {
        await executeQuery(`
          INSERT INTO user_pages 
          (user_id, integration_id, page_id, page_name, page_category, platform, access_token, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
          page_name = VALUES(page_name),
          page_category = VALUES(page_category),
          access_token = VALUES(access_token),
          status = 'active',
          updated_at = NOW()
        `, [
          userId,
          integrationId,
          page.id,
          page.name,
          page.category || null,
          'facebook',
          page.access_token || null,
          'active'
        ]);
      }
    }

    // Redirect back to integrations page
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/docs/integrations?facebook_connected=true`);
  } catch (error) {
    console.error('Error in Facebook OAuth callback:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/docs/integrations?facebook_error=callback_failed`);
  }
}
