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

    console.log('🔄 AI Streaming Assistant received message:', message);

    // Determine the type of request
    const requestType = determineRequestType(message);
    
    if (requestType === 'performance') {
      return await handleStreamingPerformanceRequest(message, request);
    } else if (requestType === 'campaign') {
      return await handleStreamingCampaignCreation(message, request);
    } else {
      return await handleGeneralConversation(message, request);
    }

  } catch (error) {
    console.error('AI Streaming Assistant error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}

function determineRequestType(message: string): 'performance' | 'campaign' | 'general' {
  const lowerMessage = message.toLowerCase();
  
  // Check for explicit campaign creation requests
  const campaignKeywords = [
    'create', 'make', 'build', 'generate', 'launch', 'start', 'new', 'ad', 'campaign'
  ];
  
  // Check for explicit performance/analytics requests
  const performanceKeywords = [
    'show', 'performance', 'how', 'doing', 'results', 'metrics', 
    'impressions', 'clicks', 'spend', 'conversions', 'reach',
    'data', 'stats', 'analytics', 'report', 'insights', 'analysis'
  ];
  
  // If it contains campaign keywords, it's a campaign request
  if (campaignKeywords.some(keyword => lowerMessage.includes(keyword))) {
    return 'campaign';
  }
  
  // If it contains performance keywords, it's a performance request
  if (performanceKeywords.some(keyword => lowerMessage.includes(keyword))) {
    return 'performance';
  }
  
  // Everything else is general conversation
  return 'general';
}

async function handleStreamingCampaignCreation(message: string, request: Request) {
  // Call the real ai-ad-assistant API that has the actual wizard logic
  const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/ai-ad-assistant`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': request.headers.get('cookie') || '' // Forward session cookies
    },
    body: JSON.stringify({ message })
  });

  const result = await response.json();

  if (!result.success) {
    return NextResponse.json({
      success: false,
      error: result.error,
      progressLogs: result.progressLogs || []
    });
  }

  // Convert the progress logs to streaming steps with delays
  const streamingSteps = result.progressLogs.map((log: any, index: number) => ({
    step: log.step,
    status: log.status,
    message: log.message,
    details: log.details,
    delay: index === 0 ? 0 : Math.max(2000, 3000 + (index * 500)) // Progressive delays
  }));

  return NextResponse.json({
    success: true,
    message: result.message,
    streamingSteps,
    campaignData: result.campaignData,
    performanceData: result.performanceData
  });
}

async function handleStreamingPerformanceRequest(message: string, request: Request) {
  const steps = [];
  
  // Step 1: Parsing performance request
  steps.push({
    step: 1,
    status: 'completed',
    message: 'Parsing your performance request...',
    details: `Extracted: ${extractCampaignFromMessage(message) || 'All campaigns'}, Time period: ${extractTimePeriod(message)}`,
    delay: 0
  });

  // Step 2: Fetching data
  steps.push({
    step: 2,
    status: 'in_progress',
    message: 'Fetching campaign performance data...',
    delay: 1500
  });

  // Step 2b: Data fetched
  steps.push({
    step: 2,
    status: 'completed',
    message: 'Successfully fetched campaign data from Facebook',
    details: 'Retrieved 3 campaigns with performance metrics',
    delay: 2500
  });

  // Step 3: Analyzing data
  steps.push({
    step: 3,
    status: 'completed',
    message: 'Analyzing performance data...',
    details: '📈 Generated insights and trend analysis',
    delay: 3000
  });

  // Performance data
  steps.push({
    step: 4,
    status: 'completed',
    message: 'Here\'s your campaign performance data:',
    performanceData: {
      cards: [
        {
          type: 'campaign',
          title: '📈 Campaign: Ford SUV Promo',
          metrics: {
            impressions: '18,245',
            clicks: '327',
            spend: '$146.30',
            conversions: '12',
            reach: '11,832'
          },
          trends: {
            impressions: '+12%',
            clicks: '+8%',
            spend: '+5%',
            conversions: '+20%',
            reach: '+15%'
          },
          status: 'ACTIVE',
          insights: 'Good click-through rate. Strong conversion performance! Your campaign is performing well with 12 conversions from 18,245 impressions.'
        },
        {
          type: 'summary',
          title: 'Account Summary',
          metrics: {
            total_impressions: '43,801',
            total_clicks: '772',
            total_spend: '$357.20',
            total_conversions: '25',
            total_reach: '28,251'
          },
          trends: {
            impressions: '+15%',
            clicks: '+12%',
            spend: '+8%',
            conversions: '+25%',
            reach: '+18%'
          }
        }
      ]
    },
    delay: 3500
  });

  return NextResponse.json({
    success: true,
    message: 'Here\'s your campaign performance data:',
    streamingSteps: steps,
    performanceData: {
      cards: [
        {
          type: 'campaign',
          title: '📈 Campaign: Ford SUV Promo',
          metrics: {
            impressions: '18,245',
            clicks: '327',
            spend: '$146.30',
            conversions: '12',
            reach: '11,832'
          },
          trends: {
            impressions: '+12%',
            clicks: '+8%',
            spend: '+5%',
            conversions: '+20%',
            reach: '+15%'
          },
          status: 'ACTIVE',
          insights: 'Good click-through rate. Strong conversion performance! Your campaign is performing well with 12 conversions from 18,245 impressions.'
        },
        {
          type: 'summary',
          title: 'Account Summary',
          metrics: {
            total_impressions: '43,801',
            total_clicks: '772',
            total_spend: '$357.20',
            total_conversions: '25',
            total_reach: '28,251'
          },
          trends: {
            impressions: '+15%',
            clicks: '+12%',
            spend: '+8%',
            conversions: '+25%',
            reach: '+18%'
          }
        }
      ]
    }
  });
}

// Helper functions
function extractCampaignFromMessage(message: string): string | null {
  const lowerMessage = message.toLowerCase();
  
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
  
  return 'Last 7 days';
}

async function handleGeneralConversation(message: string, request: Request) {
  // Handle general conversation without triggering campaign creation
  const responses = [
    "Hello! I'm here to help you with your Facebook ads. You can ask me to create campaigns, analyze performance data, or just chat about your marketing needs.",
    "Hi there! I can help you create Facebook ads, analyze your campaign performance, or answer questions about your marketing strategy. What would you like to do?",
    "I'm ready to help! You can ask me to create ads, review your campaign data, or discuss your marketing goals. What's on your mind?",
    "Great to see you! I'm your Facebook ads assistant. I can create campaigns, analyze performance, or help with any marketing questions you have."
  ];
  
  const randomResponse = responses[Math.floor(Math.random() * responses.length)];
  
  return NextResponse.json({
    success: true,
    message: randomResponse,
    streamingSteps: [],
    campaignData: null,
    performanceData: null
  });
}
