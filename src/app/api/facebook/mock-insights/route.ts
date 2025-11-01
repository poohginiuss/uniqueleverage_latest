import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Mock Facebook Insights data for screencast demonstration
const MOCK_CAMPAIGN_DATA = {
  campaigns: [
    {
      id: "120234125841160089",
      name: "Ford SUV Promo",
      status: "ACTIVE",
      created_time: "2024-01-15T10:30:00Z",
      insights: {
        impressions: 18245,
        clicks: 327,
        spend: 146.30,
        conversions: 12,
        reach: 11832,
        ctr: 1.79,
        cpc: 0.45,
        cpm: 8.02,
        conversion_rate: 3.67
      },
      daily_breakdown: [
        { date: "2024-01-15", impressions: 1200, clicks: 22, spend: 9.80, conversions: 1 },
        { date: "2024-01-16", impressions: 1350, clicks: 25, spend: 11.20, conversions: 1 },
        { date: "2024-01-17", impressions: 1180, clicks: 21, spend: 9.50, conversions: 0 },
        { date: "2024-01-18", impressions: 1420, clicks: 28, spend: 12.60, conversions: 2 },
        { date: "2024-01-19", impressions: 1680, clicks: 32, spend: 14.40, conversions: 2 },
        { date: "2024-01-20", impressions: 1950, clicks: 38, spend: 17.10, conversions: 3 },
        { date: "2024-01-21", impressions: 2100, clicks: 42, spend: 18.90, conversions: 3 }
      ]
    },
    {
      id: "120234125841160090",
      name: "Toyota Truck Campaign",
      status: "ACTIVE",
      created_time: "2024-01-10T14:20:00Z",
      insights: {
        impressions: 15680,
        clicks: 289,
        spend: 132.50,
        conversions: 8,
        reach: 9876,
        ctr: 1.84,
        cpc: 0.46,
        cpm: 8.45,
        conversion_rate: 2.77
      },
      daily_breakdown: [
        { date: "2024-01-15", impressions: 1100, clicks: 20, spend: 9.20, conversions: 1 },
        { date: "2024-01-16", impressions: 1250, clicks: 23, spend: 10.50, conversions: 0 },
        { date: "2024-01-17", impressions: 1080, clicks: 19, spend: 8.70, conversions: 1 },
        { date: "2024-01-18", impressions: 1320, clicks: 25, spend: 11.50, conversions: 1 },
        { date: "2024-01-19", impressions: 1580, clicks: 30, spend: 13.80, conversions: 2 },
        { date: "2024-01-20", impressions: 1850, clicks: 35, spend: 16.10, conversions: 2 },
        { date: "2024-01-21", impressions: 2000, clicks: 38, spend: 17.40, conversions: 1 }
      ]
    },
    {
      id: "120234125841160091",
      name: "Honda Sedan Special",
      status: "PAUSED",
      created_time: "2024-01-05T09:15:00Z",
      insights: {
        impressions: 9876,
        clicks: 156,
        spend: 78.40,
        conversions: 5,
        reach: 6543,
        ctr: 1.58,
        cpc: 0.50,
        cpm: 7.94,
        conversion_rate: 3.21
      },
      daily_breakdown: [
        { date: "2024-01-15", impressions: 800, clicks: 12, spend: 6.00, conversions: 0 },
        { date: "2024-01-16", impressions: 950, clicks: 15, spend: 7.50, conversions: 1 },
        { date: "2024-01-17", impressions: 820, clicks: 13, spend: 6.50, conversions: 0 },
        { date: "2024-01-18", impressions: 1050, clicks: 17, spend: 8.50, conversions: 1 },
        { date: "2024-01-19", impressions: 1200, clicks: 19, spend: 9.50, conversions: 1 },
        { date: "2024-01-20", impressions: 1350, clicks: 22, spend: 11.00, conversions: 1 },
        { date: "2024-01-21", impressions: 1500, clicks: 25, spend: 12.50, conversions: 1 }
      ]
    }
  ],
  account_summary: {
    total_impressions: 43801,
    total_clicks: 772,
    total_spend: 357.20,
    total_conversions: 25,
    total_reach: 28251,
    average_ctr: 1.76,
    average_cpc: 0.46,
    average_cpm: 8.15,
    average_conversion_rate: 3.24
  }
};

export async function GET(request: Request) {
  try {
    // Validate session
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session_token')?.value;
    
    if (!sessionToken) {
      return NextResponse.json({
        success: false,
        error: "Please log in to view campaign data"
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('campaign_id');
    const datePreset = searchParams.get('date_preset') || 'last_7d';
    const fields = searchParams.get('fields') || 'impressions,clicks,spend,conversions,reach';

    console.log('Mock Insights API called:', { campaignId, datePreset, fields });

    // If specific campaign requested
    if (campaignId) {
      const campaign = MOCK_CAMPAIGN_DATA.campaigns.find(c => c.id === campaignId);
      if (!campaign) {
        return NextResponse.json({
          success: false,
          error: "Campaign not found"
        }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        data: {
          campaign: {
            id: campaign.id,
            name: campaign.name,
            status: campaign.status,
            created_time: campaign.created_time
          },
          insights: campaign.insights,
          daily_breakdown: campaign.daily_breakdown,
          date_preset: datePreset,
          fields: fields.split(',')
        }
      });
    }

    // Return all campaigns data
    return NextResponse.json({
      success: true,
      data: {
        campaigns: MOCK_CAMPAIGN_DATA.campaigns.map(campaign => ({
          id: campaign.id,
          name: campaign.name,
          status: campaign.status,
          created_time: campaign.created_time,
          insights: campaign.insights
        })),
        account_summary: MOCK_CAMPAIGN_DATA.account_summary,
        date_preset: datePreset,
        fields: fields.split(',')
      }
    });

  } catch (error) {
    console.error('Mock Insights API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}
