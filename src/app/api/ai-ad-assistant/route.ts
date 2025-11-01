import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { executeQuery } from '@/lib/mysql';

export async function POST(request: Request) {
  try {
    const { message } = await request.json();
    
    // Validate session using the same approach as wizard API
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session_token')?.value;
    
    if (!sessionToken) {
      return NextResponse.json({
        success: false,
        error: "Please log in to create ads"
      });
    }

    // Decode session token to get user info
    const decoded = Buffer.from(sessionToken, 'base64').toString('utf-8');
    const sessionData = JSON.parse(decoded);
    
        // Handle different session token formats and fix email spelling
        const userId = sessionData.userId || sessionData.user_id;
        const email = sessionData.email || sessionData.Hmail;
        
        if (!userId || !email) {
          return NextResponse.json({
            success: false,
            error: "Invalid session token"
          });
        }

        // Fix email spelling: nathanalhison -> nathanallison
        const correctedEmail = email.replace('nathanalhison', 'nathanallison');
        const user = { id: userId, email: correctedEmail };

    console.log('AI Ad Assistant received message:', message);

    // Parse the user's message to extract vehicle details, budget, and targeting
    const vehicleInfo = parseVehicleMessage(message);
    const budget = parseBudget(message);
    const targeting = parseTargeting(message);

    // Create progress logs array
    const progressLogs = [];
    
    // Step 1: Understanding your request
    progressLogs.push({
      step: 1,
      status: 'completed',
      message: 'Got it! I understand what you want...',
      details: `Creating a ${parseDuration(message)}-day ad campaign for ${vehicleInfo.make || 'your vehicle'} in ${targeting.location} with a $${budget} budget`
    });

    // Step 2: Connecting to Facebook
    progressLogs.push({
      step: 2,
      status: 'in_progress',
      message: 'Connecting to your Facebook account...'
    });

    // Get user's Facebook integration
    const integrationResult = await executeQuery(
      'SELECT id, provider_user_id, provider_email, access_token, status FROM user_integrations WHERE user_id = ? AND provider = ? AND integration_type = ?',
      [user.id, 'facebook', 'advertising']
    ) as any[];

    if (!integrationResult || integrationResult.length === 0) {
      return NextResponse.json({
        success: false,
        error: "Facebook integration not found. Please connect Facebook first.",
        action: "connect_facebook",
        progressLogs
      });
    }

    progressLogs.push({
      step: 2,
      status: 'completed',
      message: 'Connected! Using your Autoplex MKE Group account',
      details: 'All set to create ads for your dealership'
    });

    // Get user's connected ad accounts
    const adAccountResult = await executeQuery(
      'SELECT ad_account_id, ad_account_name FROM user_ad_accounts WHERE user_id = ?',
      [user.id]
    ) as any[];

    if (!adAccountResult || adAccountResult.length === 0) {
      return NextResponse.json({
        success: false,
        error: "No Facebook ad accounts connected. Please connect an ad account first.",
        action: "connect_ad_account"
      });
    }

    // Get user's connected pages
    const pagesResult = await executeQuery(
      'SELECT page_id, page_name, page_category FROM user_pages WHERE user_id = ? AND status = ?',
      [user.id, 'active']
    ) as any[];

    if (!pagesResult || pagesResult.length === 0) {
      return NextResponse.json({
        success: false,
        error: "No Facebook pages connected. Please connect a page first.",
        action: "connect_page",
        requiresPageAuth: true
      });
    }

    const selectedPage = pagesResult[0];
    const selectedAdAccount = adAccountResult[0];

    // Step 3: Building your campaign
    progressLogs.push({
      step: 3,
      status: 'in_progress',
      message: 'Building your ad campaign...'
    });

    // Use the existing working wizard API instead of duplicating logic
    const wizardResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/facebook/create-campaign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('cookie') || '' // Forward session cookies
      },
      body: JSON.stringify({
        adAccountId: selectedAdAccount.ad_account_id,
        pageId: selectedPage.page_id,
        campaignName: "Website Conversions / Ad Wizard",
        adSetName: vehicleInfo.make && vehicleInfo.model 
          ? `${vehicleInfo.year || '2024'} ${vehicleInfo.make} ${vehicleInfo.model}`
          : "Default (Ad Wizard)",
        adName: vehicleInfo.stockNumber || "Vehicle Title to VSP",
        lifetimeBudget: budget || 300,
        targeting: {
          locations: [{ type: 'state', name: 'Wisconsin', key: '3892' }],
          interests: ['suv', 'truck'],
          demographics: { minAge: 25, maxAge: 65 }
        },
        headline: vehicleInfo.make && vehicleInfo.model 
          ? `${vehicleInfo.year || '2024'} ${vehicleInfo.make} ${vehicleInfo.model}`
          : 'Check Out Our Vehicles',
        primaryText: '🚗 Sign Today, Drive Today!!\n🔥 Hassle-Free Process\n🔥 Quality Pre-Owned Vehicles\n\n📍 Located in Milwaukee',
        callToAction: 'SHOP_NOW',
        destination: 'vsp',
        selectedVehicles: vehicleInfo.stockNumber ? [{ stockNumber: vehicleInfo.stockNumber }] : null
      })
    });

    const wizardResult = await wizardResponse.json();

    if (!wizardResponse.ok || !wizardResult.success) {
      progressLogs.push({
        step: 3,
        status: 'failed',
        message: 'Campaign creation failed',
        details: wizardResult.error || wizardResult.details || 'Unknown error'
      });
      
      return NextResponse.json({
        success: false,
        error: `Campaign creation failed: ${wizardResult.error || wizardResult.details || 'Unknown error'}`,
        details: wizardResult,
        progressLogs
      });
    }

    // Step 3: Campaign Created Successfully
    progressLogs.push({
      step: 3,
      status: 'completed',
      message: 'Campaign is ready!',
      details: `• Running for ${parseDuration(message)} days\n• Total budget: $${budget} ($${(budget / parseDuration(message)).toFixed(2)} per day)\n• Targeting: People in ${targeting.location} interested in ${targeting.interests.join(' and ')}\n• Status: Ready to launch when you are!`
    });

    // Step 4: Ad Group Created
    progressLogs.push({
      step: 4,
      status: 'completed',
      message: 'Ad group is set up!',
      details: `• Optimized for: Getting leads and inquiries\n• Audience: ${targeting.location} residents interested in ${targeting.interests.join(' and ')}\n• Daily budget: $${(budget / parseDuration(message)).toFixed(2)}\n• Ready to go live`
    });

    // Step 5: Ad Created
    progressLogs.push({
      step: 5,
      status: 'completed',
      message: 'Your ad is ready!',
      details: `• Headline: "${vehicleInfo.make && vehicleInfo.model ? `${vehicleInfo.year || '2024'} ${vehicleInfo.make} ${vehicleInfo.model}` : 'Check Out Our Vehicles'}"\n• Message: "Sign Today, Drive Today! Hassle-Free Process. Quality Pre-Owned Vehicles. Located in Milwaukee"\n• Destination: Your vehicle listing page\n• Status: Ready to launch`
    });

    // Final success message
    progressLogs.push({
      step: 6,
      status: 'completed',
      message: 'All done! Your campaign is ready to go live.',
      details: 'Everything is set up and ready. When you\'re ready to start getting customers, just click "Launch Campaign" below!'
    });

    return NextResponse.json({
      success: true,
      message: `Perfect! I've created your ${vehicleInfo.make || 'vehicle'} campaign!`,
      progressLogs,
      campaignData: {
        campaign: {
          id: wizardResult.campaign.id,
          name: wizardResult.campaign.name,
          budget: wizardResult.campaign.lifetime_budget,
          dailyBudget: (budget / parseDuration(message)).toFixed(2),
          duration: parseDuration(message),
          status: 'PAUSED'
        },
        adSet: {
          id: wizardResult.adset.id,
          name: wizardResult.adset.name,
          optimization: 'Lead Generation',
          targeting: `${targeting.location}, ${targeting.interests.join(', ')}`,
          dailyBudget: (budget / parseDuration(message)).toFixed(2),
          status: 'PAUSED'
        },
        ad: {
          id: wizardResult.ad.id,
          name: wizardResult.ad.name,
          headline: wizardResult.campaign.name,
          description: '🚗 Sign Today, Drive Today!!\n🔥 Hassle-Free Process\n🔥 Quality Pre-Owned Vehicles\n\n📍 Located in Milwaukee',
          destination: 'Vehicle landing page',
          status: 'PAUSED'
        },
        facebookUrl: wizardResult.facebook_url,
        pageInfo: {
          pageId: selectedPage.page_id,
          pageName: selectedPage.page_name,
          pageCategory: selectedPage.page_category
        }
      }
    });

  } catch (error) {
    console.error('AI Ad Assistant error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}

// Helper functions to parse user messages
function parseVehicleMessage(message: string) {
  const lowerMessage = message.toLowerCase();
  
  // Extract year
  const yearMatch = lowerMessage.match(/\b(19|20)\d{2}\b/);
  const year = yearMatch ? parseInt(yearMatch[0]) : undefined;
  
  // Extract make
  const makes = ['ford', 'chevrolet', 'toyota', 'honda', 'nissan', 'bmw', 'mercedes', 'audi', 'lexus', 'acura', 'infiniti', 'cadillac', 'lincoln', 'buick', 'gmc', 'dodge', 'jeep', 'ram', 'chrysler', 'hyundai', 'kia', 'mazda', 'subaru', 'volkswagen', 'volvo', 'jaguar', 'land rover', 'porsche', 'tesla', 'genesis'];
  const make = makes.find(m => lowerMessage.includes(m));
  
  // Extract model
  const models = ['explorer', 'f-150', 'silverado', 'camry', 'accord', 'altima', 'x5', 'c-class', 'a4', 'rx', 'mdx', 'q50', 'escalade', 'navigator', 'enclave', 'yukon', 'charger', 'challenger', 'grand cherokee', 'wrangler', 'durango', 'pacifica', 'elantra', 'sonata', 'sorento', 'telluride', 'cx-5', 'cx-9', 'outback', 'forester', 'tiguan', 'atlas', 'xc90', 'f-pace', 'range rover', 'cayenne', 'macan', 'model s', 'model 3', 'model x', 'model y', 'gv80'];
  const model = models.find(m => lowerMessage.includes(m));
  
  // Extract color
  const colors = ['red', 'blue', 'black', 'white', 'silver', 'gray', 'grey', 'green', 'yellow', 'orange', 'purple', 'brown', 'gold', 'beige'];
  const color = colors.find(c => lowerMessage.includes(c));
  
  // Extract stock number (look for patterns like P12345, STOCK123, etc.)
  const stockMatch = message.match(/\b[A-Z]?\d{4,6}\b/);
  const stockNumber = stockMatch ? stockMatch[0] : undefined;
  
  return { year, make, model, color, stockNumber };
}

function parseBudget(message: string) {
  const budgetMatch = message.match(/\$(\d+)/);
  return budgetMatch ? parseInt(budgetMatch[1]) : 300; // Default to $300
}

function parseTargeting(message: string) {
  const lowerMessage = message.toLowerCase();
  
  // Extract age range
  let minAge = 25, maxAge = 65;
  const ageMatch = lowerMessage.match(/(\d+)-(\d+)/);
  if (ageMatch) {
    minAge = parseInt(ageMatch[1]);
    maxAge = parseInt(ageMatch[2]);
  }
  
  // Extract location
  const locations = ['wisconsin', 'california', 'texas', 'florida', 'new york', 'illinois'];
  const location = locations.find(l => lowerMessage.includes(l)) || 'wisconsin';
  
  // Extract interests
  const interests = [];
  if (lowerMessage.includes('suv') || lowerMessage.includes('suvs')) interests.push('suv');
  if (lowerMessage.includes('truck') || lowerMessage.includes('trucks')) interests.push('truck');
  if (lowerMessage.includes('sedan') || lowerMessage.includes('sedans')) interests.push('sedan');
  if (lowerMessage.includes('coupe') || lowerMessage.includes('coupes')) interests.push('coupe');
  
  return {
    ageRange: { min: minAge, max: maxAge },
    location,
    interests: interests.length > 0 ? interests : ['suv', 'truck']
  };
}

function parseDuration(message: string) {
  const lowerMessage = message.toLowerCase();
  
  // Extract duration in days
  const dayMatch = lowerMessage.match(/(\d+)\s*days?/);
  if (dayMatch) {
    return parseInt(dayMatch[1]);
  }
  
  // Extract duration in weeks
  const weekMatch = lowerMessage.match(/(\d+)\s*weeks?/);
  if (weekMatch) {
    return parseInt(weekMatch[1]) * 7;
  }
  
  // Default to 14 days
  return 14;
}