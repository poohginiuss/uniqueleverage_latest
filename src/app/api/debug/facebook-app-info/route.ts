import { NextResponse } from "next/server";

export async function GET() {
  try {
    const appId = process.env.FACEBOOK_APP_ID;
    const appSecret = process.env.FACEBOOK_APP_SECRET;
    
    if (!appId || !appSecret) {
      return NextResponse.json({ 
        error: "Missing Facebook app credentials",
        success: false 
      }, { status: 500 });
    }

    // Test Facebook app access
    const testUrl = `https://graph.facebook.com/v20.0/${appId}?access_token=${appId}|${appSecret}`;
    
    const response = await fetch(testUrl);
    const data = await response.json();
    
    return NextResponse.json({
      success: true,
      facebookApp: {
        id: appId,
        name: data.name || "Unknown",
        category: data.category || "Unknown",
        link: data.link || "Unknown",
        app_domains: data.app_domains || [],
        website_url: data.website_url || "Unknown",
        privacy_policy_url: data.privacy_policy_url || "Unknown",
        terms_of_service_url: data.terms_of_service_url || "Unknown"
      },
      testUrl: testUrl.replace(appSecret, '[REDACTED]')
    });
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message,
      success: false 
    }, { status: 500 });
  }
}
