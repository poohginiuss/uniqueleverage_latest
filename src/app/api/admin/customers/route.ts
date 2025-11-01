import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-09-30.clover', // Match the webhook API version
}) : null;

// GET - Fetch all customers from Stripe for admin dashboard
export async function GET(request: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const startingAfter = searchParams.get('starting_after');

    // Fetch customers from Stripe
    const customers = await stripe.customers.list({
      limit: Math.min(limit, 100), // Cap at 100 for performance
      starting_after: startingAfter || undefined,
    });

    // Get all subscriptions in batches to avoid rate limiting
    const allSubscriptionsData = [];
    let hasMore = true;
    let subscriptionStartingAfter = undefined;
    
    while (hasMore) {
      const subscriptionsBatch: Stripe.ApiList<Stripe.Subscription> = await stripe.subscriptions.list({
        limit: 100,
        starting_after: subscriptionStartingAfter,
        expand: ['data.customer'],
      });
      
      allSubscriptionsData.push(...subscriptionsBatch.data);
      hasMore = subscriptionsBatch.has_more;
      subscriptionStartingAfter = subscriptionsBatch.data[subscriptionsBatch.data.length - 1]?.id;
    }
    
    const allSubscriptions = { data: allSubscriptionsData };

    // Create a map of customer ID to subscription
    const customerSubscriptionMap = new Map();
    allSubscriptions.data.forEach(sub => {
      if (typeof sub.customer === 'string') {
        customerSubscriptionMap.set(sub.customer, sub);
      } else if (sub.customer && typeof sub.customer === 'object') {
        customerSubscriptionMap.set(sub.customer.id, sub);
      }
    });


    // Transform customers with minimal API calls
    const customersWithSubscriptions = customers.data.map((customer) => {
      if (customer.deleted) return null;

      const subscription = customerSubscriptionMap.get(customer.id);

      return {
        id: customer.id,
        name: (customer.name && customer.name.trim()) || (customer.metadata?.individual_name && customer.metadata.individual_name.trim()) || 'Unknown Customer',
        email: customer.email || 'No email',
        phone: customer.phone || 'No phone',
        dealershipName: customer.business_name || (customer.name && customer.name.trim()) || 'Unknown Dealership',
        website: customer.metadata?.website || '',
        businessAddress: customer.address ? 
          `${customer.address.line1 || ''}${customer.address.line2 ? `, ${customer.address.line2}` : ''}` : 'No address',
        city: customer.address?.city || '',
        state: customer.address?.state || '',
        zip: customer.address?.postal_code || '',
        subscriptionStatus: subscription?.status || 'inactive',
        subscriptionId: subscription?.id || null,
        subscriptionPrice: subscription?.items?.data[0]?.price?.unit_amount ? 
          (subscription.items.data[0].price.unit_amount / 100) : null,
        createdAt: new Date(customer.created * 1000).toISOString(),
        lastActive: new Date(customer.created * 1000).toISOString(), // Use created as last active for now
        paymentMethod: null, // Skip payment method for now to avoid rate limits
        access: subscription?.status === 'active' ? 
          ['Admin', 'Data export', 'Data import'] : 
          ['Data export', 'Data import'],
        avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(customer.name || 'Customer')}&background=random&color=fff&size=40`,
      };
    });

    // Filter out deleted customers and sort by creation date (newest first)
    const activeCustomers = customersWithSubscriptions
      .filter(customer => customer !== null)
      .sort((a, b) => new Date(b!.createdAt).getTime() - new Date(a!.createdAt).getTime());

    return NextResponse.json({
      success: true,
      customers: activeCustomers,
      hasMore: customers.has_more,
      nextStartingAfter: customers.data[customers.data.length - 1]?.id,
    });

  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
  }
}
