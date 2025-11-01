// Test simple campaign creation via our API
async function testSimpleCampaign() {
  try {
    const response = await fetch('http://localhost:3000/api/facebook/create-campaign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        campaignName: 'Simple Test Campaign',
        adSetName: 'Simple Test Ad Set',
        adName: 'Simple Test Ad',
        lifetimeBudget: 50,
        adAccountId: '1982133785186174',
        pageId: '1967231336900858',
        targeting: {
          locations: [], // NO LOCATIONS
          interests: [], // NO INTERESTS  
          demographics: { minAge: 25, maxAge: 65 }
        },
        headline: 'Test Headline',
        primaryText: 'Test primary text',
        callToAction: 'SHOP_NOW',
        destination: 'vsp',
        selectedVehicles: [{ id: 'test-vehicle' }]
      })
    });
    
    const result = await response.json();
    console.log('📊 API Response:', result);
    
    if (result.success) {
      console.log('🎉 SUCCESS! Campaign created with minimal targeting!');
    } else {
      console.log('❌ Failed:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testSimpleCampaign();
