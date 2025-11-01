import { NextRequest, NextResponse } from 'next/server';
import { getGoogleAuthUrl } from '@/lib/google-oauth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { provider } = body;

    if (provider !== 'Gmail') {
      return NextResponse.json({ error: 'Only Gmail is supported currently' }, { status: 400 });
    }

    // Generate the authorization URL
    const authUrl = getGoogleAuthUrl();

    return NextResponse.json({ 
      authUrl,
      message: 'Redirect to Google OAuth'
    });

  } catch (error) {
    console.error('OAuth initiation error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate OAuth flow' },
      { status: 500 }
    );
  }
}
