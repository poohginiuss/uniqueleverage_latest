import { NextRequest, NextResponse } from 'next/server';
import { testGmailAccess } from '@/lib/google-oauth';

export async function POST(request: NextRequest) {
  try {
    const { accessToken } = await request.json();
    
    if (!accessToken) {
      return NextResponse.json({ error: 'No access token provided' }, { status: 400 });
    }

    const result = await testGmailAccess(accessToken);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Gmail token test error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
