import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { initializeDatabase, executeQuery } from '@/lib/mysql';

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-09-30.clover', // Match the webhook API version
}) : null;

// GET - Fetch account data from MySQL database
export async function GET(request: NextRequest) {
  try {
    // Initialize database
    await initializeDatabase();
    
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');
    const email = searchParams.get('email');

    if (!customerId && !email) {
      return NextResponse.json({ error: 'Customer ID or email is required' }, { status: 400 });
    }

    let user;
    
    if (customerId) {
      // Fetch by customer ID
      const users = await executeQuery(
        'SELECT * FROM users WHERE customer_id = ?',
        [customerId]
      );
      if (!Array.isArray(users) || users.length === 0) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      user = users[0] as any;
    } else {
      // Search by email
      const users = await executeQuery(
        'SELECT * FROM users WHERE email = ?',
        [email!]
      );
      if (!Array.isArray(users) || users.length === 0) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      user = users[0] as any;
    }

    // Fetch subscription data from Stripe if customer_id exists
    let subscriptionData = null;
    if (user.customer_id && stripe) {
      try {
        const subscriptions = await stripe.subscriptions.list({
          customer: user.customer_id,
          limit: 10,
        });
        const subscription = subscriptions.data.sort((a, b) => b.created - a.created)[0];
        subscriptionData = {
          status: subscription?.status || user.subscription_status || 'inactive',
          id: subscription?.id || user.subscription_id,
        };
      } catch (stripeError) {
        console.error('Error fetching Stripe subscription:', stripeError);
        // Fall back to database subscription data
        subscriptionData = {
          status: user.subscription_status || 'inactive',
          id: user.subscription_id,
        };
      }
    } else {
      // Use database subscription data
      subscriptionData = {
        status: user.subscription_status || 'inactive',
        id: user.subscription_id,
      };
    }

    // Format the response
    const accountData = {
      customerId: user.customer_id,
      email: user.email,
      firstName: user.first_name || '',
      lastName: user.last_name || '',
      name: user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim(),
      dealershipName: user.dealership_name || '',
      phone: user.phone || '',
      website: user.website || '',
      businessAddress: user.business_address || '',
      city: user.city || '',
      state: user.state || '',
      zip: user.zip || '',
      subscriptionStatus: subscriptionData.status,
      subscriptionId: subscriptionData.id,
      createdAt: user.created_at,
      verified: user.verified || false,
      avatarUrl: user.avatar_url || null,
    };

    return NextResponse.json({ success: true, data: accountData });
  } catch (error) {
    console.error('Error fetching account data:', error);
    return NextResponse.json({ error: 'Failed to fetch account data' }, { status: 500 });
  }
}

// PUT - Update customer data in Stripe
export async function PUT(request: NextRequest) {
  try {
    // Initialize database
    await initializeDatabase();
    
    if (!stripe) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
    }

    const { customerId, updates } = await request.json();

    if (!customerId) {
      return NextResponse.json({ error: 'Customer ID is required' }, { status: 400 });
    }

    // Build update object for Stripe
    const stripeUpdates: any = {};

    if (updates.firstName || updates.lastName) {
      const fullName = `${updates.firstName || ''} ${updates.lastName || ''}`.trim();
      stripeUpdates.name = fullName;
      stripeUpdates.metadata = {
        individual_name: fullName,
        cardholder_name: fullName,
      };
    }

    if (updates.email) {
      stripeUpdates.email = updates.email;
    }

    if (updates.phone) {
      stripeUpdates.phone = updates.phone;
    }

    if (updates.businessAddress || updates.city || updates.state || updates.zip) {
      stripeUpdates.address = {
        line1: updates.businessAddress || '',
        city: updates.city || '',
        state: updates.state || '',
        postal_code: updates.zip || '',
        country: 'US',
      };
    }

    // Update customer in Stripe
    const updatedCustomer = await stripe.customers.update(customerId, stripeUpdates);

    return NextResponse.json({ 
      success: true, 
      message: 'Account updated successfully',
      customerId: updatedCustomer.id 
    });
  } catch (error) {
    console.error('Error updating account:', error);
    return NextResponse.json({ error: 'Failed to update account' }, { status: 500 });
  }
}