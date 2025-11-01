import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function GET() {
  try {
    console.log('=== STRIPE TEST ===');
    console.log('STRIPE_SECRET_KEY exists:', !!process.env.STRIPE_SECRET_KEY);
    console.log('STRIPE_PRICE_ID exists:', !!process.env.STRIPE_PRICE_ID);
    
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ 
        error: 'STRIPE_SECRET_KEY not found',
        env: {
          STRIPE_SECRET_KEY: 'missing',
          STRIPE_PRICE_ID: process.env.STRIPE_PRICE_ID || 'missing'
        }
      }, { status: 500 });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    console.log('Stripe initialized successfully');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Stripe initialized successfully',
      env: {
        STRIPE_SECRET_KEY: 'present',
        STRIPE_PRICE_ID: process.env.STRIPE_PRICE_ID || 'missing'
      }
    });
    
  } catch (error) {
    console.error('Stripe test failed:', error);
    return NextResponse.json({ 
      error: 'Stripe initialization failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
