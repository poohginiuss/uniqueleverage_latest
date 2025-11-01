import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

export async function POST(request: NextRequest) {
  console.log('=== MINIMAL PAYMENT TEST START ===');
  
  try {
    console.log('About to parse request body...');
    const body = await request.json();
    console.log('Request body parsed successfully');
    console.log('Body keys:', Object.keys(body));
    
    const { formData } = body;
    console.log('formData extracted:', !!formData);
    
    if (!formData) {
      return NextResponse.json({ error: 'No formData in request' }, { status: 400 });
    }
    
    console.log('About to create minimal customer...');
    
    // Create a minimal customer
    const customer = await stripe.customers.create({
      email: formData.email || 'test@example.com',
      name: formData.dealershipName || 'Test Customer',
    });
    
    console.log('Customer created successfully:', customer.id);
    
    return NextResponse.json({
      success: true,
      message: 'Minimal payment test successful',
      customerId: customer.id
    });
    
  } catch (error) {
    console.error('Minimal payment test failed:', error);
    return NextResponse.json({
      error: 'Minimal payment test failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
