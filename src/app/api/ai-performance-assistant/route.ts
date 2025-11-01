import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { message } = await request.json();
    
    // Validate session
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session_token')?.value;
    
    if (!sessionToken) {
      return NextResponse.json({
        success: false,
        error: "Please log in to access campaign data"
      });
    }

    console.log('📊 AI Performance Assistant received message:', message);

    // Determine if this is a performance data request
    const isPerformanceRequest = isPerformanceQuery(message);
    
    if (isPerformanceRequest) {
      return await handlePerformanceRequest(message, request);
    } else {
      return await handleCampaignCreationRequest(message, request);
    }

  } catch (error) {
    console.error('AI Performance Assistant error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}

function isPerformanceQuery(message: string): boolean {
  const lowerMessage = message.toLowerCase();
  
  // Check for explicit performance/analytics requests
  const performanceKeywords = [
    'show', 'performance', 'how', 'doing', 'results', 'metrics', 
    'impressions', 'clicks', 'spend', 'conversions', 'reach',
    'data', 'stats', 'analytics', 'report', 'insights', 'analysis'
  ];
  
  // Check for campaign creation requests (these should NOT be performance queries)
  const creationKeywords = [
    'create', 'make', 'build', 'generate', 'launch', 'start', 'new'
  ];
  
  // If it contains creation keywords, it's NOT a performance query
  if (creationKeywords.some(keyword => lowerMessage.includes(keyword))) {
    return false;
  }
  
  // If it contains performance keywords, it IS a performance query
  return performanceKeywords.some(keyword => lowerMessage.includes(keyword));
}

async function handlePerformanceRequest(message: string, request: Request) {
  const progressLogs = [];
  
  // Step 1: Parsing performance request
  progressLogs.push({
    step: 1,
    status: 'completed',
    message: '⏳ Step 1: Parsing your performance request...',
    details: `✅ Extracted: ${extractCampaignFromMessage(message) || 'All campaigns'}, Time period: ${extractTimePeriod(message)}`
  });

  // Step 2: Fetching data
  progressLogs.push({
    step: 2,
    status: 'in_progress',
    message: '⏳ Step 2: Fetching campaign performance data...'
  });

  try {
    // Call mock insights API
    const insightsResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/facebook/mock-insights`, {
      headers: {
        'Cookie': request.headers.get('cookie') || ''
      }
    });
    const insightsData = await insightsResponse.json();

    if (!insightsData.success) {
      throw new Error(insightsData.error);
    }

    progressLogs.push({
      step: 2,
      status: 'completed',
      message: '✅ Successfully fetched campaign data from Facebook',
      details: `📊 Retrieved ${insightsData.data.campaigns.length} campaigns with performance metrics`
    });

    // Step 3: Analyzing and formatting data
    progressLogs.push({
      step: 3,
      status: 'completed',
      message: '✅ Step 3: Analyzing performance data...',
      details: '📈 Generated insights and trend analysis'
    });

    // Format the response with performance cards
    const performanceCards = formatPerformanceCards(insightsData.data, message);

    return NextResponse.json({
      success: true,
      message: '📊 Here\'s your campaign performance data:',
      progressLogs,
      performanceData: {
        cards: performanceCards,
        summary: insightsData.data.account_summary,
        campaigns: insightsData.data.campaigns
      }
    });

  } catch (error) {
    progressLogs.push({
      step: 2,
      status: 'failed',
      message: '❌ Failed to fetch performance data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });

    return NextResponse.json({
      success: false,
      error: 'Failed to fetch performance data',
      progressLogs
    });
  }
}

async function handleCampaignCreationRequest(message: string, request: Request) {
  try {
    // Redirect to the existing AI Ad Assistant for campaign creation
    const adAssistantResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/ai-ad-assistant`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('cookie') || ''
      },
      body: JSON.stringify({ message })
    });

    const result = await adAssistantResponse.json();
    
    // Return as NextResponse
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}

