import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '@/lib/email/email-service';

export async function POST(request: NextRequest) {
  try {
    const { senderEmail } = await request.json();
    
    if (!senderEmail || !senderEmail.includes('@uniqueleverage.com')) {
      return NextResponse.json({
        success: false,
        error: 'Invalid sender email. Must be a @uniqueleverage.com address.'
      }, { status: 400 });
    }

    // Update the environment variable (this will require a server restart to take effect)
    process.env.EMAIL_SENDER = senderEmail;
    
    // Test the new configuration
    const testResult = await emailService.testEmail('admin@uniqueleverage.com');
    
    return NextResponse.json({
      success: testResult.success,
      message: testResult.success ? 
        `Successfully switched to ${senderEmail}. Test email sent.` : 
        `Failed to switch to ${senderEmail}. ${testResult.error?.message}`,
      senderEmail,
      messageId: testResult.messageId,
      error: testResult.error?.message,
      note: 'Server restart required for permanent change'
    });
    
  } catch (error) {
    console.error('Email switch error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const currentSender = emailService.getSenderEmail();
    
    return NextResponse.json({
      success: true,
      currentSender,
      availableSenders: [
        'integrations@uniqueleverage.com',
        'support@uniqueleverage.com'
      ],
      note: 'To switch sender, use POST with { "senderEmail": "email@uniqueleverage.com" }'
    });
    
  } catch (error) {
    console.error('Email status error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
