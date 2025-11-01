import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/mysql';

export async function GET(request: NextRequest) {
  try {
    // Get all ad accounts
    const adAccounts = await executeQuery(
      'SELECT * FROM user_ad_accounts'
    ) as any[];

    return NextResponse.json({
      success: true,
      count: adAccounts.length,
      accounts: adAccounts
    });

  } catch (error: any) {
    console.error('Error fetching ad accounts:', error);
    return NextResponse.json({
      error: error.message
    }, { status: 500 });
  }
}

