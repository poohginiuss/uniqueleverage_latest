import { MailAdapter, MailProvider, MailCredentials, SmtpCredentials, GmailTokens, GraphTokens } from './types';
import { smtpAdapter } from './smtp';
import { gmailAdapter } from './gmail';
import { graphAdapter } from './graph';

export function getMailAdapter(provider: MailProvider, credentials: MailCredentials): MailAdapter {
  switch (provider) {
    case 'smtp':
      return smtpAdapter(credentials as SmtpCredentials);
    
    case 'gmail':
      return gmailAdapter(credentials as GmailTokens);
    
    case 'graph':
      return graphAdapter(credentials as GraphTokens);
    
    default:
      throw new Error(`Unsupported mail provider: ${provider}`);
  }
}

// Helper function to create SMTP credentials for Outlook/Office 365
export function createSmtpCredentials(user: string, password: string): SmtpCredentials {
  return {
    host: 'smtp.office365.com',
    port: 587,
    secure: false,
    auth: {
      user,
      pass: password
    }
  };
}

// Helper function to create Gmail tokens from localStorage
export function createGmailTokens(accessToken: string, refreshToken?: string): GmailTokens {
  return {
    accessToken,
    refreshToken
  };
}

// Helper function to create Graph tokens from localStorage
export function createGraphTokens(accessToken: string, refreshToken?: string): GraphTokens {
  return {
    accessToken,
    refreshToken
  };
}
