import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { executeQuery } from "@/lib/mysql";
import crypto from "crypto";

const GRAPH_API_BASE = "https://graph.facebook.com/v20.0";

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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const adId = searchParams.get('adId');

    if (!adId) {
      return NextResponse.json({ error: 'adId parameter is required' }, { status: 400 });
    }

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

    if (!integrations || integrations.length === 0) {
      return NextResponse.json(
        { error: "No Facebook integration found" },
        { status: 400 }
      );
    }

    const integration = integrations[0];
    
    // Decrypt access token
    const encryptionKey = process.env.ENCRYPTION_KEY!;
    let accessToken: string;
    try {
      accessToken = decrypt(integration.access_token, encryptionKey);
    } catch (error) {
      console.error('Failed to decrypt access token:', error);
      return NextResponse.json(
        { error: "Failed to decrypt access token" },
        { status: 500 }
      );
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

    // 1. Get Ad Details
    const adDetails = await fbRequest(`${adId}?fields=id,name,status,creative,effective_status,adset_id`);

    // 2. Get Creative Details
    const creativeId = adDetails.creative.id;
    const creativeDetails = await fbRequest(`${creativeId}?fields=id,name,title,body,link_url,image_url,video_id,object_story_spec,object_type,thumbnail_url,url_tags,product_set_id`);

    // 3. Get Product Set Details (if it's a dynamic ad)
    let productSetDetails = null;
    let catalogDetails = null;
    if (creativeDetails.product_set_id) {
      try {
        productSetDetails = await fbRequest(`${creativeDetails.product_set_id}?fields=id,name,product_catalog,filter`);
        // Get catalog details from product set
        if (productSetDetails.product_catalog) {
          catalogDetails = await fbRequest(`${productSetDetails.product_catalog}?fields=id,name,vertical,product_count`);
        }
      } catch (error) {
        console.log('Could not fetch product set details:', error);
      }
    }

    // 5. Get Object Story Spec Details (if it exists)
    let objectStoryDetails = null;
    if (creativeDetails.object_story_spec) {
      objectStoryDetails = creativeDetails.object_story_spec;
    }

    return NextResponse.json({
      success: true,
      creative_analysis: {
        ad: adDetails,
        creative: creativeDetails,
        product_set: productSetDetails,
        catalog: catalogDetails,
        object_story: objectStoryDetails,
        summary: {
          ad_name: adDetails.name,
          creative_type: creativeDetails.object_type,
          has_product_set: !!creativeDetails.product_set_id,
          link_url: creativeDetails.link_url,
          title: creativeDetails.title,
          body: creativeDetails.body,
          image_url: creativeDetails.image_url,
          video_id: creativeDetails.video_id,
          thumbnail_url: creativeDetails.thumbnail_url,
          product_set_name: productSetDetails?.name,
          catalog_name: catalogDetails?.name
        }
      }
    });
  } catch (err: any) {
    console.error("Error analyzing creative:", err);
    return NextResponse.json({ 
      error: err.message,
      stack: err.stack 
    }, { status: 500 });
  }
}
