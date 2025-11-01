import { NextRequest, NextResponse } from 'next/server';
import { verificationTokens } from '@/lib/verification';
import { initializeDatabase } from '@/lib/mysql';

export async function POST(request: NextRequest) {
  try {
    // Initialize database to ensure verification_tokens table exists
    await initializeDatabase();
    
    const { token } = await request.json();
    
    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    console.log('🔍 Verifying token:', token);
    
    // Check if token exists and is not expired
    const tokenData = await verificationTokens.get(token);
    console.log('📊 Token data retrieved:', tokenData);
    
    if (!tokenData) {
      console.log('❌ Token not found in database');
      return NextResponse.json(
        { error: 'Invalid verification token' },
        { status: 400 }
      );
    }

    if (Date.now() > tokenData.expires) {
      // Remove expired token
      await verificationTokens.delete(token);
      return NextResponse.json(
        { error: 'Verification token has expired' },
        { status: 400 }
      );
    }

    // Remove token after successful verification
    await verificationTokens.delete(token);

    return NextResponse.json({ 
      success: true, 
      email: tokenData.email 
    });

  } catch (error) {
    console.error('Error verifying token:', error);
    return NextResponse.json(
      { error: 'Failed to verify token' },
      { status: 500 }
    );
  }
}

