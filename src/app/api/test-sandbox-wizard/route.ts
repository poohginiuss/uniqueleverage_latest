import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    // This simulates what your marketing wizard would do with sandbox account
    console.log('🧪 Testing Marketing Wizard with Sandbox Account...');
    
    // Your sandbox account ID
    const SANDBOX_ACCOUNT_ID = "855360417470686";
    
    // Simulate the marketing wizard data structure
    const wizardData = {
      adAccountId: SANDBOX_ACCOUNT_ID,
      campaignName: 'Single Image VSP Conversions (Ad Wizard)',
      adSetName: 'Default (Ad Wizard)', 
      adName: 'Vehicle Title to VSP',
      lifetimeBudget: 50,
      targeting: {
        demographics: { minAge: 25, maxAge: 65 },
        locations: [{ type: 'country', key: 'US' }],
        interests: [
          { name: 'SUVs' },
          { name: 'Trucks' }
        ]
      }
    };
    
    console.log('📊 Wizard Data:', wizardData);
    
    // This would call your existing create-campaign API with sandbox account
    const response = await fetch('http://localhost:3000/api/facebook/create-campaign', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(wizardData)
    });
    
    const result = await response.json();
    console.log('📊 Marketing Wizard Result:', result);
    
    return NextResponse.json({
      success: true,
      message: 'Marketing wizard test completed',
      wizardData,
      result
    });
    
  } catch (error) {
    console.error('❌ Marketing wizard test error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Test failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
