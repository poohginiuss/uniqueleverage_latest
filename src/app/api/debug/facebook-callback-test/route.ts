import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Test if we can access the Facebook callback endpoint
    const testUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/facebook/callback?code=test&state=test`;
    
    return NextResponse.json({
      success: true,
      message: "Facebook callback test endpoint created",
      testUrl,
      environment: {
        baseUrl: process.env.NEXT_PUBLIC_BASE_URL,
        facebookAppId: process.env.FACEBOOK_APP_ID ? "Set" : "Not Set",
        encryptionKey: process.env.ENCRYPTION_KEY ? "Set" : "Not Set"
      }
    });
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message,
      success: false 
    }, { status: 500 });
  }
}
