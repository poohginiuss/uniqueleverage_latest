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

    // Get ALL campaigns (no status filter)
    const allCampaignsResponse = await fetch(`${GRAPH_API_BASE}/${adAccountId}/campaigns?fields=id,name,status,objective,created_time&limit=100`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    
    const allCampaignsData = await allCampaignsResponse.json();
    const allCampaigns = allCampaignsData.data || [];

    // Get ALL ad sets (no status filter)
    const allAdsetsResponse = await fetch(`${GRAPH_API_BASE}/${adAccountId}/adsets?fields=id,name,status,campaign_id&limit=100`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    
    const allAdsetsData = await allAdsetsResponse.json();
    const allAdsets = allAdsetsData.data || [];

    // Get ALL ads (no status filter)
    const allAdsResponse = await fetch(`${GRAPH_API_BASE}/${adAccountId}/ads?fields=id,name,status,adset_id&limit=100`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    
    const allAdsData = await allAdsResponse.json();
    const allAds = allAdsData.data || [];

    // Count by status
    const campaignStatusCounts = allCampaigns.reduce((acc: any, campaign: any) => {
      acc[campaign.status] = (acc[campaign.status] || 0) + 1;
      return acc;
    }, {});

    const adsetStatusCounts = allAdsets.reduce((acc: any, adset: any) => {
      acc[adset.status] = (acc[adset.status] || 0) + 1;
      return acc;
    }, {});

    const adStatusCounts = allAds.reduce((acc: any, ad: any) => {
      acc[ad.status] = (acc[ad.status] || 0) + 1;
      return acc;
    }, {});

    return NextResponse.json({
      success: true,
      ad_account: {
        id: adAccountId,
        name: adAccountName,
        platform: connectedAdAccount.platform,
        status: connectedAdAccount.status
      },
      total_counts: {
        campaigns: allCampaigns.length,
        ad_sets: allAdsets.length,
        ads: allAds.length
      },
      status_breakdown: {
        campaigns: campaignStatusCounts,
        ad_sets: adsetStatusCounts,
        ads: adStatusCounts
      },
      all_campaigns: allCampaigns.map((campaign: any) => ({
        id: campaign.id,
        name: campaign.name,
        status: campaign.status,
        objective: campaign.objective,
        created_time: campaign.created_time
      })),
      all_adsets: allAdsets.map((adset: any) => ({
        id: adset.id,
        name: adset.name,
        status: adset.status,
        campaign_id: adset.campaign_id
      })),
      all_ads: allAds.map((ad: any) => ({
        id: ad.id,
        name: ad.name,
        status: ad.status,
        adset_id: ad.adset_id
      }))
    });
  } catch (err: any) {
    console.error("Error fetching all campaigns:", err);
    return NextResponse.json({ 
      error: err.message,
      stack: err.stack 
    }, { status: 500 });
  }
}
