import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/mysql';

export async function GET() {
  try {
    // Check user integrations for Facebook
    const integrations = await executeQuery(
      'SELECT * FROM user_integrations WHERE provider = "facebook"'
    ) as any[];

    // Check user ad accounts
    const adAccounts = await executeQuery(
      'SELECT * FROM user_ad_accounts'
    ) as any[];

    // Check user pages
    const pages = await executeQuery(
      'SELECT * FROM user_pages'
    ) as any[];

    return NextResponse.json({
      success: true,
      integrations: integrations,
      adAccounts: adAccounts,
      pages: pages,
      summary: {
        totalIntegrations: integrations.length,
        totalAdAccounts: adAccounts.length,
        totalPages: pages.length
      }
    });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({
      success: false,
      error: String(error)
    });
  }
}
