import { google } from 'googleapis';

// Google OAuth 2.0 configuration
export const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID || 'test-client-id',
  process.env.GOOGLE_CLIENT_SECRET || 'test-client-secret',
  process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback'
);

// Generate the authorization URL
export function getGoogleAuthUrl(): string {
  const scopes = [
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile'
  ];

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent'
  });
}

// Exchange authorization code for tokens
export async function getTokensFromCode(code: string) {
  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    return tokens;
  } catch (error) {
    console.error('Error getting tokens:', error);
    throw error;
  }
}

// Get user info from Google
export async function getUserInfo(accessToken: string) {
  try {
    oauth2Client.setCredentials({ access_token: accessToken });
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();
    return userInfo.data;
  } catch (error) {
    console.error('Error getting user info:', error);
    throw error;
  }
}

// Test Gmail API access
export async function testGmailAccess(accessToken: string) {
  try {
    oauth2Client.setCredentials({ access_token: accessToken });
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    
    // Get user's profile to verify access
    const profile = await gmail.users.getProfile({ userId: 'me' });
    return {
      success: true,
      email: profile.data.emailAddress,
      messagesTotal: profile.data.messagesTotal
    };
  } catch (error) {
    console.error('Error testing Gmail access:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Send email via Gmail API
export async function sendGmailEmail(options: {
  to: string;
  cc?: string[];
  subject: string;
  text: string;
  html: string;
  accessToken: string;
  inReplyTo?: string;
  references?: string;
}) {
  try {
    oauth2Client.setCredentials({ access_token: options.accessToken });
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // Get the authenticated user's email address for logging
    const profile = await gmail.users.getProfile({ userId: 'me' });
    const fromEmail = profile.data.emailAddress;
    console.log('Gmail API: Sending email from authenticated account:', fromEmail);
    console.log('Gmail API: Access token preview:', options.accessToken.substring(0, 20) + '...');
    console.log('Gmail API: Email details:', {
      to: options.to,
      cc: options.cc,
      subject: options.subject,
      inReplyTo: options.inReplyTo,
      references: options.references
    });

    // Create email message (Gmail API automatically sets From to authenticated account)
    const emailLines = [
      `To: ${options.to}`,
      ...(options.cc ? [`Cc: ${options.cc.join(', ')}`] : []),
      `Subject: ${options.subject}`,
      ...(options.inReplyTo ? [`In-Reply-To: ${options.inReplyTo}`] : []),
      ...(options.references ? [`References: ${options.references}`] : []),
      'Content-Type: text/html; charset=utf-8',
      '',
      options.html
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
      messageId: result.data.id
    };
  } catch (error) {
    console.error('Error sending Gmail email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
