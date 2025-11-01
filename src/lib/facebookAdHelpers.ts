const GRAPH_API_BASE = "https://graph.facebook.com/v20.0";

interface Interest {
  id: string;
  name: string;
  audience_size?: number;
}

interface TargetingOptions {
  countries?: string[];
  interests?: Interest[];
  ageMin?: number;
  ageMax?: number;
  geoLocations?: any;
}

interface AdSetOptions {
  adAccountId: string;
  accessToken: string;
  campaignId: string;
  targeting: any;
  dailyBudget?: number;
}

/**
 * Fetch valid interests for a specific ad account
 * Uses account-scoped targeting search endpoint
 */
export async function fetchValidInterests({
  adAccountId,
  accessToken,
  interests,
}: {
  adAccountId: string;
  accessToken: string;
  interests: string[];
}): Promise<Interest[]> {
  const validInterests: Interest[] = [];

  for (const interestName of interests) {
    try {
      const response = await fetch(
        `${GRAPH_API_BASE}/act_${adAccountId}/targetingsearch?type=adinterest&q=${encodeURIComponent(interestName)}&limit=5&access_token=${accessToken}`
      );

      const data = await response.json();

      if (response.ok && data.data && data.data.length > 0) {
        // Use the first (most relevant) result
        const interest = data.data[0];
        validInterests.push({
          id: interest.id,
          name: interest.name,
          audience_size: interest.audience_size
        });
        console.log(`✅ Found valid interest: ${interest.name} (ID: ${interest.id})`);
      } else {
        console.log(`❌ No valid interest found for: ${interestName}`);
      }
    } catch (error) {
      console.error(`Error searching for interest "${interestName}":`, error);
    }
  }

  return validInterests;
}

/**
 * Build targeting object with minimal required structure
 * Based on Facebook documentation examples
 */
export function buildTargetingObject({
  countries = ["US"],
  interests = [],
  ageMin = 25,
  ageMax = 65,
}: TargetingOptions): any {
  const targeting: any = {
    age_min: ageMin,
    age_max: ageMax,
    geo_locations: {
      countries: countries
    },
    publisher_platforms: ["facebook", "instagram"]
  };

  // Add interests if provided
  if (interests.length > 0) {
    targeting.flexible_spec = [
      {
        interests: interests.map(interest => ({
          id: interest.id,
          name: interest.name
        }))
      }
    ];
  }

  return targeting;
}

/**
 * Create a test ad set in paused state
 */
export async function createTestAdSet({
  adAccountId,
  accessToken,
  campaignId,
  targeting,
  dailyBudget = 1000, // $10 default
}: AdSetOptions): Promise<any> {
  const adSetData = {
    name: `Test Ad Set - ${new Date().toISOString()}`,
    campaign_id: campaignId,
    status: 'PAUSED',
    // Remove daily_budget - budget is set at campaign level
    billing_event: 'IMPRESSIONS',
    optimization_goal: 'OFFSITE_CONVERSIONS', // Correct for OUTCOME_LEADS campaigns
    targeting: JSON.stringify(targeting),
    publisher_platforms: JSON.stringify(["facebook", "instagram"]), // Required field
    bid_amount: '1000', // Required for LEAD_GENERATION - $10 bid cap
  };

  console.log('🎯 Ad Set Data:', adSetData);
  console.log('🎯 Targeting JSON:', JSON.stringify(targeting));
  console.log('🎯 Ad Set Data as URLSearchParams:', new URLSearchParams(adSetData).toString());

  const response = await fetch(
    `${GRAPH_API_BASE}/act_${adAccountId}/adsets?access_token=${accessToken}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(adSetData),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    console.error('Facebook API Error Details:', {
      status: response.status,
      statusText: response.statusText,
      error: data,
      requestData: adSetData
    });
    throw new Error(`Facebook API error: ${data.error?.message || 'Unknown error'}`);
  }

  return data;
}

/**
 * Create a test campaign in paused state
 */
export async function createTestCampaign({
  adAccountId,
  accessToken,
  name,
  objective = 'OUTCOME_LEADS',
  dailyBudget = 1000,
}: {
  adAccountId: string;
  accessToken: string;
  name: string;
  objective?: string;
  dailyBudget?: number;
}): Promise<any> {
  const campaignData = {
    name: name,
    objective: objective,
    status: 'PAUSED', // Start paused for safety
    daily_budget: dailyBudget.toString(), // Convert to string
    special_ad_categories: 'NONE',
  };

  const response = await fetch(
    `${GRAPH_API_BASE}/act_${adAccountId}/campaigns?access_token=${accessToken}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(campaignData),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`Facebook API error: ${data.error?.message || 'Unknown error'}`);
  }

  return data;
}
