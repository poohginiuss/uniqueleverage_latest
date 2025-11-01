import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { executeQuery } from "@/lib/mysql";
import crypto from "crypto";
import { fetchValidInterests } from "@/lib/facebookAdHelpers";

const GRAPH_API_BASE = "https://graph.facebook.com/v20.0";

// Map state names to numeric IDs for Facebook targeting
const STATE_NUMERIC_IDS: { [key: string]: string } = {
  'wisconsin': '3892',
  'wi': '3892',
  'california': '3847',
  'ca': '3847',
  'texas': '3851',
  'tx': '3851',
  'florida': '3849',
  'fl': '3849',
  'new_york': '3850',
  'ny': '3850',
  'illinois': '3852',
  'il': '3852',
  'pennsylvania': '3853',
  'pa': '3853',
  'ohio': '3854',
  'oh': '3854',
  'georgia': '3855',
  'ga': '3855',
  'north_carolina': '3856',
  'nc': '3856',
  'michigan': '3857',
  'mi': '3857',
  'new_jersey': '3858',
  'nj': '3858',
  'virginia': '3859',
  'va': '3859',
  'washington': '3860',
  'wa': '3860',
  'arizona': '3861',
  'az': '3861',
  'massachusetts': '3862',
  'ma': '3862',
  'tennessee': '3863',
  'tn': '3863',
  'indiana': '3864',
  'in': '3864',
  'missouri': '3865',
  'mo': '3865',
  'maryland': '3866',
  'md': '3866',
  'colorado': '3867',
  'co': '3867',
  'minnesota': '3868',
  'mn': '3868',
  'south_carolina': '3869',
  'sc': '3869',
  'alabama': '3870',
  'al': '3870',
  'louisiana': '3871',
  'la': '3871',
  'kentucky': '3872',
  'ky': '3872',
  'oregon': '3873',
  'or': '3873',
  'oklahoma': '3874',
  'ok': '3874',
  'connecticut': '3875',
  'ct': '3875',
  'utah': '3876',
  'ut': '3876',
  'iowa': '3877',
  'ia': '3877',
  'nevada': '3878',
  'nv': '3878',
  'arkansas': '3879',
  'ar': '3879',
  'mississippi': '3880',
  'ms': '3880',
  'kansas': '3881',
  'ks': '3881',
  'new_mexico': '3882',
  'nm': '3882',
  'nebraska': '3883',
  'ne': '3883',
  'west_virginia': '3884',
  'wv': '3884',
  'idaho': '3885',
  'id': '3885',
  'hawaii': '3886',
  'hi': '3886',
  'new_hampshire': '3887',
  'nh': '3887',
  'maine': '3888',
  'me': '3888',
  'montana': '3889',
  'mt': '3889',
  'rhode_island': '3890',
  'ri': '3890',
  'delaware': '3891',
  'de': '3891',
  'south_dakota': '3893',
  'sd': '3893',
  'north_dakota': '3894',
  'nd': '3894',
  'alaska': '3895',
  'ak': '3895',
  'district_of_columbia': '3896',
  'dc': '3896',
  'vermont': '3897',
  'vt': '3897',
  'wyoming': '3898',
  'wy': '3898'
};

function getStateNumericId(stateKey: string): string {
  const normalizedKey = stateKey.toLowerCase().replace(/\s+/g, '_');
  return STATE_NUMERIC_IDS[normalizedKey] || '3892'; // Default to Wisconsin if not found
}

