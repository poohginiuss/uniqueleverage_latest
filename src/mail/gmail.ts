import { google } from 'googleapis';
import { MailAdapter, SendArgs, SendResult, GmailTokens } from './types';

export function gmailAdapter(tokens: GmailTokens): MailAdapter {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  oauth2Client.setCredentials({
    access_token: tokens.accessToken,
    refresh_token: tokens.refreshToken
  });

  return {
    async send(args: SendArgs): Promise<SendResult> {
      try {
        const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

        console.log('Gmail API: Sending email with access token preview:', tokens.accessToken.substring(0, 20) + '...');
        console.log('Gmail API: Email details:', {
          to: args.to,
          cc: args.cc,
          subject: args.subject,
          inReplyTo: args.inReplyTo,
          references: args.references
        });
        console.log('Gmail API: Threading headers:', {
          inReplyTo: args.inReplyTo,
          references: args.references,
          hasInReplyTo: !!args.inReplyTo,
          hasReferences: !!args.references,
          inReplyToFormatted: args.inReplyTo ? `<${args.inReplyTo}>` : 'none',
          referencesFormatted: args.references ? `<${args.references}>` : 'none'
        });

        // Helper function to ensure messageId has angle brackets
        const formatMessageId = (id: string) => {
          if (!id) return id;
          // Remove existing angle brackets if present
          const cleaned = id.replace(/^<|>$/g, '');
          // Add angle brackets
          return `<${cleaned}>`;
        };

        // Build MIME message (Gmail API automatically sets From to authenticated account)
        const emailLines = [
          `To: ${args.to}`,
          ...(args.cc ? [`Cc: ${args.cc.join(', ')}`] : []),
          `Subject: ${args.subject}`,
          ...(args.inReplyTo ? [`In-Reply-To: ${formatMessageId(args.inReplyTo)}`] : []),
          ...(args.references ? [`References: ${formatMessageId(args.references)}`] : []),
          'Content-Type: text/html; charset=utf-8',
          '',
          args.html
        ];

        const email = emailLines.join('\r\n');
        const encodedEmail = Buffer.from(email).toString('base64url');

        // Send email
        console.log('Gmail API: Attempting to send email...');
        const result = await gmail.users.messages.send({
          userId: 'me',
          requestBody: {
            raw: encodedEmail
          }
        });

        console.log('Gmail API: Email sent successfully:', {
          messageId: result.data.id,
          threadId: result.data.threadId
        });

        return {
          success: true,
          messageId: result.data.id || undefined
        };
      } catch (error) {
        console.error('Gmail send error:', error);
        return {
          success: false,
          error: {
            code: 'GMAIL_SEND_ERROR',
            message: error instanceof Error ? error.message : 'Unknown Gmail error',
            provider: 'gmail'
          }
        };
      }
    },

    async refreshToken(): Promise<import('./types').TokenResult> {
      try {
        const { credentials } = await oauth2Client.refreshAccessToken();
        return {
          success: true,
          accessToken: credentials.access_token || undefined,
          refreshToken: credentials.refresh_token || undefined
        };
      } catch (error) {
        console.error('Gmail token refresh error:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown token refresh error'
        };
      }
    },

    async validateToken(): Promise<boolean> {
      try {
        // Simple validation: check if token exists and has correct format
        if (!tokens.accessToken || !tokens.accessToken.startsWith('ya29.')) {
          return false;
        }
        
        // For gmail.send scope, we can't test with getProfile (requires gmail.readonly)
        // Just validate token format and return true
        return true;
      } catch (error) {
        console.error('Gmail token validation error:', error);
        return false;
      }
    }
  };
}
