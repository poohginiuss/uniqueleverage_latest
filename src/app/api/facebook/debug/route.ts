import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { executeQuery } from "@/lib/mysql";
import crypto from "crypto";

// Decryption function
function decrypt(encryptedText: string, key: string): string {
  const [ivHex, encrypted] = encryptedText.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const keyBuffer = key.includes('=') ? Buffer.from(key, 'base64') : Buffer.from(key, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', keyBuffer, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

export async function GET() {
  try {
    console.log("🔍 Starting Facebook API debug...");
    
    // Get user session
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session_token')?.value;
    console.log("Session token exists:", !!sessionToken);

    if (!sessionToken) {
      return NextResponse.json({ error: 'No session token found' }, { status: 401 });
    }

    // Decode session token to get user email
    const decoded = Buffer.from(sessionToken, 'base64').toString('utf-8');
    const { email } = JSON.parse(decoded);
    console.log("User email:", email);

    // Get user ID
    const users = await executeQuery('SELECT id FROM users WHERE email = ?', [email]) as any[];
    console.log("User found:", users.length > 0);

    if (!users || users.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userId = users[0].id;
    console.log("User ID:", userId);

    // Get Facebook integration
    const integrations = await executeQuery(
      'SELECT id, provider_user_id, provider_email, access_token, status FROM user_integrations WHERE user_id = ? AND provider = ? AND integration_type = ?',
      [userId, 'facebook', 'advertising']
    ) as any[];
    console.log("Facebook integrations found:", integrations.length);

    if (!integrations || integrations.length === 0) {
      return NextResponse.json(
        { error: "No Facebook integration found" },
        { status: 400 }
      );
    }

    const integration = integrations[0];
    console.log("Integration ID:", integration.id);
    
    // Decrypt access token
    const encryptionKey = process.env.ENCRYPTION_KEY!;
    let accessToken;
    try {
      accessToken = decrypt(integration.access_token, encryptionKey);
      console.log("Access token decrypted successfully");
    } catch (error) {
      console.error('Failed to decrypt access token:', error);
      return NextResponse.json(
        { error: "Failed to decrypt access token" },
        { status: 500 }
      );
    }

    // Test Facebook API call
    console.log("Testing Facebook API call...");
    const testResponse = await fetch(`https://graph.facebook.com/v20.0/me/adaccounts?fields=id,name,account_id`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    
    const testData = await testResponse.json();
    console.log("Facebook API response status:", testResponse.status);
    console.log("Facebook API response:", testData);

    return NextResponse.json({
      success: true,
      debug_info: {
        user_id: userId,
        user_email: email,
        integration_id: integration.id,
        facebook_api_status: testResponse.status,
        facebook_api_response: testData,
        access_token_length: accessToken.length
      }
    });
  } catch (err: any) {
    console.error("Debug error:", err);
    return NextResponse.json({ 
      error: err.message,
      stack: err.stack 
    }, { status: 500 });
  }
}
