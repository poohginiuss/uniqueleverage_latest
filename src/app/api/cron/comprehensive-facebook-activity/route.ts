import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/mysql';

const GRAPH_API_BASE = 'https://graph.facebook.com/v21.0';

// Rate limiting configuration
const RATE_LIMITS = {
  pages_show_list: { calls: 5, interval: 60000 }, // 5 calls per minute
  pages_read_engagement: { calls: 5, interval: 60000 },
  ads_read: { calls: 10, interval: 60000 }, // Higher limit for read operations
  ads_management: { calls: 3, interval: 60000 }, // Lower limit for write operations
};

async function makeApiCall(url: string, accessToken: string): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.text();
      return { success: false, error: `HTTP ${response.status}: ${errorData}` };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

async function performPagesActivity(accessToken: string, adAccountId: string) {
  const activities = [];
  
  // 1. pages_show_list - List user's pages
  const pagesUrl = `${GRAPH_API_BASE}/me/accounts?fields=id,name,category,access_token&limit=25`;
  const pagesResult = await makeApiCall(pagesUrl, accessToken);
  activities.push({
    permission: 'pages_show_list',
    endpoint: '/me/accounts',
    success: pagesResult.success,
    error: pagesResult.error,
    timestamp: new Date().toISOString()
  });

  // 2. pages_read_engagement - Read page insights and posts
  if (pagesResult.success && pagesResult.data?.data?.length > 0) {
    const pageId = pagesResult.data.data[0].id;
    
    // Get page insights
    const insightsUrl = `${GRAPH_API_BASE}/${pageId}/insights?metric=page_impressions,page_reach,page_engaged_users&period=day&since=${Math.floor(Date.now() / 1000) - 86400}&until=${Math.floor(Date.now() / 1000)}`;
    const insightsResult = await makeApiCall(insightsUrl, accessToken);
    activities.push({
      permission: 'pages_read_engagement',
      endpoint: `/${pageId}/insights`,
      success: insightsResult.success,
      error: insightsResult.error,
      timestamp: new Date().toISOString()
    });

    // Get page posts
    const postsUrl = `${GRAPH_API_BASE}/${pageId}/posts?fields=id,message,created_time,insights&limit=10`;
    const postsResult = await makeApiCall(postsUrl, accessToken);
    activities.push({
      permission: 'pages_read_engagement',
      endpoint: `/${pageId}/posts`,
      success: postsResult.success,
      error: postsResult.error,
      timestamp: new Date().toISOString()
    });
  }

  return activities;
}

async function performAdsReadActivity(accessToken: string, adAccountId: string) {
  const activities = [];
  
  // 3. ads_read - Read ad account data
  const adAccountUrl = `${GRAPH_API_BASE}/${adAccountId}?fields=id,name,account_status,currency,timezone_name`;
  const accountResult = await makeApiCall(adAccountUrl, accessToken);
  activities.push({
    permission: 'ads_read',
    endpoint: `/${adAccountId}`,
    success: accountResult.success,
    error: accountResult.error,
    timestamp: new Date().toISOString()
  });

  // Get campaigns
  const campaignsUrl = `${GRAPH_API_BASE}/${adAccountId}/campaigns?fields=id,name,status,objective,created_time&limit=25`;
  const campaignsResult = await makeApiCall(campaignsUrl, accessToken);
  activities.push({
    permission: 'ads_read',
    endpoint: `/${adAccountId}/campaigns`,
    success: campaignsResult.success,
    error: campaignsResult.error,
    timestamp: new Date().toISOString()
  });

  // Get ad sets
  const adsetsUrl = `${GRAPH_API_BASE}/${adAccountId}/adsets?fields=id,name,status,campaign_id,daily_budget&limit=25`;
  const adsetsResult = await makeApiCall(adsetsUrl, accessToken);
  activities.push({
    permission: 'ads_read',
    endpoint: `/${adAccountId}/adsets`,
    success: adsetsResult.success,
    error: adsetsResult.error,
    timestamp: new Date().toISOString()
  });

  // Get ads
  const adsUrl = `${GRAPH_API_BASE}/${adAccountId}/ads?fields=id,name,status,adset_id,creative&limit=25`;
  const adsResult = await makeApiCall(adsUrl, accessToken);
  activities.push({
    permission: 'ads_read',
    endpoint: `/${adAccountId}/ads`,
    success: adsResult.success,
    error: adsResult.error,
    timestamp: new Date().toISOString()
  });

  // Get insights
  const insightsUrl = `${GRAPH_API_BASE}/${adAccountId}/insights?fields=impressions,clicks,spend,reach,frequency,cpc,cpm,ctr&level=account&time_range={'since':'${Math.floor(Date.now() / 1000) - 86400}','until':'${Math.floor(Date.now() / 1000)}'}`;
  const insightsResult = await makeApiCall(insightsUrl, accessToken);
  activities.push({
    permission: 'ads_read',
    endpoint: `/${adAccountId}/insights`,
    success: insightsResult.success,
    error: insightsResult.error,
    timestamp: new Date().toISOString()
  });

  return activities;
}

