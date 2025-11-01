import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { executeQuery } from "@/lib/mysql";
import crypto from "crypto";

// Decryption function
function decrypt(encryptedText: string, key: string): string {
  const [ivHex, encrypted] = encryptedText.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const keyBuffer = key.includes('=') ? Buffer.from(key, 'base64') : Buffer.from(key, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', keyBuffer, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

export async function GET() {
  try {
    // Get user session
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session_token')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Decode session token to get user email
    const decoded = Buffer.from(sessionToken, 'base64').toString('utf-8');
    const { email } = JSON.parse(decoded);

    // Get user ID
    const users = await executeQuery('SELECT id FROM users WHERE email = ?', [email]) as any[];

    if (!users || users.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userId = users[0].id;

    // Get Facebook integration
    const integrations = await executeQuery(
      'SELECT id, provider_user_id, provider_email, access_token, status FROM user_integrations WHERE user_id = ? AND provider = ? AND integration_type = ?',
      [userId, 'facebook', 'advertising']
    ) as any[];

    // Get connected ad accounts
    const connectedAccounts = await executeQuery(
      'SELECT id, ad_account_id, ad_account_name, platform, status FROM user_ad_accounts WHERE user_id = ? AND status = ?',
      [userId, 'active']
    ) as any[];

    // Get connected pages
    const connectedPages = await executeQuery(
      'SELECT id, page_id, page_name, page_category, platform, status FROM user_pages WHERE user_id = ? AND status = ?',
      [userId, 'active']
    ) as any[];

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        email: email
      },
      facebook_integration: integrations.length > 0 ? {
        id: integrations[0].id,
        provider_user_id: integrations[0].provider_user_id,
        provider_email: integrations[0].provider_email,
        status: integrations[0].status,
        has_access_token: !!integrations[0].access_token
      } : null,
      connected_ad_accounts: connectedAccounts.map((account: any) => ({
        id: account.id,
        ad_account_id: account.ad_account_id,
        ad_account_name: account.ad_account_name,
        platform: account.platform,
        status: account.status
      })),
      connected_pages: connectedPages.map((page: any) => ({
        id: page.id,
        page_id: page.page_id,
        page_name: page.page_name,
        page_category: page.page_category,
        platform: page.platform,
        status: page.status
      }))
    });
  } catch (error: any) {
    console.error("Error checking connections:", error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
