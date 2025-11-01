import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { emailService } from '@/lib/email/email-service';
import { verificationTokens } from '@/lib/verification';
import { initializeDatabase, executeQuery } from '@/lib/mysql';
// Removed React Email imports - using simple HTML instead

export async function POST(request: NextRequest) {
  try {
    // Initialize database to ensure verification_tokens table exists
    console.log('🔧 Initializing database for login tokens...');
    await initializeDatabase();
    console.log('✅ Database initialized successfully for login tokens');
    
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Check if user exists in database (by email or username)
    const rows = await executeQuery(
      'SELECT id, email, username, first_name, role FROM users WHERE email = ? OR username = ?',
      [email, email]
    );

    const users = rows as any[];
    if (users.length === 0) {
      console.log('❌ Login attempt for non-existent user:', email);
      return NextResponse.json({ 
        success: false, 
        error: 'No account found with this email or username. Please check your credentials or sign up for a new account.' 
      });
    }

    const user = users[0];
    console.log('✅ User found for login:', { id: user.id, email: user.email });

    // Generate login token
    const token = crypto.randomBytes(32).toString('hex');
    const expires = Date.now() + 30 * 60 * 1000; // 30 minutes (like Untitled UI)

    console.log('🔑 Generated login token:', token);
    console.log('📧 For email:', email);
    console.log('⏰ Expires at:', new Date(expires).toISOString());

    // Store token with a special prefix to distinguish from verification tokens
    const loginToken = `login_${token}`;
    try {
      await verificationTokens.set(loginToken, email, expires);
      console.log('✅ Login token stored successfully in database');
    } catch (error) {
      console.error('❌ Failed to store login token:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to store login token: ${errorMessage}`);
    }

    // Direct login URL with timestamp for expiration (30 minutes)
    const timestamp = Date.now();
    const loginUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/direct-login?email=${encodeURIComponent(email)}&t=${timestamp}`;

    // Use the standardized email service
    const result = await emailService.sendEmail({
      to: email,
      subject: 'Sign in to Unique Leverage',
      text: `Sign in to Unique Leverage

Please click the link below to sign in:

${loginUrl}

This link can only be used once and is valid for 30 minutes.

If you didn't request this login link, please ignore this email.

Best regards,
Unique Leverage Team`,
      html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Sign in to Unique Leverage</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #ffffff;">
          

          <!-- Main Content -->
          <div style="margin-bottom: 32px;">
            <p style="font-size: 16px; color: #6B7280; margin: 0 0 24px 0; line-height: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
              Hi ${user.first_name || user.username || 'there'},<br><br>
              Click the button below to sign in to your <strong>Unique Leverage</strong> account.
            </p>

            <!-- Button -->
            <div style="margin: 32px 0;">
              <a href="${loginUrl}" style="display: inline-block; background-color: #2563EB; color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; border: none; cursor: pointer;">
                Sign in
              </a>
            </div>

            <p style="font-size: 14px; color: #6B7280; margin: 24px 0 0 0; line-height: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
              This link can only be used once and is valid for 30 minutes.<br><br>
              If you didn't request this email, you can safely ignore it.<br><br>
              Thanks,<br>
              The Unique Leverage Team
            </p>
          </div>

          <!-- Footer -->
          <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 32px 0;">
          <div style="text-align: center;">
            <p style="font-size: 14px; color: #9CA3AF; margin: 0 0 8px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
              Still having issues? Please contact our friendly team:
            </p>
            <a href="mailto:support@uniqueleverage.com" style="color: #2563EB; text-decoration: none; font-size: 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
              support@uniqueleverage.com
            </a>
          </div>

        </div>
      </body>
      </html>
      `
    });

    if (!result.success) {
      throw new Error(`Failed to send email: ${result.error?.message}`);
    }

    console.log('✅ Login email sent successfully to:', email);
    return NextResponse.json({ 
      success: true, 
      message: 'Login email sent successfully' 
    });

  } catch (error) {
    console.error('❌ Error sending login email:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        message: 'Failed to send login email' 
      },
      { status: 500 }
    );
  }
}
