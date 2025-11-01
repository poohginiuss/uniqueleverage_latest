import { getMailAdapter, createSmtpCredentials } from '@/mail/factory';

export interface EmailOptions {
  to: string;
  cc?: string[];
  subject: string;
  text: string;
  html: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: {
    code: string;
    message: string;
    provider: string;
  };
}

/**
 * Standardized email service that uses the mail factory system
 * Can be configured to use different sender emails via environment variable
 */
export class EmailService {
  private static instance: EmailService;
  private mailAdapter: any;

  private constructor() {
    this.initializeMailAdapter();
  }

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  private initializeMailAdapter(): void {
    const senderEmail = process.env.EMAIL_SENDER;
    const smtpPassword = process.env.OUTLOOK_SMTP_PASSWORD;

    if (!senderEmail) {
      throw new Error('EMAIL_SENDER environment variable is required');
    }

    if (!smtpPassword) {
      throw new Error('OUTLOOK_SMTP_PASSWORD environment variable is required');
    }

    console.log(`📧 Initializing email service with sender: ${senderEmail}`);

    const smtpCredentials = createSmtpCredentials(senderEmail, smtpPassword);
    this.mailAdapter = getMailAdapter('smtp', smtpCredentials);
  }

  /**
   * Send an email using the configured sender
   */
  public async sendEmail(options: EmailOptions): Promise<EmailResult> {
    try {
      const result = await this.mailAdapter.send({
        to: options.to,
        cc: options.cc,
        subject: options.subject,
        text: options.text,
        html: options.html
      });

      console.log(`✅ Email sent successfully to ${options.to}`, {
        messageId: result.messageId,
        subject: options.subject
      });

      return result;
    } catch (error) {
      console.error('❌ Email send failed:', error);
      return {
        success: false,
        error: {
          code: 'EMAIL_SEND_ERROR',
          message: error instanceof Error ? error.message : 'Unknown email error',
          provider: 'smtp'
        }
      };
    }
  }

  /**
   * Get the current sender email address
   */
  public getSenderEmail(): string {
    const senderEmail = process.env.EMAIL_SENDER;
    if (!senderEmail) {
      throw new Error('EMAIL_SENDER environment variable is required');
    }
    return senderEmail;
  }

  /**
   * Test the email configuration
   */
  public async testEmail(to: string = 'admin@uniqueleverage.com'): Promise<EmailResult> {
    return this.sendEmail({
      to,
      subject: `Test Email from ${this.getSenderEmail()}`,
      text: `This is a test email from ${this.getSenderEmail()} to verify the email system is working.`,
      html: `<p>This is a test email from <strong>${this.getSenderEmail()}</strong> to verify the email system is working.</p>`
    });
  }
}

// Export a singleton instance for easy use
export const emailService = EmailService.getInstance();
