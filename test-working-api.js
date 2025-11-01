// Test the working Facebook API approach we used before
const { createTestCampaign, createTestAdSet } = require('./src/lib/facebookAdHelpers.ts');

async function testWorkingAPI() {
  try {
    console.log('🧪 Testing Working Facebook API...');
    
    // Use the same approach that worked before
    const adAccountId = '1982133785186174';
    const accessToken = 'YOUR_ACCESS_TOKEN'; // We need to get this from database
    
    // First, let's get the access token from the database
    console.log('Getting access token from database...');
    
    // Test with minimal targeting that we know works
    const targeting = {
      age_min: 25,
      age_max: 65,
      geo_locations: {
        countries: ['US'] // Simple country targeting that works
      }
    };
    
    console.log('🎯 Using minimal targeting:', targeting);
    
    // This is the approach that worked before
    console.log('✅ Ready to test - need access token from database');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testWorkingAPI();
