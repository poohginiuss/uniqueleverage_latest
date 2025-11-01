export interface SendArgs {
  to: string;
  cc?: string[];
  subject: string;
  text: string;
  html: string;
  inReplyTo?: string;
  references?: string;
}

export interface SendResult {
  success: boolean;
  messageId?: string;
  error?: {
    code: string;
    message: string;
    provider: string;
  };
}

export interface MailAdapter {
  send(args: SendArgs): Promise<SendResult>;
  refreshToken?(): Promise<TokenResult>;
  validateToken?(): Promise<boolean>;
}

export interface TokenResult {
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
  error?: string;
}

export type MailProvider = 'smtp' | 'gmail' | 'graph';

export interface SmtpCredentials {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

export interface GmailTokens {
  accessToken: string;
  refreshToken?: string;
}

export interface GraphTokens {
  accessToken: string;
  refreshToken?: string;
}

export type MailCredentials = SmtpCredentials | GmailTokens | GraphTokens;
