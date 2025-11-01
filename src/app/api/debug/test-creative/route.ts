import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { executeQuery } from '@/lib/mysql';
import crypto from 'crypto';

const GRAPH_API_BASE = "https://graph.facebook.com/v20.0";

function decryptAccessToken(encryptedToken: string): string {
  try {
    const key = process.env.ENCRYPTION_KEY!;
    const [ivHex, encryptedData] = encryptedToken.split(':');
    const iv = Buffer.from(ivHex, 'hex');

    let keyBuffer: Buffer;
    try {
      keyBuffer = Buffer.from(key, 'base64');
    } catch {
      const base64Key = Buffer.from(key, 'utf8').toString('base64');
      keyBuffer = Buffer.from(base64Key, 'base64');
    }

    if (keyBuffer.length !== 32) {
      keyBuffer = crypto.createHash('sha256').update(keyBuffer).digest();
    }

    const decipher = crypto.createDecipheriv('aes-256-cbc', keyBuffer, iv);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Failed to decrypt access token');
  }
}

async function fbRequest(
  path: string,
  options: {
    method?: string;
    body?: URLSearchParams | Record<string, string>;
    accessToken: string;
  }
) {
  const { method = "GET", body, accessToken } = options;
  const url = `${GRAPH_API_BASE}/${path}`;

  const fetchOptions: RequestInit = {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  };

  if (body) {
    if (body instanceof URLSearchParams) {
      fetchOptions.body = body;
      fetchOptions.headers = {
        ...fetchOptions.headers,
        "Content-Type": "application/x-www-form-urlencoded",
      };
    } else {
      fetchOptions.body = JSON.stringify(body);
      fetchOptions.headers = {
        ...fetchOptions.headers,
        "Content-Type": "application/json",
      };
    }
  }

  const response = await fetch(url, fetchOptions);
  const data = await response.json();

  if (!response.ok) {
    console.error(`Facebook API Error (${path}):`, data);
    throw new Error(
      data.error?.message || `Facebook API error: ${response.statusText}`
    );
  }
  return data;
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
    const sessionData = JSON.parse(decoded);
    
    // Handle different session token formats and fix email spelling
    const email = sessionData.email || sessionData.Hmail;
    
    if (!email) {
      return NextResponse.json({ error: 'Invalid session token format' }, { status: 401 });
    }

    // Fix email spelling: nathanalhison -> nathanallison
    const correctedEmail = email.replace('nathanalhison', 'nathanallison');

    // Get user ID - try both the original email and corrected email
    let users = await executeQuery('SELECT id FROM users WHERE email = ?', [email]) as any[];
    
    if (!users || users.length === 0) {
      users = await executeQuery('SELECT id FROM users WHERE email = ?', [correctedEmail]) as any[];
    }

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
    const accessToken = decryptAccessToken(integration.access_token);

    // Get user's connected ad accounts
    const adAccounts = await executeQuery(
      'SELECT ad_account_id, ad_account_name FROM user_ad_accounts WHERE user_id = ?',
      [userId]
    ) as any[];

    if (!adAccounts || adAccounts.length === 0) {
      return NextResponse.json(
        { error: "No Facebook ad accounts connected" },
        { status: 400 }
      );
    }

    const adAccountId = adAccounts[0].ad_account_id;
    const EXISTING_CREATIVE_ID = "1440488771040179";

    // Test 1: Try to fetch the creative directly
    try {
      const creative = await fbRequest(`${EXISTING_CREATIVE_ID}`, { accessToken });
      console.log('✅ Creative found:', creative);
    } catch (error) {
      console.log('❌ Creative not found:', error);
    }

    // Test 2: List all creatives in the ad account
    try {
      const creatives = await fbRequest(`act_${adAccountId}/adcreatives?fields=id,name,object_story_spec`, { accessToken });
      console.log('✅ Available creatives:', creatives);
    } catch (error) {
      console.log('❌ Could not fetch creatives:', error);
    }

    // Test 3: Try to create a simple ad with the creative
    try {
      // First create a test campaign
      const campaignData = {
        name: "Test Campaign for Creative Debug",
        objective: "OUTCOME_LEADS",
        status: "PAUSED",
        special_ad_categories: JSON.stringify([]),
        daily_budget: "1000",
      };
      
      const campaign = await fbRequest(`act_${adAccountId}/campaigns`, {
        method: "POST",
        body: new URLSearchParams(campaignData),
        accessToken,
      });
      console.log('✅ Test campaign created:', campaign);

      // Create a test ad set
      const adSetData = {
        name: "Test Ad Set",
        campaign_id: campaign.id,
        optimization_goal: "LEAD_GENERATION",
        billing_event: "IMPRESSIONS",
        bid_amount: "1000",
        targeting: JSON.stringify({
          age_min: 25,
          age_max: 65,
          geo_locations: { countries: ['US'] },
          publisher_platforms: ["facebook", "instagram"]
        }),
        status: "PAUSED"
      };

      const adSet = await fbRequest(`act_${adAccountId}/adsets`, {
        method: "POST",
        body: new URLSearchParams(adSetData),
        accessToken,
      });
      console.log('✅ Test ad set created:', adSet);

      // Try to create an ad with the existing creative
      const adData = {
        name: "Test Ad",
        adset_id: adSet.id,
        creative: JSON.stringify({ creative_id: EXISTING_CREATIVE_ID }),
        status: 'PAUSED'
      };

      const ad = await fbRequest(`act_${adAccountId}/ads`, {
        method: "POST",
        body: new URLSearchParams(adData),
        accessToken,
      });
      console.log('✅ Test ad created:', ad);

      return NextResponse.json({
        success: true,
        message: "All tests passed! Creative ID is working.",
        campaign: campaign,
        adSet: adSet,
        ad: ad
      });

    } catch (error) {
      console.log('❌ Ad creation failed:', error);
      return NextResponse.json({
        success: false,
        error: "Ad creation failed",
        details: error instanceof Error ? error.message : String(error)
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Debug test failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}
