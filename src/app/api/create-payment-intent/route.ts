import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-09-30.clover', // Match the webhook API version
}) : null;

export async function POST(request: NextRequest) {
  console.log('=== PAYMENT INTENT START ===');
  console.log('Stripe initialized:', !!stripe);
  console.log('STRIPE_SECRET_KEY exists:', !!process.env.STRIPE_SECRET_KEY);
  console.log('STRIPE_PRICE_ID exists:', !!process.env.STRIPE_PRICE_ID);
  
  try {
    if (!stripe) {
      console.log('ERROR: Stripe not configured');
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
    }

    console.log('About to parse request body...');
    const body = await request.json();
    console.log('Request body parsed successfully');
    const { formData } = body;
    
    console.log('Received form data:', formData);
    
    // Create customer in Stripe
    console.log('About to create Stripe customer...');
    const customer = await stripe.customers.create({
      email: formData.email,
      name: formData.dealershipName,
      phone: formData.phone,
      description: `Dealership: ${formData.dealershipName}`,
      address: {
        line1: formData.businessAddress,
        city: formData.city,
        state: formData.state,
        postal_code: formData.zip,
        country: 'US',
      },
      metadata: {
        website: formData.website,
        state: formData.state,
        individual_name: `${formData.firstName} ${formData.lastName}`,
        cardholder_name: `${formData.firstName} ${formData.lastName}`,
        business_type: 'automotive_dealership',
      },
    });
    console.log('Customer created successfully:', customer.id);

    // Create payment intent first for immediate payment
    console.log('About to create payment intent...');
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 9900, // $99.00 in cents
      currency: 'usd',
      customer: customer.id,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        dealership: formData.dealershipName,
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
      },
    });
    console.log('Payment intent created successfully:', paymentIntent.id);

    // Create subscription that will be activated after payment
    console.log('About to create subscription...');
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [
        {
          price: process.env.STRIPE_PRICE_ID,
        },
      ],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      collection_method: 'charge_automatically',
      metadata: {
        payment_intent_id: paymentIntent.id,
        dealership: formData.dealershipName,
        email: formData.email,
      },
    });
    console.log('Subscription created successfully:', subscription.id);

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      customerId: customer.id,
      subscriptionId: subscription.id,
      paymentIntentId: paymentIntent.id,
      cardholderName: `${formData.firstName} ${formData.lastName}`,
    });
    
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create payment intent',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}