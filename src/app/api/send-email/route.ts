import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getMailAdapter, createSmtpCredentials, createGmailTokens, createGraphTokens } from '@/mail/factory';
import { MailProvider } from '@/mail/types';

const SendEmailSchema = z.object({
  provider: z.enum(['smtp', 'gmail', 'graph']),
  to: z.string().email(),
  cc: z.array(z.string().email()).optional(),
  subject: z.string().min(1),
  text: z.string().min(1),
  html: z.string().min(1),
  inReplyTo: z.string().optional(),
  references: z.string().optional(),
  // Provider-specific credentials
  smtpCredentials: z.object({
    user: z.string().email(),
    password: z.string().min(1)
  }).optional(),
  gmailTokens: z.object({
    accessToken: z.string().min(1),
    refreshToken: z.string().optional()
  }).optional(),
  graphTokens: z.object({
    accessToken: z.string().min(1),
    refreshToken: z.string().optional()
  }).optional()
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = SendEmailSchema.parse(body);
    
    const { provider, to, cc, subject, text, html, inReplyTo, references } = validatedData;
    
    // Get the appropriate adapter based on provider
    let adapter;
    
    switch (provider) {
      case 'smtp':
        if (!validatedData.smtpCredentials) {
          return NextResponse.json({ 
            error: 'SMTP credentials required for SMTP provider' 
          }, { status: 400 });
        }
        const smtpCreds = createSmtpCredentials(
          validatedData.smtpCredentials.user,
          validatedData.smtpCredentials.password
        );
        adapter = getMailAdapter('smtp', smtpCreds);
        break;
        
      case 'gmail':
        if (!validatedData.gmailTokens) {
          return NextResponse.json({ 
            error: 'Gmail tokens required for Gmail provider' 
          }, { status: 400 });
        }
        const gmailTokens = createGmailTokens(
          validatedData.gmailTokens.accessToken,
          validatedData.gmailTokens.refreshToken
        );
        adapter = getMailAdapter('gmail', gmailTokens);
        break;
        
      case 'graph':
        if (!validatedData.graphTokens) {
          return NextResponse.json({ 
            error: 'Graph tokens required for Graph provider' 
          }, { status: 400 });
        }
        const graphTokens = createGraphTokens(
          validatedData.graphTokens.accessToken,
          validatedData.graphTokens.refreshToken
        );
        adapter = getMailAdapter('graph', graphTokens);
        break;
        
      default:
        return NextResponse.json({ 
          error: `Unsupported provider: ${provider}` 
        }, { status: 400 });
    }
    
    // Send the email
    const result = await adapter.send({
      to,
      cc,
      subject,
      text,
      html,
      inReplyTo,
      references
    });
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        messageId: result.messageId
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('Send email error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: error.issues
        }
      }, { status: 400 });
    }
    
    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    }, { status: 500 });
  }
}
