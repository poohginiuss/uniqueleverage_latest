import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { executeQuery, initializeDatabase } from '@/lib/mysql';
import crypto from 'crypto';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover', // Latest Stripe API version
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// Disable body parsing for Stripe webhooks (we need raw body)
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    // Get raw body as text
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      console.error('❌ Missing stripe-signature header');
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error('❌ Webhook signature verification failed:', err.message);
      return NextResponse.json(
        { error: `Webhook Error: ${err.message}` },
        { status: 400 }
      );
    }

    console.log('✅ Webhook received:', event.type);

    // Handle checkout.session.completed event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;

      console.log('📦 Processing checkout session:', session.id);

      // Initialize database
      await initializeDatabase();

      // Extract customer details
      const customerDetails = session.customer_details;
      const customerId = session.customer as string;
      const email = customerDetails?.email;
      const name = customerDetails?.name || '';
      const phone = customerDetails?.phone || '';
      const address = customerDetails?.address;

      // Extract custom fields (Business info)
      // Handle both production and test payment link field configurations
      const customFields = session.custom_fields || [];
      let dealershipName = '';
      let website = '';
      let dmsProvider = '';
      
      // First pass: check if we have 'fullname' field (test mode)
      const hasFullnameField = customFields.some((f: any) => f.key === 'fullname');

      customFields.forEach((field: any) => {
        if (hasFullnameField) {
          // TEST MODE CONFIGURATION
          if (field.key === 'fullname') {
            dealershipName = field.text?.value || '';
          } else if (field.key === 'dealershipurl') {
            website = field.text?.value || '';
          } else if (field.key === 'whatcompanymanagesyourinventoryfeed') {
            dmsProvider = field.text?.value || '';
          }
        } else {
          // PRODUCTION MODE CONFIGURATION
          if (field.key === 'dealershipurl') {
            dealershipName = field.text?.value || '';
          } else if (field.key === 'whatsystemdoyoucurrentlymanageinventory') {
            website = field.text?.value || '';
          } else if (field.key === 'whatcompanymanagesyourinventoryfeed') {
            dmsProvider = field.text?.value || '';
          }
        }
      });

      // Split name into first and last
      const nameParts = name.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      // Extract address components
      const businessAddress = address?.line1 || '';
      const city = address?.city || '';
      const state = address?.state || '';
      const zip = address?.postal_code || '';

      // Generate default password: "Password"
      const defaultPassword = 'Password';
      const hashedPassword = crypto.createHash('sha256').update(defaultPassword).digest('hex');

      // Extract subscription details
      const amountTotal = session.amount_total ? session.amount_total / 100 : 0; // Convert from cents
      const currency = session.currency?.toUpperCase() || 'USD';
      const subscriptionId = session.subscription as string || null;
      
      // Determine product name based on amount
      let productName = 'The Basic Plan'; // Default
      if (amountTotal >= 199) {
        productName = 'The Pro Plan';
      } else if (amountTotal >= 299) {
        productName = 'The Enterprise Plan';
      }
      
      // Set username to email (same as signup page)
      const username = email;

      if (!email) {
        console.error('❌ No email found in checkout session');
        return NextResponse.json(
          { error: 'No email found in checkout session' },
          { status: 400 }
        );
      }

      // Check if user already exists
      const existingUser = await executeQuery(
        'SELECT id FROM users WHERE email = ?',
        [email]
      );

      if (Array.isArray(existingUser) && existingUser.length > 0) {
        console.log('⚠️ User already exists, updating subscription info');
        
        // Update existing user's subscription info
        await executeQuery(
          `UPDATE users 
           SET customer_id = ?, 
               subscription_id = ?, 
               subscription_status = 'active',
               subscription_amount = ?,
               subscription_currency = ?,
               subscription_product_name = ?,
               updated_at = NOW()
           WHERE email = ?`,
          [customerId, subscriptionId, amountTotal, currency, productName, email]
        );

        console.log('✅ Updated existing user subscription');
      } else {
        // Create new user
        await executeQuery(
          `INSERT INTO users (
            email, 
            password, 
            username,
            first_name, 
            last_name, 
            name,
            phone, 
            dealership_name, 
            website, 
            dms_provider,
            business_address, 
            city, 
            state, 
            zip,
            customer_id,
            subscription_id,
            subscription_status,
            subscription_amount,
            subscription_currency,
            subscription_product_name,
            role,
            verified,
            created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
          [
            email,
            hashedPassword,
            username,
            firstName,
            lastName,
            name,
            phone,
            dealershipName,
            website,
            dmsProvider,
            businessAddress,
            city,
            state,
            zip,
            customerId,
            subscriptionId,
            'active',
            amountTotal,
            currency,
            productName,
            'customer',
            true // Mark as verified since they paid
          ]
        );

        console.log('✅ New user created:', email);
      }

      console.log('🎉 Webhook processed successfully');

      return NextResponse.json({ 
        received: true,
        message: 'Customer created/updated successfully'
      });
    }

    // Handle customer.subscription.created event
    if (event.type === 'customer.subscription.created') {
      const subscription = event.data.object as Stripe.Subscription;
      
      console.log('📦 Processing subscription created:', subscription.id);
      
      // Initialize database
      await initializeDatabase();
      
      // Get customer details from Stripe
      const customer = await stripe.customers.retrieve(subscription.customer as string);
      
      if (customer.deleted) {
        console.error('❌ Customer was deleted');
        return NextResponse.json({ error: 'Customer deleted' }, { status: 400 });
      }
      
      const email = customer.email;
      const customerName = customer.name || '';
      const phone = customer.phone || '';
      const address = customer.address;
      
      if (!email) {
        console.error('❌ No email found for customer');
        return NextResponse.json({ error: 'No customer email' }, { status: 400 });
      }
      
      // Check if user already exists
      const existingUsers = await executeQuery(
        'SELECT id FROM users WHERE email = ?',
        [email]
      ) as any[];
      
      if (existingUsers.length > 0) {
        console.log('✅ User already exists, updating subscription:', email);
        
        // Update existing user's subscription
        await executeQuery(
          `UPDATE users SET 
            subscription_status = 'active',
            subscription_id = ?,
            subscription_amount = ?,
            subscription_product_name = ?,
            subscription_currency = ?,
            updated_at = NOW()
           WHERE email = ?`,
          [
            subscription.id,
            subscription.items.data[0]?.price.unit_amount || 0,
            subscription.items.data[0]?.price.nickname || 'Basic Plan',
            subscription.currency,
            email
          ]
        );
      } else {
        console.log('✅ Creating new user from subscription:', email);
        
        // Create new user with proper field mapping
        const hashedPassword = crypto.createHash('sha256').update('Password').digest('hex');
        
        // Extract form data from subscription metadata (same as form submission)
        const dealershipName = subscription.metadata?.dealership || 'Dealership';
        const customerEmail = subscription.metadata?.email || email;
        const firstName = subscription.metadata?.firstName || 'Customer';
        const lastName = subscription.metadata?.lastName || 'User';
        
        // Parse customer name properly
        const fullName = customerName || `${firstName} ${lastName}`;
        const nameParts = fullName.split(' ');
        const parsedFirstName = nameParts[0] || firstName;
        const parsedLastName = nameParts.slice(1).join(' ') || lastName;
        
        await executeQuery(
          `INSERT INTO users (
            username, first_name, last_name, email, password, dealership_name, phone, website,
            business_address, city, state, zip, subscription_status, subscription_id,
            customer_id, verified, subscription_amount, subscription_product_name,
            subscription_currency, role, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            customerEmail, // username = email (like other users)
            parsedFirstName,
            parsedLastName,
            customerEmail,
            hashedPassword,
            dealershipName,
            phone || '',
            customer.metadata?.website || '',
            address?.line1 || '',
            address?.city || '',
            address?.state || '',
            address?.postal_code || '',
            'active',
            subscription.id,
            customer.id,
            true,
            subscription.items.data[0]?.price.unit_amount || 0,
            subscription.items.data[0]?.price.nickname || 'Basic Plan',
            subscription.currency,
            'customer',
            new Date(),
            new Date()
          ]
        );
        
        console.log('✅ New user created from subscription:', email);
      }
      
      return NextResponse.json({ 
        received: true,
        message: 'Subscription processed successfully'
      });
    }

    // Return success for other event types
    return NextResponse.json({ received: true });

  } catch (error: any) {
    console.error('❌ Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed', details: error.message },
      { status: 500 }
    );
  }
}

