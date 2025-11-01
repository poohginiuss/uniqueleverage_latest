import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/mysql';

const GRAPH_API_BASE = 'https://graph.facebook.com/v21.0';

// Different activity strategies to rotate through
const ACTIVITY_STRATEGIES = [
  'comprehensive_read', // Read all data
  'insights_focused',    // Focus on insights and analytics
  'campaign_management', // Create/manage campaigns
  'audience_research',   // Research audiences and interests
  'creative_testing'     // Test creative operations
];

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

async function comprehensiveReadStrategy(accessToken: string, adAccountId: string) {
  const activities = [];
  
  // Read account info
  const accountUrl = `${GRAPH_API_BASE}/${adAccountId}?fields=id,name,account_status,currency,timezone_name,amount_spent,balance`;
  const accountResult = await makeApiCall(accountUrl, accessToken);
  activities.push({ permission: 'ads_read', endpoint: 'account_info', success: accountResult.success, error: accountResult.error });

  // Read campaigns with detailed fields
  const campaignsUrl = `${GRAPH_API_BASE}/${adAccountId}/campaigns?fields=id,name,status,objective,created_time,updated_time,start_time,stop_time,budget_remaining&limit=50`;
  const campaignsResult = await makeApiCall(campaignsUrl, accessToken);
  activities.push({ permission: 'ads_read', endpoint: 'campaigns_detailed', success: campaignsResult.success, error: campaignsResult.error });

  // Read ad sets with detailed fields
  const adsetsUrl = `${GRAPH_API_BASE}/${adAccountId}/adsets?fields=id,name,status,campaign_id,daily_budget,lifetime_budget,bid_amount,optimization_goal,targeting&limit=50`;
  const adsetsResult = await makeApiCall(adsetsUrl, accessToken);
  activities.push({ permission: 'ads_read', endpoint: 'adsets_detailed', success: adsetsResult.success, error: adsetsResult.error });

  // Read ads with detailed fields
  const adsUrl = `${GRAPH_API_BASE}/${adAccountId}/ads?fields=id,name,status,adset_id,creative,effective_status&limit=50`;
  const adsResult = await makeApiCall(adsUrl, accessToken);
  activities.push({ permission: 'ads_read', endpoint: 'ads_detailed', success: adsResult.success, error: adsResult.error });

  return activities;
}

async function insightsFocusedStrategy(accessToken: string, adAccountId: string) {
  const activities = [];
  
  // Account-level insights
  const accountInsightsUrl = `${GRAPH_API_BASE}/${adAccountId}/insights?fields=impressions,clicks,spend,reach,frequency,cpc,cpm,ctr,cpp,ctr&level=account&time_range={'since':'${Math.floor(Date.now() / 1000) - 2592000}','until':'${Math.floor(Date.now() / 1000)}'}`;
  const accountInsightsResult = await makeApiCall(accountInsightsUrl, accessToken);
  activities.push({ permission: 'ads_read', endpoint: 'account_insights', success: accountInsightsResult.success, error: accountInsightsResult.error });

  // Campaign-level insights
  const campaignInsightsUrl = `${GRAPH_API_BASE}/${adAccountId}/campaigns?fields=insights{impressions,clicks,spend,reach,frequency,cpc,cpm,ctr}&limit=25`;
  const campaignInsightsResult = await makeApiCall(campaignInsightsUrl, accessToken);
  activities.push({ permission: 'ads_read', endpoint: 'campaign_insights', success: campaignInsightsResult.success, error: campaignInsightsResult.error });

  // Ad set-level insights
  const adsetInsightsUrl = `${GRAPH_API_BASE}/${adAccountId}/adsets?fields=insights{impressions,clicks,spend,reach,frequency,cpc,cpm,ctr}&limit=25`;
  const adsetInsightsResult = await makeApiCall(adsetInsightsUrl, accessToken);
  activities.push({ permission: 'ads_read', endpoint: 'adset_insights', success: adsetInsightsResult.success, error: adsetInsightsResult.error });

  // Ad-level insights
  const adInsightsUrl = `${GRAPH_API_BASE}/${adAccountId}/ads?fields=insights{impressions,clicks,spend,reach,frequency,cpc,cpm,ctr}&limit=25`;
  const adInsightsResult = await makeApiCall(adInsightsUrl, accessToken);
  activities.push({ permission: 'ads_read', endpoint: 'ad_insights', success: adInsightsResult.success, error: adInsightsResult.error });

  return activities;
}

async function campaignManagementStrategy(accessToken: string, adAccountId: string) {
  const activities = [];
  
  // Create a test campaign
  const campaignData = {
    name: `API Test Campaign ${Date.now()}`,
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
    endpoint: 'create_campaign', 
    success: campaignResponse.ok, 
    error: campaignResponse.ok ? null : campaignResult.error?.message 
  });

  // If campaign created, create ad set
  if (campaignResponse.ok && campaignResult.id) {
    const adSetData = {
      name: `API Test Ad Set ${Date.now()}`,
      campaign_id: campaignResult.id,
      optimization_goal: 'LEAD_GENERATION',
      billing_event: 'IMPRESSIONS',
      bid_amount: '1000',
      daily_budget: '1000',
      status: 'PAUSED',
      targeting: {
        geo_locations: { countries: ['US'] },
        age_min: 25,
        age_max: 65,
        interests: [{ id: '6003107902433', name: 'Automotive' }]
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
      endpoint: 'create_adset', 
      success: adSetResponse.ok, 
      error: adSetResponse.ok ? null : adSetResult.error?.message 
    });
  }

  return activities;
}

