import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { executeQuery } from '@/lib/mysql';
import crypto from 'crypto';

const GRAPH_API_BASE = "https://graph.facebook.com/v20.0";

function decryptAccessToken(encryptedToken: string): string {
  try {
    const key = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex');
    const [ivHex, encryptedData] = encryptedToken.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Failed to decrypt access token');
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session_token')?.value;
    
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from session
    const userResult = await executeQuery(
      'SELECT u.*, s.user_id FROM user_sessions s JOIN users u ON s.user_id = u.id WHERE s.session_token = ? AND s.expires_at > NOW()',
      [sessionToken]
    ) as any[];
    
    if (!userResult || userResult.length === 0) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }
    
    const user = userResult[0];
    
    // Get Facebook integration
    const integrationResult = await executeQuery(
      'SELECT * FROM user_integrations WHERE user_id = ? AND provider = ? AND status = ?',
      [user.id, 'facebook', 'active']
    ) as any[];
    
    if (!integrationResult || integrationResult.length === 0) {
      return NextResponse.json({ 
        error: 'Facebook integration not found',
        requiresAuth: true 
      }, { status: 401 });
    }
    
    const integration = integrationResult[0];
    const accessToken = decryptAccessToken(integration.access_token);
    
    // Fetch user's Facebook pages using pages_show_list permission
    const response = await fetch(
      `${GRAPH_API_BASE}/me/accounts?fields=id,name,category,access_token&access_token=${accessToken}`
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Facebook API error:', errorData);
      return NextResponse.json({ 
        error: `Facebook API error: ${errorData.error?.message || 'Unknown error'}`,
        requiresAuth: true 
      }, { status: 400 });
    }
    
    const pagesData = await response.json();
    
    // Get selected page from database
    const selectedPageResult = await executeQuery(
      'SELECT page_id FROM user_pages WHERE user_id = ? AND is_active = ?',
      [user.id, true]
    ) as any[];
    
    const selectedPageId = selectedPageResult.length > 0 ? selectedPageResult[0].page_id : null;
    
    return NextResponse.json({
      success: true,
      pages: pagesData.data || [],
      selectedPageId,
      totalPages: pagesData.data?.length || 0
    });
    
  } catch (error: any) {
    console.error('Pages API error:', error);
    return NextResponse.json({
      error: error.message,
      requiresAuth: true
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { pageId, pageName, pageCategory, pageAccessToken } = await request.json();
    
    // Check authentication
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session_token')?.value;
    
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from session
    const userResult = await executeQuery(
      'SELECT u.*, s.user_id FROM user_sessions s JOIN users u ON s.user_id = u.id WHERE s.session_token = ? AND s.expires_at > NOW()',
      [sessionToken]
    ) as any[];
    
    if (!userResult || userResult.length === 0) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }
    
    const user = userResult[0];
    
    // Deactivate all existing pages for this user
    await executeQuery(
      'UPDATE user_pages SET is_active = ? WHERE user_id = ?',
      [false, user.id]
    );
    
    // Insert or update the selected page
    await executeQuery(
      `INSERT INTO user_pages (user_id, page_id, page_name, page_category, access_token, is_active) 
       VALUES (?, ?, ?, ?, ?, ?) 
       ON DUPLICATE KEY UPDATE 
       page_name = VALUES(page_name), 
       page_category = VALUES(page_category), 
       access_token = VALUES(access_token), 
       is_active = VALUES(is_active)`,
      [user.id, pageId, pageName, pageCategory, pageAccessToken, true]
    );
    
    return NextResponse.json({
      success: true,
      message: `Successfully connected to ${pageName}`,
      pageId,
      pageName
    });
    
  } catch (error: any) {
    console.error('Page selection error:', error);
    return NextResponse.json({
      error: error.message
    }, { status: 500 });
  }
}