async function performAdsManagementActivity(accessToken: string, adAccountId: string) {
  const activities = [];
  
  // 4. ads_management - Create test campaigns/ad sets (paused)
  const campaignData = {
    name: `Test Campaign ${Date.now()}`,
    objective: 'OUTCOME_LEADS',
    status: 'PAUSED',
    special_ad_categories: []
  };

  const campaignUrl = `${GRAPH_API_BASE}/${adAccountId}/campaigns`;
  const campaignResponse = await fetch(campaignUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(campaignData),
  });

  const campaignResult = await campaignResponse.json();
  activities.push({
    permission: 'ads_management',
    endpoint: `/${adAccountId}/campaigns`,
    success: campaignResponse.ok,
    error: campaignResponse.ok ? null : campaignResult.error?.message,
    timestamp: new Date().toISOString()
  });

  // If campaign created successfully, create a test ad set
  if (campaignResponse.ok && campaignResult.id) {
    const adSetData = {
      name: `Test Ad Set ${Date.now()}`,
      campaign_id: campaignResult.id,
      optimization_goal: 'LEAD_GENERATION',
      billing_event: 'IMPRESSIONS',
      bid_amount: '1000',
      daily_budget: '1000',
      status: 'PAUSED',
      targeting: {
        geo_locations: {
          countries: ['US']
        },
        age_min: 25,
        age_max: 65
      }
    };

    const adSetUrl = `${GRAPH_API_BASE}/${adAccountId}/adsets`;
    const adSetResponse = await fetch(adSetUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(adSetData),
    });

    const adSetResult = await adSetResponse.json();
    activities.push({
      permission: 'ads_management',
      endpoint: `/${adAccountId}/adsets`,
      success: adSetResponse.ok,
      error: adSetResponse.ok ? null : adSetResult.error?.message,
      timestamp: new Date().toISOString()
    });
  }

  return activities;
}

export async function GET(request: NextRequest) {
  try {
    console.log('🚀 Starting comprehensive Facebook API activity...');

    // Get all users with Facebook integrations
    const users = await executeQuery(`
      SELECT ui.user_id, ui.access_token, uaa.ad_account_id 
      FROM user_integrations ui
      LEFT JOIN user_ad_accounts uaa ON ui.user_id = uaa.user_id
      WHERE ui.provider = 'facebook' 
      AND ui.access_token IS NOT NULL 
      AND ui.access_token != ''
      LIMIT 10
    `);

    if (!Array.isArray(users) || users.length === 0) {
      console.log('❌ No Facebook integrations found');
      return NextResponse.json({ 
        success: false, 
        message: 'No Facebook integrations found',
        activities: []
      });
    }

    const allActivities = [];

    for (const user of users) {
      const { user_id, access_token, ad_account_id } = user as any;
      
      if (!access_token) continue;

      console.log(`📊 Processing user ${user_id}...`);

      try {
        // Decrypt access token
        const crypto = require('crypto');
        const algorithm = 'aes-256-cbc';
        const key = Buffer.from(process.env.ENCRYPTION_KEY || '', 'hex');
        
        const decipher = crypto.createDecipheriv(algorithm, key, Buffer.from(access_token.slice(0, 32), 'hex'));
        let decrypted = decipher.update(access_token.slice(32), 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        // Use the ad account ID or default to a test account
        const accountId = ad_account_id || 'act_855360417470686';

        // Perform activities for each permission
        const pagesActivities = await performPagesActivity(decrypted, accountId);
        const adsReadActivities = await performAdsReadActivity(decrypted, accountId);
        const adsManagementActivities = await performAdsManagementActivity(decrypted, accountId);

        const userActivities = [
          ...pagesActivities,
          ...adsReadActivities,
          ...adsManagementActivities
        ].map(activity => ({
          ...activity,
          user_id,
          ad_account_id: accountId
        }));

        allActivities.push(...userActivities);

        // Log to database
        for (const activity of userActivities) {
          await executeQuery(`
            INSERT INTO facebook_daily_activity 
            (user_id, permission, endpoint, success, error_message, ad_account_id, created_at)
            VALUES (?, ?, ?, ?, ?, ?, NOW())
          `, [
            user_id,
            activity.permission,
            activity.endpoint,
            activity.success ? 1 : 0,
            activity.error || null,
            accountId
          ]);
        }

        console.log(`✅ User ${user_id}: ${userActivities.length} API calls completed`);

        // Rate limiting delay between users
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (error) {
        console.error(`❌ Error processing user ${user_id}:`, error);
        allActivities.push({
          user_id,
          permission: 'error',
          endpoint: 'user_processing',
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        });
      }
    }

    const successCount = allActivities.filter(a => a.success).length;
    const totalCount = allActivities.length;

    console.log(`🎯 Comprehensive activity complete: ${successCount}/${totalCount} successful calls`);

    return NextResponse.json({
      success: true,
      message: `Comprehensive Facebook API activity completed`,
      total_calls: totalCount,
      successful_calls: successCount,
      failed_calls: totalCount - successCount,
      activities: allActivities,
      permissions_covered: ['pages_show_list', 'pages_read_engagement', 'ads_read', 'ads_management']
    });

  } catch (error) {
    console.error('❌ Comprehensive Facebook activity error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      activities: []
    }, { status: 500 });
  }
}
