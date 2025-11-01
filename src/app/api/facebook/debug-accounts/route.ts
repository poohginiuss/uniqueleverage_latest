import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { executeQuery } from "@/lib/mysql";
import crypto from "crypto";

const GRAPH_API_BASE = "https://graph.facebook.com/v20.0";

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
    // Get user session
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session_token')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
      return NextResponse.json(
        { error: "No Facebook integration found" },
        { status: 400 }
      );
    }

    const integration = integrations[0];
    
    // Decrypt access token
    const encryptionKey = process.env.ENCRYPTION_KEY!;
    let accessToken;
    try {
      accessToken = decrypt(integration.access_token, encryptionKey);
    } catch (error) {
      console.error('Failed to decrypt access token:', error);
      return NextResponse.json(
        { error: "Failed to decrypt access token" },
        { status: 500 }
      );
    }

    // Get connected ad account from database
    const connectedAdAccounts = await executeQuery(
      'SELECT id, ad_account_id, ad_account_name, platform, status FROM user_ad_accounts WHERE user_id = ? AND status = ?',
      [userId, 'active']
    ) as any[];

    // Get ALL ad accounts that the access token can actually access
    const availableAccountsResponse = await fetch(`${GRAPH_API_BASE}/me/adaccounts?fields=id,name,account_id,account_status`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    
    const availableAccountsData = await availableAccountsResponse.json();
    
    if (!availableAccountsResponse.ok) {
      return NextResponse.json({
        error: "Failed to get available ad accounts",
        facebook_error: availableAccountsData,
        access_token_preview: accessToken.substring(0, 20) + "..."
      }, { status: availableAccountsResponse.status });
    }

    const availableAccounts = availableAccountsData.data || [];

    return NextResponse.json({
      success: true,
      debug_info: {
        connected_in_db: connectedAdAccounts,
        actually_accessible: availableAccounts,
        comparison: {
          connected_account_id: connectedAdAccounts[0]?.ad_account_id,
          connected_account_name: connectedAdAccounts[0]?.ad_account_name,
          accessible_account_ids: availableAccounts.map((acc: any) => acc.id),
          accessible_account_names: availableAccounts.map((acc: any) => acc.name),
          match_found: availableAccounts.some((acc: any) => acc.id === connectedAdAccounts[0]?.ad_account_id)
        },
        access_token_preview: accessToken.substring(0, 20) + "..."
      }
    });
  } catch (err: any) {
    console.error("Error in debug API:", err);
    return NextResponse.json({ 
      error: err.message,
      stack: err.stack 
    }, { status: 500 });
  }
}
