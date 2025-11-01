import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { executeQuery } from "@/lib/mysql";
import crypto from "crypto";

const GRAPH_API_BASE = "https://graph.facebook.com/v20.0";

// Decryption function - more robust key handling
function decrypt(encryptedText: string, key: string): string {
  const [ivHex, encrypted] = encryptedText.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  
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
  
  const decipher = crypto.createDecipheriv('aes-256-cbc', keyBuffer, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

export async function GET() {
  try {
    // Get user session
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session_token')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'No session token found' }, { status: 401 });
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

    // Get Facebook integration
    const integrations = await executeQuery(
      'SELECT id, provider_user_id, provider_email, access_token, status FROM user_integrations WHERE user_id = ? AND provider = ? AND integration_type = ?',
      [userId, 'facebook', 'advertising']
    ) as any[];

    if (!integrations || integrations.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No Facebook integration found",
        userId,
        email,
        integrations: []
      });
    }

    const integration = integrations[0];
    
    // Decrypt access token
    const encryptionKey = process.env.ENCRYPTION_KEY!;
    let accessToken: string;
    try {
      accessToken = decrypt(integration.access_token, encryptionKey);
    } catch (error) {
      console.error('Failed to decrypt access token:', error);
      return NextResponse.json({
        success: true,
        message: "Facebook integration found but token decryption failed",
        userId,
        email,
        integration: {
          id: integration.id,
          provider_user_id: integration.provider_user_id,
          provider_email: integration.provider_email,
          status: integration.status
        },
        error: error instanceof Error ? error.message : String(error)
      });
    }

    // Test Facebook API connection
    try {
      const profileResponse = await fetch(`${GRAPH_API_BASE}/me?fields=id,name,email`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        return NextResponse.json({
          success: true,
          message: "Facebook integration is working!",
          userId,
          email,
          facebookProfile: profileData,
          integration: {
            id: integration.id,
            provider_user_id: integration.provider_user_id,
            provider_email: integration.provider_email,
            status: integration.status
          }
        });
      } else {
        const errorData = await profileResponse.json();
        return NextResponse.json({
          success: false,
          message: "Facebook API error",
          userId,
          email,
          facebookError: errorData,
          integration: {
            id: integration.id,
            provider_user_id: integration.provider_user_id,
            provider_email: integration.provider_email,
            status: integration.status
          }
        });
      }
    } catch (error) {
      return NextResponse.json({
        success: false,
        message: "Facebook API connection failed",
        userId,
        email,
        error: error instanceof Error ? error.message : String(error),
        integration: {
          id: integration.id,
          provider_user_id: integration.provider_user_id,
          provider_email: integration.provider_email,
          status: integration.status
        }
      });
    }

  } catch (err: any) {
    console.error("Error in force refresh Facebook:", err);
    return NextResponse.json({ 
      error: err.message,
      stack: err.stack 
    }, { status: 500 });
  }
}
