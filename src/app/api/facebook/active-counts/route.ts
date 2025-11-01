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

    if (!connectedAdAccounts || connectedAdAccounts.length === 0) {
      return NextResponse.json(
        { error: "No connected ad accounts found in database" },
        { status: 400 }
      );
    }

    const connectedAdAccount = connectedAdAccounts[0];
    const adAccountId = connectedAdAccount.ad_account_id.startsWith('act_') 
      ? connectedAdAccount.ad_account_id 
      : `act_${connectedAdAccount.ad_account_id}`;
    const adAccountName = connectedAdAccount.ad_account_name;

    // Get ACTIVE campaigns only
    const activeCampaignsResponse = await fetch(`${GRAPH_API_BASE}/${adAccountId}/campaigns?fields=id,name,status&status=ACTIVE&limit=100`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    
    const activeCampaignsData = await activeCampaignsResponse.json();
    const activeCampaigns = activeCampaignsData.data || [];

    // Get ACTIVE ad sets only
    const activeAdsetsResponse = await fetch(`${GRAPH_API_BASE}/${adAccountId}/adsets?fields=id,name,status&status=ACTIVE&limit=100`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    
    const activeAdsetsData = await activeAdsetsResponse.json();
    const activeAdsets = activeAdsetsData.data || [];

    // Get ACTIVE ads only
    const activeAdsResponse = await fetch(`${GRAPH_API_BASE}/${adAccountId}/ads?fields=id,name,status&status=ACTIVE&limit=100`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    
    const activeAdsData = await activeAdsResponse.json();
    const activeAds = activeAdsData.data || [];

    return NextResponse.json({
      success: true,
      ad_account: {
        id: adAccountId,
        name: adAccountName,
        platform: connectedAdAccount.platform,
        status: connectedAdAccount.status
      },
      active_counts: {
        campaigns: activeCampaigns.length,
        ad_sets: activeAdsets.length,
        ads: activeAds.length
      },
      active_campaigns: activeCampaigns.map((campaign: any) => ({
        id: campaign.id,
        name: campaign.name,
        status: campaign.status
      })),
      active_adsets: activeAdsets.map((adset: any) => ({
        id: adset.id,
        name: adset.name,
        status: adset.status
      })),
      active_ads: activeAds.map((ad: any) => ({
        id: ad.id,
        name: ad.name,
        status: ad.status
      }))
    });
  } catch (err: any) {
    console.error("Error fetching active counts:", err);
    return NextResponse.json({ 
      error: err.message,
      stack: err.stack 
    }, { status: 500 });
  }
}
