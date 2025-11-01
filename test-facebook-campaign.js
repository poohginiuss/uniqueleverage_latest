const fetch = require('node-fetch');

// Test direct Facebook API campaign creation
async function testFacebookCampaign() {
  try {
    // Use your actual access token and ad account
    const accessToken = 'YOUR_ACCESS_TOKEN'; // Replace with actual token
    const adAccountId = '1982133785186174'; // Your ad account ID
    
    console.log('🧪 Testing Facebook Campaign Creation...');
    
    // 1. Create Campaign
    const campaignData = {
      name: 'Test Campaign Direct API',
      objective: 'OUTCOME_LEADS',
      status: 'PAUSED',
      daily_budget: '357', // $3.57 per day
      special_ad_categories: 'NONE'
    };
    
    console.log('📊 Creating campaign...');
    const campaignResponse = await fetch(
      `https://graph.facebook.com/v20.0/act_${adAccountId}/campaigns?access_token=${accessToken}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(campaignData)
      }
    );
    
    const campaignResult = await campaignResponse.json();
    console.log('✅ Campaign Result:', campaignResult);
    
    if (!campaignResponse.ok) {
      console.error('❌ Campaign failed:', campaignResult);
      return;
    }
    
    // 2. Create Ad Set with SIMPLIFIED targeting
    const adSetData = {
      name: 'Test Ad Set Direct API',
      campaign_id: campaignResult.id,
      optimization_goal: 'LEAD_GENERATION',
      billing_event: 'IMPRESSIONS',
      daily_budget: '357',
      status: 'PAUSED',
      // SIMPLIFIED targeting - just age and country
      targeting: JSON.stringify({
        age_min: 25,
        age_max: 65,
        geo_locations: {
          countries: ['US'] // Use simple country code instead of regions
        }
      })
    };
    
    console.log('🎯 Creating ad set...');
    const adSetResponse = await fetch(
      `https://graph.facebook.com/v20.0/act_${adAccountId}/adsets?access_token=${accessToken}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(adSetData)
      }
    );
    
    const adSetResult = await adSetResponse.json();
    console.log('✅ Ad Set Result:', adSetResult);
    
    if (!adSetResponse.ok) {
      console.error('❌ Ad Set failed:', adSetResult);
      return;
    }
    
    console.log('🎉 SUCCESS! Both campaign and ad set created successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testFacebookCampaign();