async function audienceResearchStrategy(accessToken: string, adAccountId: string) {
  const activities = [];
  
  // Search for interests
  const interestsUrl = `${GRAPH_API_BASE}/search?type=adinterest&q=automotive&limit=25`;
  const interestsResult = await makeApiCall(interestsUrl, accessToken);
  activities.push({ permission: 'ads_read', endpoint: 'search_interests', success: interestsResult.success, error: interestsResult.error });

  // Search for demographics
  const demographicsUrl = `${GRAPH_API_BASE}/${adAccountId}/insights?fields=impressions,clicks,spend&breakdowns=age,gender&level=account&time_range={'since':'${Math.floor(Date.now() / 1000) - 2592000}','until':'${Math.floor(Date.now() / 1000)}'}`;
  const demographicsResult = await makeApiCall(demographicsUrl, accessToken);
  activities.push({ permission: 'ads_read', endpoint: 'demographics_breakdown', success: demographicsResult.success, error: demographicsResult.error });

  // Search for locations
  const locationsUrl = `${GRAPH_API_BASE}/search?type=adgeolocation&q=United States&location_types=['country']`;
  const locationsResult = await makeApiCall(locationsUrl, accessToken);
  activities.push({ permission: 'ads_read', endpoint: 'search_locations', success: locationsResult.success, error: locationsResult.error });

  return activities;
}

async function creativeTestingStrategy(accessToken: string, adAccountId: string) {
  const activities = [];
  
  // Get ad creatives
  const creativesUrl = `${GRAPH_API_BASE}/${adAccountId}/adcreatives?fields=id,name,object_story_spec,body,image_url&limit=25`;
  const creativesResult = await makeApiCall(creativesUrl, accessToken);
  activities.push({ permission: 'ads_read', endpoint: 'ad_creatives', success: creativesResult.success, error: creativesResult.error });

  // Get ad images
  const imagesUrl = `${GRAPH_API_BASE}/${adAccountId}/adimages?fields=id,name,url,width,height&limit=25`;
  const imagesResult = await makeApiCall(imagesUrl, accessToken);
  activities.push({ permission: 'ads_read', endpoint: 'ad_images', success: imagesResult.success, error: imagesResult.error });

  // Get ad videos
  const videosUrl = `${GRAPH_API_BASE}/${adAccountId}/advideos?fields=id,name,source,length&limit=25`;
  const videosResult = await makeApiCall(videosUrl, accessToken);
  activities.push({ permission: 'ads_read', endpoint: 'ad_videos', success: videosResult.success, error: videosResult.error });

  return activities;
}

export async function GET(request: NextRequest) {
  try {
    const strategy = request.nextUrl.searchParams.get('strategy') || 'comprehensive_read';
    console.log(`🚀 Starting Facebook API activity with strategy: ${strategy}`);

    // Get all users with Facebook integrations
    const users = await executeQuery(`
      SELECT ui.user_id, ui.access_token, uaa.ad_account_id 
      FROM user_integrations ui
      LEFT JOIN user_ad_accounts uaa ON ui.user_id = uaa.user_id
      WHERE ui.provider = 'facebook' 
      AND ui.access_token IS NOT NULL 
      AND ui.access_token != ''
      LIMIT 5
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

      console.log(`📊 Processing user ${user_id} with strategy: ${strategy}`);

      try {
        // Decrypt access token
        const crypto = require('crypto');
        const algorithm = 'aes-256-cbc';
        const key = Buffer.from(process.env.ENCRYPTION_KEY || '', 'hex');
        
        const decipher = crypto.createDecipheriv(algorithm, key, Buffer.from(access_token.slice(0, 32), 'hex'));
        let decrypted = decipher.update(access_token.slice(32), 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        const accountId = ad_account_id || 'act_855360417470686';

        // Execute strategy
        let activities = [];
        switch (strategy) {
          case 'comprehensive_read':
            activities = await comprehensiveReadStrategy(decrypted, accountId);
            break;
          case 'insights_focused':
            activities = await insightsFocusedStrategy(decrypted, accountId);
            break;
          case 'campaign_management':
            activities = await campaignManagementStrategy(decrypted, accountId);
            break;
          case 'audience_research':
            activities = await audienceResearchStrategy(decrypted, accountId);
            break;
          case 'creative_testing':
            activities = await creativeTestingStrategy(decrypted, accountId);
            break;
          default:
            activities = await comprehensiveReadStrategy(decrypted, accountId);
        }

        const userActivities = activities.map(activity => ({
          ...activity,
          user_id,
          ad_account_id: accountId,
          strategy,
          timestamp: new Date().toISOString()
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

        console.log(`✅ User ${user_id}: ${userActivities.length} API calls completed with ${strategy}`);

        // Rate limiting delay between users
        await new Promise(resolve => setTimeout(resolve, 3000));

      } catch (error) {
        console.error(`❌ Error processing user ${user_id}:`, error);
        allActivities.push({
          user_id,
          permission: 'error',
          endpoint: 'user_processing',
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          strategy,
          timestamp: new Date().toISOString()
        });
      }
    }

    const successCount = allActivities.filter(a => a.success).length;
    const totalCount = allActivities.length;

    console.log(`🎯 ${strategy} activity complete: ${successCount}/${totalCount} successful calls`);

    return NextResponse.json({
      success: true,
      message: `Facebook API activity completed with ${strategy} strategy`,
      strategy,
      total_calls: totalCount,
      successful_calls: successCount,
      failed_calls: totalCount - successCount,
      activities: allActivities
    });

  } catch (error) {
    console.error('❌ Facebook activity error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      activities: []
    }, { status: 500 });
  }
}
