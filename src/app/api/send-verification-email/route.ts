import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { emailService } from '@/lib/email/email-service';
import { verificationTokens } from '@/lib/verification';
import { initializeDatabase } from '@/lib/mysql';

export async function POST(request: NextRequest) {
  try {
    // Initialize database to ensure verification_tokens table exists
    console.log('🔧 Initializing database for verification tokens...');
    await initializeDatabase();
    console.log('✅ Database initialized successfully for verification tokens');
    
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Generate verification token
    const token = crypto.randomBytes(32).toString('hex');
    const expires = Date.now() + 60 * 60 * 1000; // 1 hour

    console.log('🔑 Generated verification token:', token);
    console.log('📧 For email:', email);
    console.log('⏰ Expires at:', new Date(expires).toISOString());

    // Store token
    try {
      await verificationTokens.set(token, email, expires);
      console.log('✅ Verification token stored successfully in database');
    } catch (error) {
      console.error('❌ Failed to store verification token:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to store verification token: ${errorMessage}`);
    }

    // Verification URL
    const verificationUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/verify-email?token=${token}`;

    // Use the standardized email service
    const result = await emailService.sendEmail({
      to: email,
      subject: 'Welcome to Unique Leverage - Verify Your Email',
      text: `Welcome to Unique Leverage!

Thank you for subscribing to our platform. To complete your account setup, please verify your email address by clicking the button below.

Verify Email: ${verificationUrl}

This link will expire in 1 hour.

If you didn't create an account with us, please ignore this email.

Best regards,
Unique Leverage Team`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333; margin-bottom: 20px;">Welcome to Unique Leverage!</h2>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
            Thank you for subscribing to our platform. To complete your account setup, please verify your email address by clicking the button below.
          </p>
          
          <div style="text-align: left; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background-color: #2563EB; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; transition: background-color 0.2s;">
              Verify Email Address
            </a>
          </div>
          
          <p style="color: #999; font-size: 12px; margin-top: 30px;">
            This link will expire in 1 hour.
          </p>
          
          <p style="color: #999; font-size: 12px;">
            If you didn't create an account with us, please ignore this email.
          </p>
          
          <p style="color: #666; margin-top: 30px;">
            Best regards,<br>
            Unique Leverage Team
          </p>
        </div>
      `
    });

    if (!result.success) {
      throw new Error(`Failed to send email: ${result.error?.message}`);
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Verification email sent successfully' 
    });

  } catch (error) {
    console.error('Error sending verification email:', error);
    return NextResponse.json(
      { error: 'Failed to send verification email' },
      { status: 500 }
    );
  }
}

