import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { executeQuery } from '@/lib/mysql';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session_token')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = Buffer.from(sessionToken, 'base64').toString('utf-8');
    const { email } = JSON.parse(decoded);

    const users = await executeQuery('SELECT id FROM users WHERE email = ?', [email]) as any[];
    if (!users || users.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    const userId = users[0].id;

    // Get marketing wizard data
    const wizardData = await executeQuery(
      'SELECT * FROM user_marketing_wizard WHERE user_id = ? ORDER BY updated_at DESC',
      [userId]
    ) as any[];

    return NextResponse.json({ 
      success: true, 
      data: wizardData.map(item => ({
        id: item.id,
        campaignName: item.campaign_name,
        targetingLocations: item.targeting_locations ? JSON.parse(item.targeting_locations) : [],
        demographics: item.demographics ? JSON.parse(item.demographics) : { minAge: 25, maxAge: 65 },
        automotiveInterests: item.automotive_interests ? JSON.parse(item.automotive_interests) : [],
        vehicleFilters: item.vehicle_filters ? JSON.parse(item.vehicle_filters) : [],
        selectedVehicles: item.selected_vehicles ? JSON.parse(item.selected_vehicles) : [],
        createdAt: item.created_at,
        updatedAt: item.updated_at
      }))
    });

  } catch (error) {
    console.error('Error fetching marketing wizard data:', error);
    return NextResponse.json({ error: 'Failed to fetch marketing wizard data' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session_token')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = Buffer.from(sessionToken, 'base64').toString('utf-8');
    const { email } = JSON.parse(decoded);

    const users = await executeQuery('SELECT id FROM users WHERE email = ?', [email]) as any[];
    if (!users || users.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    const userId = users[0].id;

    const {
      campaignName,
      targetingLocations,
      demographics,
      automotiveInterests,
      vehicleFilters,
      selectedVehicles
    } = await request.json();

    // Save marketing wizard data
    await executeQuery(
      `INSERT INTO user_marketing_wizard 
       (user_id, campaign_name, targeting_locations, demographics, automotive_interests, vehicle_filters, selected_vehicles)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        campaignName || null,
        JSON.stringify(targetingLocations || []),
        JSON.stringify(demographics || { minAge: 25, maxAge: 65 }),
        JSON.stringify(automotiveInterests || []),
        JSON.stringify(vehicleFilters || []),
        JSON.stringify(selectedVehicles || [])
      ]
    );

    return NextResponse.json({ success: true, message: 'Marketing wizard data saved successfully' });

  } catch (error) {
    console.error('Error saving marketing wizard data:', error);
    return NextResponse.json({ error: 'Failed to save marketing wizard data' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session_token')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = Buffer.from(sessionToken, 'base64').toString('utf-8');
    const { email } = JSON.parse(decoded);

    const users = await executeQuery('SELECT id FROM users WHERE email = ?', [email]) as any[];
    if (!users || users.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    const userId = users[0].id;

    const { id, ...updateData } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Campaign ID is required' }, { status: 400 });
    }

    // Build update query dynamically
    const updateFields = [];
    const updateValues = [];

    if (updateData.campaignName !== undefined) {
      updateFields.push('campaign_name = ?');
      updateValues.push(updateData.campaignName);
    }
    if (updateData.targetingLocations !== undefined) {
      updateFields.push('targeting_locations = ?');
      updateValues.push(JSON.stringify(updateData.targetingLocations));
    }
    if (updateData.demographics !== undefined) {
      updateFields.push('demographics = ?');
      updateValues.push(JSON.stringify(updateData.demographics));
    }
    if (updateData.automotiveInterests !== undefined) {
      updateFields.push('automotive_interests = ?');
      updateValues.push(JSON.stringify(updateData.automotiveInterests));
    }
    if (updateData.vehicleFilters !== undefined) {
      updateFields.push('vehicle_filters = ?');
      updateValues.push(JSON.stringify(updateData.vehicleFilters));
    }
    if (updateData.selectedVehicles !== undefined) {
      updateFields.push('selected_vehicles = ?');
      updateValues.push(JSON.stringify(updateData.selectedVehicles));
    }

    if (updateFields.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    updateValues.push(id, userId);

    await executeQuery(
      `UPDATE user_marketing_wizard SET ${updateFields.join(', ')} WHERE id = ? AND user_id = ?`,
      updateValues
    );

    return NextResponse.json({ success: true, message: 'Marketing wizard data updated successfully' });

  } catch (error) {
    console.error('Error updating marketing wizard data:', error);
    return NextResponse.json({ error: 'Failed to update marketing wizard data' }, { status: 500 });
  }
}
