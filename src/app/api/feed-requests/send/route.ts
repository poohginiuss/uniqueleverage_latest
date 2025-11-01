import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { getInventoryProvider, type InventoryProviderKey } from '@/lib/providers/inventoryProviders';
import { buildFeedRequestEmail } from '@/lib/email/templates/feedRequest';
import { getMailAdapter, createGmailTokens } from '@/mail/factory';
import { emailService } from '@/lib/email/email-service';
import { getUserFromSession, generateExpectedFilename } from '@/lib/auth-utils';
import { executeQuery } from '@/lib/mysql';

const FeedRequestSchema = z.object({
  providerKey: z.string().min(1),
  dealerName: z.string().min(1),
  dealerWebsite: z.string().url(),
  dealerAddress: z.string().min(1),
  dealerContactName: z.string().min(1),
  dealerContactEmail: z.string().min(1), // Changed from .email() to .min(1) to allow comma-separated emails
  dcsId: z.string().optional(), // DCS ID for Dealercarsearch
  approvalOnly: z.boolean().optional(),
  gmailAccessToken: z.string().optional(),
  originalMessageId: z.string().optional()
}).refine((data) => {
  // If provider is dealercarsearch, dcsId is required
  if (data.providerKey === 'dealercarsearch') {
    return data.dcsId && data.dcsId.trim().length > 0;
  }
  return true;
}, {
  message: "DCS ID is required for Dealercarsearch",
  path: ["dcsId"]
});

