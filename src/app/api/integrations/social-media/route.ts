import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { executeQuery } from "@/lib/mysql";
import crypto from "crypto";

const GRAPH_API_BASE = "https://graph.facebook.com/v20.0";

// Decryption function - more robust key handling
function decrypt(encryptedText: string, key: string): string {
  const [ivHex, encrypted] = encryptedText.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  
  // Always treat key as base64, pad if needed
  let keyBuffer: Buffer;
  try {
    keyBuffer = Buffer.from(key, 'base64');
  } catch {
    // If not valid base64, convert to base64 first
    const base64Key = Buffer.from(key, 'utf8').toString('base64');
    keyBuffer = Buffer.from(base64Key, 'base64');
  }
  
  // Ensure key is exactly 32 bytes for AES-256
  if (keyBuffer.length !== 32) {
    keyBuffer = crypto.createHash('sha256').update(keyBuffer).digest();
  }
  
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
      return NextResponse.json({ error: 'No session token found' }, { status: 401 });
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

    if (!integrations || integrations.length === 0) {
      return NextResponse.json({
        success: true,
        facebookProfile: null,
        connectedAdAccounts: [],
        availableAdAccounts: [],
        connectedPages: [],
        message: "No Facebook integration found"
      });
    }

    const integration = integrations[0];
    
    // Decrypt access token
    const encryptionKey = process.env.ENCRYPTION_KEY!;
    let accessToken: string;
    try {
      accessToken = decrypt(integration.access_token, encryptionKey);
    } catch (error) {
      console.error('Failed to decrypt access token:', error);
      // If decryption fails, the token is likely corrupted or encrypted with a different key
      // Return empty arrays to indicate the integration needs to be reconnected
      return NextResponse.json({
        success: true,
        facebookProfile: null,
        connectedAdAccounts: [],
        availableAdAccounts: [],
        connectedPages: [],
        message: "Facebook integration needs to be reconnected (token decryption failed)"
      });
    }

    // Helper function for Facebook API requests
    async function fbRequest(endpoint: string, options: RequestInit = {}) {
      const res = await fetch(`${GRAPH_API_BASE}/${endpoint}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        ...options,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Unknown error");
      return data;
    }

    // Get connected ad accounts from database (only the ones user actually connected)
    let connectedAdAccounts: any[] = [];
    try {
      const dbAdAccounts = await executeQuery(
        'SELECT ad_account_id, ad_account_name FROM user_ad_accounts WHERE user_id = ? AND platform = ?',
        [userId, 'facebook']
      ) as any[];

      if (dbAdAccounts && dbAdAccounts.length > 0) {
        // Get additional details from Facebook API for the connected accounts
        const adAccountsResponse = await fbRequest('me/adaccounts?fields=id,name,account_id,account_status');
        const allFacebookAccounts = adAccountsResponse.data;
        
        // Only include accounts that are both in our database AND in Facebook
        connectedAdAccounts = dbAdAccounts
          .map(dbAccount => {
            const facebookAccount = allFacebookAccounts.find((fb: any) => fb.account_id === dbAccount.ad_account_id);
            if (facebookAccount) {
              return {
                id: facebookAccount.id,
                accountId: facebookAccount.account_id,
                name: facebookAccount.name,
                status: facebookAccount.account_status === 1 ? 'active' : 'inactive'
              };
            }
            return null;
          })
          .filter(account => account !== null);
      }
    } catch (error) {
      console.error('Error fetching connected ad accounts:', error);
    }

    // Get connected pages from Facebook API
    let connectedPages: any[] = [];
    try {
      const pagesResponse = await fbRequest('me/accounts?fields=id,name,category,access_token');
      connectedPages = pagesResponse.data.map((page: any) => ({
        id: page.id,
        pageId: page.id,
        name: page.name,
        category: page.category,
        accessToken: page.access_token
      }));
    } catch (error) {
      console.error('Error fetching pages:', error);
    }

    // Get Facebook profile information
    let facebookProfile: any = null;
    try {
      const profileResponse = await fbRequest('me?fields=id,name,email');
      facebookProfile = {
        id: profileResponse.id,
        name: profileResponse.name,
        email: profileResponse.email
      };
    } catch (error) {
      console.error('Error fetching Facebook profile:', error);
    }

    // Get all available ad accounts from Facebook (for the "available" section)
    let availableAdAccounts: any[] = [];
    try {
      const adAccountsResponse = await fbRequest('me/adaccounts?fields=id,name,account_id,account_status');
      const allFacebookAccounts = adAccountsResponse.data.map((account: any) => ({
        id: account.id,
        accountId: account.account_id,
        name: account.name,
        status: account.account_status === 1 ? 'active' : 'inactive'
      }));
      
      // Available accounts are all Facebook accounts minus the connected ones
      const connectedAccountIds = connectedAdAccounts.map((acc: any) => acc.accountId);
      availableAdAccounts = allFacebookAccounts.filter((account: any) => 
        !connectedAccountIds.includes(account.accountId)
      );
    } catch (error) {
      console.error('Error fetching available ad accounts:', error);
    }

    return NextResponse.json({
      success: true,
      facebookProfile,
      connectedAdAccounts,
      availableAdAccounts,
      connectedPages,
      integration: {
        id: integration.id,
        provider_user_id: integration.provider_user_id,
        provider_email: integration.provider_email,
        status: integration.status
      }
    });
  } catch (err: any) {
    console.error("Error fetching social media integrations:", err);
    return NextResponse.json({ 
      error: err.message,
      stack: err.stack 
    }, { status: 500 });
  }
}