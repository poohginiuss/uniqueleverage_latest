import { NextRequest, NextResponse } from 'next/server';
import { getUserFromSession } from '@/lib/auth-utils';
import { executeQuery } from '@/lib/mysql';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userEmail, providerKey } = body;
    
    if (!userEmail) {
      return NextResponse.json({ error: 'User email is required' }, { status: 401 });
    }

    if (!providerKey) {
      return NextResponse.json({ error: 'Provider is required' }, { status: 400 });
    }

    // Get user data from email
    const user = await getUserFromSession(userEmail);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    // Update the status to 'disconnected' (or delete the record)
    await executeQuery(
      `UPDATE user_inventory_requests 
       SET status = 'disconnected', updated_at = NOW()
       WHERE user_id = ? AND provider_key = ?`,
      [user.id, providerKey]
    );

    // Also clean up any processed files for this user/provider
    const requests = await executeQuery(
      'SELECT expected_filename FROM user_inventory_requests WHERE user_id = ? AND provider_key = ?',
      [user.id, providerKey]
    ) as any[];

    if (requests.length > 0) {
      const filename = requests[0].expected_filename;
      await executeQuery(
        'DELETE FROM processed_files WHERE filename = ?',
        [filename]
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Successfully disconnected from inventory feed' 
    });

  } catch (error) {
    console.error('Disconnect error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