export async function POST(request: NextRequest) {
  try {
    // Check authentication - get email from request body (sent by frontend)
    const body = await request.json();
    console.log('📧 Feed request body received:', JSON.stringify(body, null, 2));
    
    const { userEmail, ...requestData } = body;
    
    if (!userEmail) {
      return NextResponse.json({ error: 'User email is required' }, { status: 401 });
    }

    // Get user data from email (same pattern as /api/account)
    const user = await getUserFromSession(userEmail);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }
    
    console.log('📧 Request data to validate:', JSON.stringify(requestData, null, 2));
    const validatedData = FeedRequestSchema.parse(requestData);
    
    const { providerKey, dealerName, dealerWebsite, dealerAddress, dealerContactName, dealerContactEmail, dcsId, approvalOnly, gmailAccessToken, originalMessageId } = validatedData;
    
    // Get provider configuration
    const provider = getInventoryProvider(providerKey as InventoryProviderKey);
    
    // Build filename using provider convention or custom format
    const filename = provider.customFilenameFormat && dcsId
      ? provider.customFilenameFormat.replace('{dcsId}', dcsId)
      : provider.filenameConvention(dealerName);
    
    // Generate expected filename for tracking
    const expectedFilename = generateExpectedFilename(dealerName);
    
    // Build email content
    const emailContent = approvalOnly 
      ? {
          subject: `Re: Inventory Feed Request - ${dealerName} (CarsforSale)`,
          text: 'I approve',
          html: '<p>I approve</p>'
        }
      : buildFeedRequestEmail({
          providerName: provider.name,
          dealerName,
          dealerWebsite,
          dealerAddress,
          dealerContactName,
          dealerContactEmail,
          filename,
          ftpHost: provider.ftpHost,
          ftpUser: provider.ftpUser,
          ftpPass: provider.ftpPass
        });
    
    // Use only the dealer contact email
    // Split comma-separated CC emails and validate each one
    const ccEmails = dealerContactEmail
      ? dealerContactEmail.split(',').map(email => email.trim()).filter(email => email.length > 0)
      : [];
    
    // Validate each email address
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = ccEmails.filter(email => !emailRegex.test(email));
    
    if (invalidEmails.length > 0) {
      return NextResponse.json({ 
        error: `Invalid email addresses: ${invalidEmails.join(', ')}` 
      }, { status: 400 });
    }
    
    const uniqueCcEmails = [...new Set(ccEmails)]; // Remove duplicates
    
    // Send email using the new mail module
    if (approvalOnly) {
      const gmailAccessToken = validatedData.gmailAccessToken;
      console.log('Feed Request API: Approval email requested, Gmail token:', gmailAccessToken ? 'Present' : 'Missing');
      console.log('Feed Request API: Gmail token length:', gmailAccessToken?.length || 0);
      console.log('Feed Request API: Gmail token preview:', gmailAccessToken ? `${gmailAccessToken.substring(0, 20)}...` : 'None');
      
      // For approval emails, use Gmail API if token is available
      if (gmailAccessToken) {
        const gmailTokens = createGmailTokens(gmailAccessToken);
        const gmailAdapter = getMailAdapter('gmail', gmailTokens);
        
        console.log('Feed Request API: Sending approval email with threading headers:', {
          originalMessageId,
          inReplyTo: originalMessageId,
          references: originalMessageId,
          subject: emailContent.subject
        });

        const gmailResult = await gmailAdapter.send({
          to: provider.toEmail,
          cc: uniqueCcEmails,
          subject: emailContent.subject,
          text: emailContent.text,
          html: emailContent.html,
          inReplyTo: originalMessageId,
          references: originalMessageId
        });
        
        if (gmailResult.success) {
          console.log('Approval email sent via Gmail API successfully:', {
            to: provider.toEmail,
            cc: uniqueCcEmails,
            subject: emailContent.subject,
            messageId: gmailResult.messageId
          });
        } else {
          console.error('Failed to send approval email via Gmail API:', gmailResult.error);
          throw new Error(`Gmail API error: ${gmailResult.error?.message}`);
        }
      } else {
        // Fallback to SMTP if no Gmail token
        const smtpResult = await emailService.sendEmail({
          to: provider.toEmail,
          cc: uniqueCcEmails,
          subject: emailContent.subject,
          text: emailContent.text,
          html: emailContent.html
        });
        
        if (smtpResult.success) {
          console.log('Approval email sent via SMTP (fallback):', {
            to: provider.toEmail,
            cc: uniqueCcEmails,
            subject: emailContent.subject,
            messageId: smtpResult.messageId
          });
        } else {
          console.error('Failed to send approval email via SMTP:', smtpResult.error);
          throw new Error(`SMTP error: ${smtpResult.error?.message}`);
        }
      }
    } else {
      // For initial requests, always send via standardized email service
      const smtpResult = await emailService.sendEmail({
        to: provider.toEmail,
        cc: uniqueCcEmails,
        subject: emailContent.subject,
        text: emailContent.text,
        html: emailContent.html
      });
      
      if (smtpResult.success) {
        console.log('Initial request email sent via SMTP:', {
          to: provider.toEmail,
          cc: uniqueCcEmails,
          subject: emailContent.subject,
          messageId: smtpResult.messageId
        });
        
        // Store feed request in database for tracking
        try {
          await executeQuery(
            `INSERT INTO user_inventory_requests 
             (user_id, dealership_name, provider_key, expected_filename, status, request_date) 
             VALUES (?, ?, ?, ?, 'pending', NOW())`,
            [user.id, dealerName, providerKey, expectedFilename]
          );
          console.log('Feed request stored in database:', {
            userId: user.id,
            dealershipName: dealerName,
            providerKey,
            expectedFilename
          });
        } catch (dbError) {
          console.error('Error storing feed request in database:', dbError);
          // Don't fail the request if database storage fails
        }

        // Return the message ID for threading
        return NextResponse.json({ 
          ok: true, 
          messageId: smtpResult.messageId 
        });
      } else {
        console.error('Failed to send initial request email via SMTP:', smtpResult.error);
        throw new Error(`SMTP error: ${smtpResult.error?.message}`);
      }
    }
    
    return NextResponse.json({ ok: true });
    
  } catch (error) {
    console.error('❌ Feed request error:', error);
    
    if (error instanceof z.ZodError) {
      console.error('📧 Validation errors:', JSON.stringify(error.issues, null, 2));
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to send feed request' },
      { status: 500 }
    );
  }
}
