import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/mysql';
import { getUserFromSession } from '@/lib/auth-utils';

interface UserInventoryRequest {
  id: number;
  user_id: number;
  dealership_name: string;
  provider_key: string;
  expected_filename: string;
  status: string;
  request_date: Date;
  connected_date: Date | null;
}

export async function GET(request: NextRequest) {
  console.log('🚀 Status API endpoint called');
  
  try {
    // Get email from URL parameter
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const providerKey = searchParams.get('provider');
    
    console.log('🔍 Status API called with:', { email, providerKey });
    
    if (!email) {
      console.log('❌ No email provided');
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Get user from database
    const user = await getUserFromSession(email);
    if (!user) {
      console.log('❌ User not found for email:', email);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log(`✅ Found user: ${user.dealershipName} (ID: ${user.id})`);

    // If provider is specified, get status for that specific provider
    if (providerKey) {
      const requests = await executeQuery(
        'SELECT * FROM user_inventory_requests WHERE user_id = ? AND provider_key = ? ORDER BY request_date DESC LIMIT 1',
        [user.id, providerKey]
      ) as UserInventoryRequest[];

      if (requests.length === 0) {
        console.log(`📊 No request found for provider: ${providerKey}`);
        return NextResponse.json({
          status: 'not_requested',
          hasRequest: false,
          isConnected: false,
          isPending: false
        });
      }

      const request = requests[0];
      console.log(`📊 Request status for ${providerKey}:`, request.status);

      return NextResponse.json({
        status: request.status,
        hasRequest: true,
        isConnected: request.status === 'connected',
        isPending: request.status === 'pending',
        requestDate: request.request_date,
        connectedDate: request.connected_date,
        expectedFilename: request.expected_filename,
        providerKey: request.provider_key
      });
    }

    // If no provider specified, get all requests for the user
    const allRequests = await executeQuery(
      'SELECT * FROM user_inventory_requests WHERE user_id = ? ORDER BY request_date DESC',
      [user.id]
    ) as UserInventoryRequest[];

    console.log(`📊 Found ${allRequests.length} total requests for user`);

    // Check if any are connected
    const hasConnected = allRequests.some(r => r.status === 'connected');
    const hasPending = allRequests.some(r => r.status === 'pending');

    return NextResponse.json({
      status: hasConnected ? 'connected' : (hasPending ? 'pending' : 'not_requested'),
      hasRequest: allRequests.length > 0,
      isConnected: hasConnected,
      isPending: hasPending,
      requests: allRequests.map(r => ({
        providerKey: r.provider_key,
        status: r.status,
        requestDate: r.request_date,
        connectedDate: r.connected_date,
        expectedFilename: r.expected_filename
      }))
    });

  } catch (error) {
    console.error('Feed request status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
