import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUserFromSession } from "@/lib/auth-utils";
import { executeQuery } from "@/lib/mysql";

// This is a playground version of the campaign creation API
// It uses the same logic but doesn't interfere with production

export async function POST(request: Request) {
  try {
    console.log('🎮 Playground campaign creation started...');
    
    // Get session cookie
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session_token');
    
    if (!sessionCookie) {
      return NextResponse.json({ error: 'No session found' }, { status: 401 });
    }

    // Get user from session
    const user = await getUserFromSession(sessionCookie.value);
    if (!user) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const body = await request.json();
    console.log('🎮 Playground request body:', body);

    // Simulate the same logic but with playground prefix
    const campaignData = {
      name: `[PLAYGROUND] ${body.campaignName || 'Test Campaign'}`,
      objective: body.objective || 'OUTCOME_LEADS',
      status: 'PAUSED', // Always paused in playground
      special_ad_categories: 'NONE'
    };

    // Log to database for tracking
    try {
      await executeQuery(`
        INSERT INTO facebook_daily_activity (date, activities, success_count, error_count)
        VALUES (CURDATE(), ?, 1, 0)
        ON DUPLICATE KEY UPDATE
        activities = JSON_MERGE_PATCH(COALESCE(activities, '{}'), ?),
        success_count = success_count + 1,
        updated_at = CURRENT_TIMESTAMP
      `, [
        JSON.stringify({ type: 'playground_campaign_creation', data: campaignData }),
        JSON.stringify({ type: 'playground_campaign_creation', data: campaignData })
      ]);
    } catch (dbError) {
      console.log('⚠️ Playground database logging failed:', dbError);
    }

    console.log('🎮 Playground campaign creation completed successfully');

    return NextResponse.json({
      success: true,
      message: 'Playground campaign creation completed (simulated)',
      playground: true,
      data: {
        campaign: campaignData,
        user: user.email,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('❌ Playground campaign creation failed:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Playground campaign creation failed',
      playground: true,
      details: error.message 
    }, { status: 500 });
  }
}

