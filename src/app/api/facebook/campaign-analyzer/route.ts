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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('campaignId');

    if (!campaignId) {
      return NextResponse.json({ error: 'campaignId parameter is required' }, { status: 400 });
    }

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
    let accessToken: string;
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

    // Helper function for Facebook API requests
    async function fbRequest(endpoint: string, options: RequestInit = {}) {
      const res = await fetch(`${GRAPH_API_BASE}/${endpoint}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        ...options,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Unknown error");
      return data;
    }

    // 1. Get Campaign Details
    const campaignDetails = await fbRequest(`${campaignId}?fields=id,name,status,objective,buying_type,budget_remaining,daily_budget,lifetime_budget,created_time,start_time,stop_time,special_ad_categories`);

    // 2. Get Ad Sets for this Campaign
    const adSets = await fbRequest(`${campaignId}/adsets?fields=id,name,status,daily_budget,lifetime_budget,bid_strategy,optimization_goal,targeting,start_time,stop_time,pacing_type,billing_event`);

    // 3. Get Ads for this Campaign
    const ads = await fbRequest(`${campaignId}/ads?fields=id,name,status,creative,effective_status,adset_id`);

    // 4. Get detailed creative information for each ad
    const adsWithCreatives = await Promise.all(
      ads.data.map(async (ad: any) => {
        try {
          const creative = await fbRequest(`${ad.id}/creative?fields=id,name,title,body,link_url,image_url,video_id,object_story_spec,object_type,thumbnail_url,url_tags`);
          return {
            ...ad,
            creative_details: creative
          };
        } catch (error) {
          return {
            ...ad,
            creative_details: { error: 'Failed to fetch creative details' }
          };
        }
      })
    );

    return NextResponse.json({
      success: true,
      campaign_analysis: {
        campaign: campaignDetails,
        ad_sets: adSets.data,
        ads: adsWithCreatives,
        summary: {
          campaign_name: campaignDetails.name,
          objective: campaignDetails.objective,
          status: campaignDetails.status,
          budget_type: campaignDetails.daily_budget ? 'daily' : 'lifetime',
          budget_amount: campaignDetails.daily_budget || campaignDetails.lifetime_budget,
          ad_sets_count: adSets.data.length,
          ads_count: ads.data.length,
          special_ad_categories: campaignDetails.special_ad_categories,
          buying_type: campaignDetails.buying_type
        }
      }
    });
  } catch (err: any) {
    console.error("Error analyzing campaign:", err);
    return NextResponse.json({ 
      error: err.message,
      stack: err.stack 
    }, { status: 500 });
  }
}
