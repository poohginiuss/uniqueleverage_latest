import { NextResponse } from "next/server";

const GRAPH_API_BASE = "https://graph.facebook.com/v20.0";

export async function POST(request: Request) {
  try {
    // Use your working Autoplex account for testing
    const SANDBOX_ACCOUNT_ID = "1982133785186174";
    const ACCESS_TOKEN = "EAAFrsCQ5TCkBPotDH55utPzK0ZAPsWB4VOU5GroXZCGZBwKCJMtseH4esQYZBDUh09XhMw5tZAM3DaBbWO8HGgeQu3mgjkzEXzwe5xjyMXlqGZAbxTLgTRRlKVXtg4c7uMWsAmWnsyMroFotvM1IFRAb3i1LLp8lTf2DgIzxCQ8Mo4neybGZATKEdmBGs5EPE3NKrUZA";
    
    // First, let's get all available ad accounts
    console.log('🔍 Getting available ad accounts...');
    const accountsResponse = await fetch(`${GRAPH_API_BASE}/me/adaccounts?fields=id,name,account_id,account_status&access_token=${ACCESS_TOKEN}`);
    const accountsResult = await accountsResponse.json();
    console.log('📊 Available Ad Accounts:', accountsResult);
    
    if (accountsResult.data && accountsResult.data.length > 0) {
      const sandboxAccount = accountsResult.data.find((account: any) => account.account_id === SANDBOX_ACCOUNT_ID);
      if (sandboxAccount) {
        console.log('✅ Found sandbox account:', sandboxAccount);
      } else {
        console.log('❌ Sandbox account not found in available accounts');
        return NextResponse.json({ 
          success: false, 
          error: 'Sandbox account not accessible',
          availableAccounts: accountsResult.data 
        }, { status: 500 });
      }
    } else {
      return NextResponse.json({ 
        success: false, 
        error: 'No ad accounts available',
        details: accountsResult 
      }, { status: 500 });
    }
    
    console.log('🧪 Testing Sandbox Campaign Creation...');
    
    // Step 1: Create Campaign
    const campaignData = {
      name: 'Sandbox Test Campaign',
      objective: 'OUTCOME_LEADS',
      status: 'PAUSED',
      special_ad_categories: 'NONE'
    };
    
    const campaignResponse = await fetch(`${GRAPH_API_BASE}/act_${SANDBOX_ACCOUNT_ID}/campaigns`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        ...campaignData,
        access_token: ACCESS_TOKEN
      })
    });
    
    const campaignResult = await campaignResponse.json();
    console.log('📊 Campaign Result:', campaignResult);
    
    if (!campaignResponse.ok) {
      return NextResponse.json({ 
        success: false, 
        error: 'Campaign creation failed',
        details: campaignResult 
      }, { status: 500 });
    }
    
    // Step 2: Create Ad Set
    const adSetData = {
      name: 'Sandbox Test Ad Set',
      campaign_id: campaignResult.id,
      daily_budget: '1000', // $10 daily budget for testing
      optimization_goal: 'LEAD_GENERATION',
      billing_event: 'IMPRESSIONS',
      targeting: JSON.stringify({
        age_min: 25,
        age_max: 65,
        geo_locations: {
          countries: ['US']
        },
        publisher_platforms: ['facebook', 'instagram'],
        flexible_spec: [{
          interests: [
            { id: '6003304473660', name: 'SUVs (vehicles)' },
            { id: '6003092882217', name: 'Trucks (vehicles)' }
          ]
        }]
      }),
      bid_amount: '1000',
      status: 'PAUSED'
    };
    
    const adSetResponse = await fetch(`${GRAPH_API_BASE}/act_${SANDBOX_ACCOUNT_ID}/adsets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        ...adSetData,
        access_token: ACCESS_TOKEN
      })
    });
    
    const adSetResult = await adSetResponse.json();
    console.log('📊 Ad Set Result:', adSetResult);
    
    if (!adSetResponse.ok) {
      return NextResponse.json({ 
        success: false, 
        error: 'Ad set creation failed',
        details: adSetResult 
      }, { status: 500 });
    }
    
    // Step 3: Create Ad Creative
    const creativeData = {
      name: 'Sandbox Test Creative',
      object_story_spec: JSON.stringify({
        page_id: '1967231336900858', // Your page ID
        link_data: {
          link: 'https://ul-cursor.onrender.com/autoplexmke',
          message: 'Check out our amazing vehicles!',
          name: 'Vehicle Specials',
          description: 'Find your perfect vehicle today!',
          picture: 'https://ul-cursor.onrender.com/main.png'
        }
      })
    };
    
    const creativeResponse = await fetch(`${GRAPH_API_BASE}/act_${SANDBOX_ACCOUNT_ID}/adcreatives`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        ...creativeData,
        access_token: ACCESS_TOKEN
      })
    });
    
    const creativeResult = await creativeResponse.json();
    console.log('📊 Creative Result:', creativeResult);
    
    if (!creativeResponse.ok) {
      return NextResponse.json({ 
        success: false, 
        error: 'Creative creation failed',
        details: creativeResult 
      }, { status: 500 });
    }
    
    // Step 4: Create Ad
    const adData = {
      name: 'Sandbox Test Ad',
      adset_id: adSetResult.id,
      creative: JSON.stringify({
        creative_id: creativeResult.id
      }),
      status: 'PAUSED'
    };
    
    const adResponse = await fetch(`${GRAPH_API_BASE}/act_${SANDBOX_ACCOUNT_ID}/ads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        ...adData,
        access_token: ACCESS_TOKEN
      })
    });
    
    const adResult = await adResponse.json();
    console.log('📊 Ad Result:', adResult);
    
    if (!adResponse.ok) {
      return NextResponse.json({ 
        success: false, 
        error: 'Ad creation failed',
        details: adResult 
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Sandbox campaign created successfully!',
      campaign: campaignResult,
      adSet: adSetResult,
      creative: creativeResult,
      ad: adResult
    });
    
  } catch (error) {
    console.error('❌ Sandbox test error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
