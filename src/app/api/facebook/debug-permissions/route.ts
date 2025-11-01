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
        { error: "No Facebook integration found. Please connect your Facebook account first." },
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

    console.log('🔍 Checking access token permissions and debugging ad set creation...');

    // Check what permissions our access token has
    const permissionsResponse = await fetch(
      `${GRAPH_API_BASE}/me/permissions?access_token=${accessToken}`
    );
    const permissions = await permissionsResponse.json();

    console.log('Access token permissions:', permissions);

    // Get connected ad account
    const connectedAdAccounts = await executeQuery(
      'SELECT id, ad_account_id, ad_account_name, platform, status FROM user_ad_accounts WHERE user_id = ? AND status = ?',
      [userId, 'active']
    ) as any[];

    if (!connectedAdAccounts || connectedAdAccounts.length === 0) {
      return NextResponse.json(
        { error: "No connected ad account found. Please connect an ad account first." },
        { status: 400 }
      );
    }

    const adAccountId = connectedAdAccounts[0].ad_account_id.replace('act_', '');

    // Check ad account details
    const adAccountResponse = await fetch(
      `${GRAPH_API_BASE}/act_${adAccountId}?fields=id,name,account_status,currency,timezone_name&access_token=${accessToken}`
    );
    const adAccountDetails = await adAccountResponse.json();

    console.log('Ad account details:', adAccountDetails);

    // Try to get more specific error by checking what fields are required for ad sets
    const adSetFieldsResponse = await fetch(
      `${GRAPH_API_BASE}/act_${adAccountId}/adsets?fields=id,name,status&limit=1&access_token=${accessToken}`
    );
    const existingAdSets = await adSetFieldsResponse.json();

    console.log('Existing ad sets (to see structure):', existingAdSets);

    return NextResponse.json({
      success: true,
      message: "Access token and ad account debugging completed",
      results: {
        permissions: permissions,
        adAccountDetails: adAccountDetails,
        existingAdSets: existingAdSets,
        accessTokenPreview: accessToken.substring(0, 20) + "..."
      }
    });

  } catch (err: any) {
    console.error("Error in debugging:", err);
    return NextResponse.json({ 
      error: err.message,
      stack: err.stack 
    }, { status: 500 });
  }
}