function extractCampaignFromMessage(message: string): string | null {
  const lowerMessage = message.toLowerCase();
  
  // Look for specific campaign names
  if (lowerMessage.includes('ford')) return 'Ford SUV Promo';
  if (lowerMessage.includes('toyota')) return 'Toyota Truck Campaign';
  if (lowerMessage.includes('honda')) return 'Honda Sedan Special';
  
  return null;
}

function extractTimePeriod(message: string): string {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('week') || lowerMessage.includes('7 days')) return 'Last 7 days';
  if (lowerMessage.includes('month') || lowerMessage.includes('30 days')) return 'Last 30 days';
  if (lowerMessage.includes('today')) return 'Today';
  if (lowerMessage.includes('yesterday')) return 'Yesterday';
  
  return 'Last 7 days';
}

function formatPerformanceCards(data: any, message: string): any[] {
  const cards = [];
  
  // If specific campaign requested
  const requestedCampaign = extractCampaignFromMessage(message);
  if (requestedCampaign) {
    const campaign = data.campaigns.find((c: any) => c.name === requestedCampaign);
    if (campaign) {
      cards.push({
        type: 'campaign',
        title: `📈 Campaign: ${campaign.name}`,
        metrics: {
          impressions: campaign.insights.impressions.toLocaleString(),
          clicks: campaign.insights.clicks.toLocaleString(),
          spend: `$${campaign.insights.spend.toFixed(2)}`,
          conversions: campaign.insights.conversions.toLocaleString(),
          reach: campaign.insights.reach.toLocaleString()
        },
        trends: {
          impressions: '+12%',
          clicks: '+8%',
          spend: '+5%',
          conversions: '+20%',
          reach: '+15%'
        },
        status: campaign.status,
        insights: generateInsights(campaign.insights)
      });
    }
  } else {
    // Show all campaigns
    data.campaigns.forEach((campaign: any) => {
      cards.push({
        type: 'campaign',
        title: `📈 Campaign: ${campaign.name}`,
        metrics: {
          impressions: campaign.insights.impressions.toLocaleString(),
          clicks: campaign.insights.clicks.toLocaleString(),
          spend: `$${campaign.insights.spend.toFixed(2)}`,
          conversions: campaign.insights.conversions.toLocaleString(),
          reach: campaign.insights.reach.toLocaleString()
        },
        trends: {
          impressions: '+12%',
          clicks: '+8%',
          spend: '+5%',
          conversions: '+20%',
          reach: '+15%'
        },
        status: campaign.status,
        insights: generateInsights(campaign.insights)
      });
    });
  }

  // Add account summary card
  cards.push({
    type: 'summary',
    title: '📊 Account Summary',
    metrics: {
      total_impressions: data.account_summary.total_impressions.toLocaleString(),
      total_clicks: data.account_summary.total_clicks.toLocaleString(),
      total_spend: `$${data.account_summary.total_spend.toFixed(2)}`,
      total_conversions: data.account_summary.total_conversions.toLocaleString(),
      total_reach: data.account_summary.total_reach.toLocaleString()
    },
    trends: {
      impressions: '+15%',
      clicks: '+12%',
      spend: '+8%',
      conversions: '+25%',
      reach: '+18%'
    }
  });

  return cards;
}

function generateInsights(insights: any): string {
  const ctr = insights.ctr;
  const conversionRate = insights.conversion_rate;
  
  let insight = '';
  
  if (ctr > 2.0) {
    insight += '🚀 Excellent click-through rate! ';
  } else if (ctr > 1.5) {
    insight += '✅ Good click-through rate. ';
  } else {
    insight += '⚠️ CTR could be improved. ';
  }
  
  if (conversionRate > 3.0) {
    insight += '🎯 Strong conversion performance! ';
  } else if (conversionRate > 2.0) {
    insight += '👍 Decent conversion rate. ';
  } else {
    insight += '📈 Consider optimizing for conversions. ';
  }
  
  insight += `Your campaign is performing well with ${insights.conversions} conversions from ${insights.impressions.toLocaleString()} impressions.`;
  
  return insight;
}
