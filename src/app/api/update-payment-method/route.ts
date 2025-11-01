import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { initializeDatabase } from '@/lib/mysql';

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-09-30.clover', // Match the webhook API version
}) : null;

export async function POST(request: NextRequest) {
  try {
    // Initialize database
    await initializeDatabase();
    
    if (!stripe) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
    }

    const { customerId, paymentMethodId } = await request.json();

    if (!customerId || !paymentMethodId) {
      return NextResponse.json({ 
        error: 'Customer ID and payment method ID are required' 
      }, { status: 400 });
    }

    // Attach the payment method to the customer
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });

    // Set as default payment method
    await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    // Update all active subscriptions to use the new payment method
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
    });

    for (const subscription of subscriptions.data) {
      await stripe.subscriptions.update(subscription.id, {
        default_payment_method: paymentMethodId,
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Payment method updated successfully' 
    });
  } catch (error) {
    console.error('Error updating payment method:', error);
    return NextResponse.json({ 
      error: 'Failed to update payment method' 
    }, { status: 500 });
  }
}
