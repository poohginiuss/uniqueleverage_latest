import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('Testing Stripe import...');
    
    // Try to import Stripe dynamically
    const Stripe = await import('stripe');
    console.log('Stripe imported successfully');
    
    // Try to create a Stripe instance
    const stripe = new Stripe.default(process.env.STRIPE_SECRET_KEY || '');
    console.log('Stripe instance created successfully');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Stripe import and initialization successful'
    });
    
  } catch (error) {
    console.error('Stripe import/initialization failed:', error);
    return NextResponse.json({ 
      error: 'Stripe import/initialization failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
