import { NextResponse } from "next/server";

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      environment: {
        facebookAppId: !!process.env.FACEBOOK_APP_ID,
        facebookAppSecret: !!process.env.FACEBOOK_APP_SECRET,
        encryptionKey: !!process.env.ENCRYPTION_KEY,
        nextPublicBaseUrl: !!process.env.NEXT_PUBLIC_BASE_URL,
        facebookAppIdLength: process.env.FACEBOOK_APP_ID?.length || 0,
        facebookAppSecretLength: process.env.FACEBOOK_APP_SECRET?.length || 0,
        encryptionKeyLength: process.env.ENCRYPTION_KEY?.length || 0,
        nextPublicBaseUrlValue: process.env.NEXT_PUBLIC_BASE_URL
      }
    });
  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}
