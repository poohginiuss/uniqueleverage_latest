import { MailAdapter, SendArgs, SendResult, GraphTokens } from './types';

export function graphAdapter(tokens: GraphTokens): MailAdapter {
  return {
    async send(args: SendArgs): Promise<SendResult> {
      try {
        // Build the email message for Microsoft Graph API
        const message = {
          message: {
            subject: args.subject,
            body: {
              contentType: 'HTML',
              content: args.html
            },
            toRecipients: [
              {
                emailAddress: {
                  address: args.to
                }
              }
            ],
            ...(args.cc && args.cc.length > 0 && {
              ccRecipients: args.cc.map(email => ({
                emailAddress: {
                  address: email
                }
              }))
            }),
            ...(args.inReplyTo && {
              internetMessageHeaders: [
                {
                  name: 'In-Reply-To',
                  value: args.inReplyTo
                },
                ...(args.references ? [{
                  name: 'References',
                  value: args.references
                }] : [])
              ]
            })
          }
        };

        // Send email via Microsoft Graph API
        const response = await fetch('https://graph.microsoft.com/v1.0/me/sendMail', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${tokens.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(message)
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`Graph API error: ${errorData.error?.message || response.statusText}`);
        }

        // Microsoft Graph doesn't return a message ID for sendMail
        // We'll generate a placeholder or use a different identifier
        const messageId = `graph-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        return {
          success: true,
          messageId
        };
      } catch (error) {
        console.error('Microsoft Graph send error:', error);
        return {
          success: false,
          error: {
            code: 'GRAPH_SEND_ERROR',
            message: error instanceof Error ? error.message : 'Unknown Graph error',
            provider: 'graph'
          }
        };
      }
    },

    async refreshToken(): Promise<import('./types').TokenResult> {
      try {
        // Microsoft Graph token refresh would typically use MSAL
        // For now, return an error as this requires MSAL implementation
        return {
          success: false,
          error: 'Token refresh not implemented for Microsoft Graph'
        };
      } catch (error) {
        console.error('Graph token refresh error:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown token refresh error'
        };
      }
    },

    async validateToken(): Promise<boolean> {
      try {
        // Test token by making a simple Graph API call
        const response = await fetch('https://graph.microsoft.com/v1.0/me', {
          headers: {
            'Authorization': `Bearer ${tokens.accessToken}`
          }
        });

        return response.ok;
      } catch (error) {
        console.error('Graph token validation error:', error);
        return false;
      }
    }
  };
}
