import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { initializeDatabase } from '@/lib/mysql';

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-09-30.clover', // Match the webhook API version
}) : null;

export async function GET(request: NextRequest) {
  try {
    console.log('=== Customer Payment Methods API Called ===');
    
    // Initialize database
    await initializeDatabase();
    console.log('Database initialized successfully');
    
    if (!stripe) {
      console.log('ERROR: Stripe not configured');
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
    }
    console.log('Stripe configured successfully');

    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');
    console.log('Customer ID received:', customerId);

    if (!customerId) {
      console.log('ERROR: No customer ID provided');
      return NextResponse.json({ error: 'Customer ID is required' }, { status: 400 });
    }

    // Get all payment methods for the customer
    console.log('Fetching payment methods from Stripe...');
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: 'card',
    });
    console.log('Payment methods fetched:', paymentMethods.data.length, 'methods found');

    // Get customer to find default payment method
    console.log('Fetching customer from Stripe...');
    const customer = await stripe.customers.retrieve(customerId);
    console.log('Customer fetched:', customer.id, 'deleted:', customer.deleted);
    
    // Check if customer was deleted
    if (customer.deleted) {
      console.log('ERROR: Customer was deleted');
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    const formattedPaymentMethods = paymentMethods.data.map(pm => ({
      id: pm.id,
      type: pm.type,
      card: {
        brand: pm.card?.brand,
        last4: pm.card?.last4,
        expMonth: pm.card?.exp_month,
        expYear: pm.card?.exp_year,
      },
      isDefault: customer.invoice_settings?.default_payment_method === pm.id,
    }));

    return NextResponse.json({
      success: true,
      paymentMethods: formattedPaymentMethods,
      defaultPaymentMethod: customer.invoice_settings?.default_payment_method,
    });
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    
    // Provide more specific error information
    let errorMessage = 'Failed to fetch payment methods';
    if (error instanceof Error) {
      if (error.message.includes('No such customer')) {
        errorMessage = 'Customer not found in Stripe';
      } else if (error.message.includes('Invalid API Key')) {
        errorMessage = 'Stripe API key is invalid';
      } else {
        errorMessage = `Stripe error: ${error.message}`;
      }
    }
    
    return NextResponse.json({ 
      error: errorMessage,
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
    }

    const { paymentMethodId } = await request.json();

    if (!paymentMethodId) {
      return NextResponse.json({ error: 'Payment method ID is required' }, { status: 400 });
    }

    // Detach the payment method
    await stripe.paymentMethods.detach(paymentMethodId);

    return NextResponse.json({
      success: true,
      message: 'Payment method removed successfully',
    });
  } catch (error) {
    console.error('Error removing payment method:', error);
    return NextResponse.json({ error: 'Failed to remove payment method' }, { status: 500 });
  }
}