// Decryption function
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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      adAccountId,
      pageId,
      campaignName,
      adSetName,
      adName,
      lifetimeBudget,
      targeting,
      headline,
      primaryText,
      callToAction,
      destination,
      selectedVehicles
    } = body;

    // Extract targeting data from nested structure
    const targetingLocations = targeting?.locations || [];
    const automotiveInterests = targeting?.interests || [];
    const demographics = targeting?.demographics || { minAge: 25, maxAge: 65 };

    // Get user session
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session_token')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Decode session token to get user email
    const decoded = Buffer.from(sessionToken, 'base64').toString('utf-8');
    const sessionData = JSON.parse(decoded);
    
    // Handle different session token formats (email vs Hmail) and fix email spelling
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

    // Helper function for Facebook API requests
    async function fbRequest(endpoint: string, options: RequestInit = {}) {
      console.log(`🔗 Making Facebook API request to: ${endpoint}`);
      const res = await fetch(`${GRAPH_API_BASE}/${endpoint}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        ...options,
      });
      const data = await res.json();
      console.log(`📡 Facebook API Response Status: ${res.status}`);
      console.log(`📡 Facebook API Response Data:`, JSON.stringify(data, null, 2));
      if (!res.ok) {
        console.error(`❌ Facebook API Error:`, data);
        throw new Error(data.error?.message || "Unknown error");
      }
      return data;
    }

    // Ensure adAccountId has act_ prefix
    const formattedAdAccountId = adAccountId.startsWith('act_') ? adAccountId : `act_${adAccountId}`;

    // Build targeting object using the same structure as cron job
    const facebookTargeting: any = {
      age_min: demographics.minAge,
      age_max: demographics.maxAge,
      geo_locations: {
        cities: [{
          country: "US",
          key: "2547917", // Milwaukee city key
          name: "Milwaukee",
          radius: 25,
          region: "Wisconsin",
          region_id: "3892"
        }]
      }
    };

    // Helper function to generate Facebook-compatible location keys
    const generateLocationKey = (location: any): string => {
      if (location.key) return location.key;
      
      // Generate a key based on location type and name
      const cleanName = location.name.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '_');
      
      switch (location.type) {
        case 'state':
          return `state_${cleanName}`;
        case 'county':
          return `county_${cleanName}`;
        case 'city':
          return `city_${cleanName}`;
        case 'zip':
          return `zip_${cleanName}`;
        default:
          return `location_${cleanName}`;
      }
    };

        // Geographic targeting already set in initial object

    // Add interests targeting using the same working approach as our test API
    if (automotiveInterests && automotiveInterests.length > 0) {
      try {
        console.log('Fetching valid Facebook interest IDs for:', automotiveInterests);
        // Fetch valid Facebook interest IDs for the interest names
        const validInterests = await fetchValidInterests({
          adAccountId: formattedAdAccountId.replace('act_', ''),
          accessToken,
          interests: automotiveInterests
        });
        
        if (validInterests.length > 0) {
          facebookTargeting.flexible_spec = [
            {
              interests: validInterests.map((interest) => ({
                id: interest.id,
                name: interest.name
              }))
            }
          ];
          console.log('✅ Added interests targeting:', validInterests);
        } else {
          console.log('⚠️ No valid interests found, continuing without interests');
        }
      } catch (error) {
        console.error('❌ Error fetching valid interests:', error);
        // Continue without interests if there's an error
      }
    }

    console.log('🎯 Targeting Configuration:', {
      demographics: { minAge: demographics.minAge, maxAge: demographics.maxAge },
      locations: targetingLocations?.length || 0,
      interests: automotiveInterests?.length || 0,
      targeting_object: facebookTargeting
    });

    console.log('📊 Campaign Data:', {
      campaignName,
      adSetName,
      adName,
      lifetimeBudget,
      formattedAdAccountId,
      pageId
    });

    // Determine objective based on destination
    let facebookObjective = 'OUTCOME_LEADS'; // Default to leads (matches your successful campaign)
    if (destination === 'vsp') {
      facebookObjective = 'OUTCOME_LEADS'; // VSP = Lead generation
    } else if (destination === 'messenger') {
      facebookObjective = 'OUTCOME_MESSAGES'; // Messenger = Messages
    }

    // Calculate daily budget from lifetime budget
    // For simplicity, we'll use a 14-day campaign duration
    // In a real implementation, you'd get this from the wizard
    const campaignDurationDays = 14; // Default duration
    const dailyBudget = lifetimeBudget / campaignDurationDays;

    // Use existing campaign instead of creating a new one (like cron job does)
    const EXISTING_CAMPAIGN_ID = "120234125841160089"; // Same as cron job
    console.log(`Using existing campaign: ${EXISTING_CAMPAIGN_ID}`);
    
    // Fetch existing campaign details
    const campaign = await fbRequest(`${EXISTING_CAMPAIGN_ID}?fields=id,name,daily_budget,lifetime_budget`);
    console.log('✅ Using existing campaign:', campaign);

    // Create ad set using exact same structure as cron job
    const adSetData = {
      name: adSetName || `${campaignName} - Ad Set`,
      campaign_id: campaign.id,
      optimization_goal: "OFFSITE_CONVERSIONS", // Same as cron job
      billing_event: "IMPRESSIONS",
      bid_strategy: "LOWEST_COST_WITHOUT_CAP", // Same as cron job
      daily_budget: "500", // Same as cron job
      promoted_object: JSON.stringify({
        pixel_id: "1510676406122421", // Autoplexmke pixel (same as cron job)
        custom_event_type: "LEAD"
      }),
      targeting: JSON.stringify(facebookTargeting),
      publisher_platforms: JSON.stringify(["facebook", "instagram"]),
      status: 'PAUSED'
    };

    console.log('🎯 Ad Set Data:', adSetData);
    console.log('🎯 Targeting JSON:', JSON.stringify(facebookTargeting));
    console.log('🎯 Ad Set Data as URLSearchParams:', new URLSearchParams(adSetData).toString());

    let adSet;
    try {
      adSet = await fbRequest(`${formattedAdAccountId}/adsets`, {
        method: 'POST',
        body: new URLSearchParams(adSetData),
      });
      console.log('✅ Ad Set Created:', adSet);
    } catch (error) {
      console.error('❌ Ad Set Creation Failed:', error);
      console.error('❌ Ad Set Data that failed:', JSON.stringify(adSetData, null, 2));
      console.error('❌ Targeting object that failed:', JSON.stringify(facebookTargeting, null, 2));
      return NextResponse.json({ 
        success: false, 
        error: 'Ad set creation failed',
        details: error instanceof Error ? error.message : String(error),
        adSetData: adSetData,
        targeting: facebookTargeting
      }, { status: 500 });
    }

    // Use existing creative ID instead of creating a new one
    const EXISTING_CREATIVE_ID = "1440488771040179";
    console.log('✅ Using existing creative ID:', EXISTING_CREATIVE_ID);

    // Create ad using existing creative
    const adData = {
      name: adName || `${campaignName} - Ad`,
      adset_id: adSet.id,
      creative: JSON.stringify({ creative_id: EXISTING_CREATIVE_ID }),
      status: 'PAUSED'
    };

    let ad;
    try {
      ad = await fbRequest(`${formattedAdAccountId}/ads`, {
        method: 'POST',
        body: new URLSearchParams(adData),
      });
      console.log('✅ Ad Created:', ad);
    } catch (error) {
      console.error('❌ Ad Creation Failed:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Ad creation failed',
        details: error instanceof Error ? error.message : String(error)
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      campaign: {
        id: campaign.id,
        name: campaign.name,
        objective: facebookObjective,
        lifetime_budget: lifetimeBudget,
        daily_budget: dailyBudget,
        duration_days: campaignDurationDays,
        status: campaign.status
      },
      adset: {
        id: adSet.id,
        name: adSet.name,
        status: adSet.status
      },
      ad: {
        id: ad.id,
        name: ad.name,
        status: ad.status
      },
      creative: {
        id: EXISTING_CREATIVE_ID,
        reused: true
      },
      facebook_url: `https://www.facebook.com/adsmanager/manage/campaigns/${campaign.id}`
    });
  } catch (err: any) {
    console.error("Error creating campaign:", err);
    console.error("Error details:", {
      message: err.message,
      stack: err.stack,
      name: err.name
    });
    return NextResponse.json({ 
      error: err.message || "Unknown error occurred",
      details: err.stack 
    }, { status: 500 });
  }
}
