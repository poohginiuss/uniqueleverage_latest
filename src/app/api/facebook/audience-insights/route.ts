import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { executeQuery } from "@/lib/mysql";
import crypto from "crypto";

const GRAPH_API_BASE = "https://graph.facebook.com/v20.0";

// Decryption function
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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { locations, interests, ageMin, ageMax, adAccountId } = body;

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

    // Build targeting object for Facebook API
    const targeting: any = {
      age_min: ageMin || 25,
      age_max: ageMax || 65,
      publisher_platforms: ["facebook", "instagram"]
    };

    // Add geographic targeting
    if (locations && locations.length > 0) {
      const geoLocations: any = {};
      
      locations.forEach((location: any) => {
        if (location.type === 'state') {
          if (!geoLocations.regions) geoLocations.regions = [];
          geoLocations.regions.push({
            key: `state_${location.name.toLowerCase().replace(/\s+/g, '_')}`,
            name: location.name,
            country: 'US'
          });
        } else if (location.type === 'city') {
          if (!geoLocations.cities) geoLocations.cities = [];
          geoLocations.cities.push({
            key: `city_${location.name.toLowerCase().replace(/\s+/g, '_')}`,
            name: location.name,
            country: 'US',
            radius: location.radius || 25
          });
        }
      });
      
      if (Object.keys(geoLocations).length > 0) {
        targeting.geo_locations = geoLocations;
        targeting.location_types = ['home', 'recent'];
      }
    }

    // Add interests targeting (skip for now to avoid validation errors)
    // TODO: Implement proper interest ID mapping

    // Get audience insights from Facebook
    const formattedAdAccountId = adAccountId.startsWith('act_') ? adAccountId : `act_${adAccountId}`;
    
    const insightsResponse = await fetch(
      `${GRAPH_API_BASE}/${formattedAdAccountId}/delivery_estimate?targeting_spec=${encodeURIComponent(JSON.stringify(targeting))}&access_token=${accessToken}`
    );

    const insightsData = await insightsResponse.json();

    if (!insightsResponse.ok) {
      console.error('Facebook insights error:', insightsData);
      // Return a fallback audience size
      return NextResponse.json({
        success: true,
        audienceSize: 1000000, // Fallback size
        targeting: targeting,
        error: insightsData.error?.message || 'Failed to get audience insights'
      });
    }

    // Extract audience size from Facebook response
    const audienceSize = insightsData.data?.[0]?.estimate_dau || 1000000;

    return NextResponse.json({
      success: true,
      audienceSize: audienceSize,
      targeting: targeting
    });

  } catch (error) {
    console.error('Audience insights error:', error);
    return NextResponse.json(
      { error: "Failed to get audience insights" },
      { status: 500 }
    );
  }
}
