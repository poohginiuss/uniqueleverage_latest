import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/mysql';
import { getUserFromSession } from '@/lib/auth-utils';

export async function POST(request: Request) {
  try {
    const { email, providerKey = 'manual' } = await request.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Get user data
    const user = await getUserFromSession(email);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user already has a connection record
    const existing = await executeQuery(
      'SELECT id FROM user_inventory_requests WHERE user_id = ?',
      [user.id]
    ) as any[];

    if (existing.length > 0) {
      return NextResponse.json({ 
        message: 'User already has inventory connection record',
        existing: existing[0]
      });
    }

    // Create inventory connection record
    const result = await executeQuery(
      `INSERT INTO user_inventory_requests 
       (user_id, dealership_name, provider_key, expected_filename, status, request_date, connected_date) 
       VALUES (?, ?, ?, ?, 'connected', NOW(), NOW())`,
      [user.id, user.dealershipName, providerKey, `${providerKey}_inventory.csv`]
    ) as any;

    return NextResponse.json({
      success: true,
      message: 'Inventory connection record created',
      recordId: result.insertId,
      user: {
        id: user.id,
        dealershipName: user.dealershipName,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Error creating inventory connection:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
