import { NextResponse } from "next/server";

const GRAPH_API_BASE = "https://graph.facebook.com/v20.0";

export async function POST(request: Request) {
  try {
    const ACCESS_TOKEN = "EAAFrsCQ5TCkBPotDH55utPzK0ZAPsWB4VOU5GroXZCGZBwKCJMtseH4esQYZBDUh09XhMw5tZAM3DaBbWO8HGgeQu3mgjkzEXzwe5xjyMXlqGZAbxTLgTRRlKVXtg4c7uMWsAmWnsyMroFotvM1IFRAb3i1LLp8lTf2DgIzxCQ8Mo4neybGZATKEdmBGs5EPE3NKrUZA";
    const SANDBOX_ACCOUNT_ID = "1982133785186174";
    
    console.log('🎨 Creating Single Image Ad Creative...');
    
    // Create a single image creative that matches your working campaign structure
    const creativeData = {
      name: 'Single Image VSP Creative',
      object_story_spec: JSON.stringify({
        page_id: '1967231336900858', // Your page ID
        link_data: {
          link: 'https://ul-cursor.onrender.com/autoplexmke', // VSP URL
          message: '🚗 Sign Today, Drive Today!!\n🔥 Hassle-Free Process\n🔥 Quality Pre-Owned Vehicles\n\n📍 Located in Milwaukee',
          name: 'Check Out Our Vehicles',
          description: 'Find your perfect vehicle today!',
          picture: 'https://ul-cursor.onrender.com/main.png', // Single image
          call_to_action: {
            type: 'SHOP_NOW'
          }
        }
      })
    };
    
    console.log('📊 Creative Data:', creativeData);
    
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
    
    return NextResponse.json({ 
      success: true, 
      creativeId: creativeResult.id,
      creativeData: creativeData,
      result: creativeResult
    });
    
  } catch (error) {
    console.error('❌ Error creating single image creative:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Creative creation failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
