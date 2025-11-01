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

    // Get available ad accounts
    const availableAccounts = await fetch(`${GRAPH_API_BASE}/me/adaccounts?fields=id,name,account_id`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    
    const accountsData = await availableAccounts.json();
    
    if (!accountsData.data || accountsData.data.length === 0) {
      return NextResponse.json(
        { error: "No ad accounts found" },
        { status: 400 }
      );
    }

    const adAccountId = accountsData.data[0].id;
    const adAccountName = accountsData.data[0].name;

    // Get detailed campaign information
    const campaignsResponse = await fetch(`${GRAPH_API_BASE}/${adAccountId}/campaigns?fields=id,name,status,objective,created_time,updated_time&limit=50`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    
    const campaignsData = await campaignsResponse.json();

    // Get ad sets for each campaign
    const campaignsWithDetails = await Promise.all(
      (campaignsData.data || []).map(async (campaign: any) => {
        const adsetsResponse = await fetch(`${GRAPH_API_BASE}/${campaign.id}/adsets?fields=id,name,status,daily_budget&limit=10`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const adsetsData = await adsetsResponse.json();
        
        return {
          ...campaign,
          adsets: adsetsData.data || [],
          adsets_count: (adsetsData.data || []).length
        };
      })
    );

    // Count active campaigns
    const activeCampaigns = campaignsWithDetails.filter(c => c.status === 'ACTIVE');
    const pausedCampaigns = campaignsWithDetails.filter(c => c.status === 'PAUSED');
    const deletedCampaigns = campaignsWithDetails.filter(c => c.status === 'DELETED');

    return NextResponse.json({
      success: true,
      ad_account: {
        id: adAccountId,
        name: adAccountName,
        account_id: accountsData.data[0].account_id
      },
      summary: {
        total_campaigns: campaignsWithDetails.length,
        active_campaigns: activeCampaigns.length,
        paused_campaigns: pausedCampaigns.length,
        deleted_campaigns: deletedCampaigns.length
      },
      campaigns: campaignsWithDetails.map(campaign => ({
        id: campaign.id,
        name: campaign.name,
        status: campaign.status,
        objective: campaign.objective,
        adsets_count: campaign.adsets_count,
        created_time: campaign.created_time,
        updated_time: campaign.updated_time
      }))
    });
  } catch (err: any) {
    console.error("Error fetching campaign details:", err);
    return NextResponse.json({ 
      error: err.message,
      stack: err.stack 
    }, { status: 500 });
  }
}
