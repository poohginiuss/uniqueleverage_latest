import { NextResponse } from "next/server";

const GRAPH_API_BASE = "https://graph.facebook.com/v20.0";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const adId = searchParams.get('adId');
    
    if (!adId) {
      return NextResponse.json({ error: 'Ad ID is required' }, { status: 400 });
    }

    const ACCESS_TOKEN = "EAAFrsCQ5TCkBPotDH55utPzK0ZAPsWB4VOU5GroXZCGZBwKCJMtseH4esQYZBDUh09XhMw5tZAM3DaBbWO8HGgeQu3mgjkzEXzwe5xjyMXlqGZAbxTLgTRRlKVXtg4c7uMWsAmWnsyMroFotvM1IFRAb3i1LLp8lTf2DgIzxCQ8Mo4neybGZATKEdmBGs5EPE3NKrUZA";
    
    console.log(`🔍 Checking campaign details for AD ID: ${adId}`);
    
    // Get the ad details
    const adResponse = await fetch(`${GRAPH_API_BASE}/${adId}?fields=id,name,status,effective_status,adset_id,campaign_id,creative&access_token=${ACCESS_TOKEN}`);
    const adData = await adResponse.json();
    console.log('📊 Ad Data:', adData);
    
    if (!adResponse.ok) {
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch ad details',
        details: adData 
      }, { status: 500 });
    }
    
    // Get the ad set details
    const adSetResponse = await fetch(`${GRAPH_API_BASE}/${adData.adset_id}?fields=id,name,status,effective_status,campaign_id,daily_budget,lifetime_budget,optimization_goal,targeting,bid_amount&access_token=${ACCESS_TOKEN}`);
    const adSetData = await adSetResponse.json();
    console.log('📊 Ad Set Data:', adSetData);
    
    // Get the campaign details
    const campaignResponse = await fetch(`${GRAPH_API_BASE}/${adData.campaign_id}?fields=id,name,status,effective_status,objective,special_ad_categories,lifetime_budget,daily_budget&access_token=${ACCESS_TOKEN}`);
    const campaignData = await campaignResponse.json();
    console.log('📊 Campaign Data:', campaignData);
    
    // Get the creative details
    const creativeResponse = await fetch(`${GRAPH_API_BASE}/${adData.creative.id}?fields=id,name,object_story_spec,effective_object_story_id&access_token=${ACCESS_TOKEN}`);
    const creativeData = await creativeResponse.json();
    console.log('📊 Creative Data:', creativeData);
    
    return NextResponse.json({
      success: true,
      ad: adData,
      adSet: adSetData,
      campaign: campaignData,
      creative: creativeData
    });
    
  } catch (error) {
    console.error('❌ Error checking campaign:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
