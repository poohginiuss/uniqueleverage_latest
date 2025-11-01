import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, initializeDatabase } from '@/lib/mysql';
import Stripe from 'stripe';

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-09-30.clover', // Match the webhook API version
}) : null;

export async function DELETE(request: NextRequest) {
  try {
    // Initialize database
    await initializeDatabase();
    
    console.log('=== CLEARING TEST DATA ===');
    
    // Clear MySQL database
    console.log('Clearing MySQL users table...');
    await executeQuery('DELETE FROM users WHERE email LIKE "%@uniqueleverage.com" OR email LIKE "%@gmail.com" OR email LIKE "%@test%"');
    console.log('MySQL users cleared');
    
    if (!stripe) {
      return NextResponse.json({ 
        success: true, 
        message: 'MySQL cleared, but Stripe not configured' 
      });
    }
    
    // Clear Stripe customers
    console.log('Clearing Stripe customers...');
    
    // Get all customers
    const customers = await stripe.customers.list({ limit: 100 });
    
    let deletedCount = 0;
    for (const customer of customers.data) {
      try {
        // Skip if customer doesn't have test emails
        if (!customer.email || 
            (!customer.email.includes('@uniqueleverage.com') && 
             !customer.email.includes('@gmail.com') && 
             !customer.email.includes('@test'))) {
          continue;
        }
        
        console.log(`Deleting Stripe customer: ${customer.email} (${customer.id})`);
        
        // Cancel any active subscriptions first
        const subscriptions = await stripe.subscriptions.list({
          customer: customer.id,
          limit: 100
        });
        
        for (const subscription of subscriptions.data) {
          if (subscription.status !== 'canceled') {
            await stripe.subscriptions.cancel(subscription.id);
            console.log(`Canceled subscription: ${subscription.id}`);
          }
        }
        
        // Delete the customer
        await stripe.customers.del(customer.id);
        deletedCount++;
        console.log(`Deleted customer: ${customer.id}`);
        
      } catch (error) {
        console.error(`Error deleting customer ${customer.id}:`, error);
      }
    }
    
    console.log(`Deleted ${deletedCount} Stripe customers`);
    
    return NextResponse.json({
      success: true,
      message: `Cleared test data: ${deletedCount} Stripe customers and MySQL users`,
      deletedCount
    });
    
  } catch (error) {
    console.error('Error clearing test data:', error);
    return NextResponse.json(
      { 
        error: 'Failed to clear test data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
