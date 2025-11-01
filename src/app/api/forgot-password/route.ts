import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { emailService } from '@/lib/email/email-service';
import { initializeDatabase, executeQuery } from '@/lib/mysql';

export async function POST(request: NextRequest) {
  try {
    // Initialize database
    console.log('🔧 Initializing database for password reset...');
    await initializeDatabase();
    console.log('✅ Database initialized successfully for password reset');
    
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Check if user exists in database
    const rows = await executeQuery(
      'SELECT id, email, first_name, username, role FROM users WHERE email = ? OR username = ?',
      [email, email]
    );

    const users = rows as any[];
    if (users.length === 0) {
      console.log('❌ Password reset attempt for non-existent user:', email);
      return NextResponse.json({ 
        success: false, 
        error: 'No account found with this email or username. Please check your credentials or sign up for a new account.' 
      });
    }

    const user = users[0];
    console.log('✅ User found for password reset:', { id: user.id, email: user.email });

    // Generate password reset token
    const token = crypto.randomBytes(32).toString('hex');
    const expires = Date.now() + 30 * 60 * 1000; // 30 minutes

    console.log('🔑 Generated password reset token:', token);
    console.log('📧 For email:', email);
    console.log('⏰ Expires at:', new Date(expires).toISOString());

    // Store token with a special prefix to distinguish from other tokens
    const resetToken = `reset_${token}`;
    try {
      await executeQuery(
        'INSERT INTO verification_tokens (token, email, expires) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE expires = ?',
        [resetToken, email, expires, expires]
      );
      console.log('✅ Password reset token stored successfully in database');
    } catch (error) {
      console.error('❌ Failed to store password reset token:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to store password reset token: ${errorMessage}`);
    }

    // Password reset URL with timestamp for expiration
    const timestamp = Date.now();
    const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/reset-password?email=${encodeURIComponent(email)}&token=${token}&t=${timestamp}`;

    // Use the standardized email service
    const result = await emailService.sendEmail({
      to: email,
      subject: 'Reset your Unique Leverage password',
      text: `Reset your Unique Leverage password

Please click the link below to reset your password:

${resetUrl}

This link can only be used once and is valid for 30 minutes.

If you didn't request this password reset, please ignore this email.

Best regards,
Unique Leverage Team`,
      html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset your Unique Leverage password</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #ffffff;">
          
          <!-- Main Content -->
          <div style="margin-bottom: 32px;">
            <p style="font-size: 16px; color: #6B7280; margin: 0 0 24px 0; line-height: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
              Hi ${user.first_name || user.username || 'there'},<br><br>
              Click the button below to reset your <strong>Unique Leverage</strong> password.
            </p>

            <!-- Button -->
            <div style="margin: 32px 0;">
              <a href="${resetUrl}" style="display: inline-block; background-color: #2563EB; color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; border: none; cursor: pointer;">
                Reset Password
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

    console.log('✅ Password reset email sent successfully to:', email);
    return NextResponse.json({ 
      success: true, 
      message: 'Password reset email sent successfully' 
    });

  } catch (error) {
    console.error('❌ Error sending password reset email:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        message: 'Failed to send password reset email' 
      },
      { status: 500 }
    );
  }
}
