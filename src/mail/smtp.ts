import * as nodemailer from 'nodemailer';
import { MailAdapter, SendArgs, SendResult, SmtpCredentials } from './types';

export function smtpAdapter(credentials: SmtpCredentials): MailAdapter {
  const transporter = nodemailer.createTransport({
    host: credentials.host,
    port: credentials.port,
    secure: credentials.secure,
    auth: credentials.auth
  });

  return {
    async send(args: SendArgs): Promise<SendResult> {
      try {
        const mailOptions = {
          from: credentials.auth.user,
          to: args.to,
          cc: args.cc,
          subject: args.subject,
          text: args.text,
          html: args.html,
          inReplyTo: args.inReplyTo,
          references: args.references
        };

        const result = await transporter.sendMail(mailOptions);
        
        return {
          success: true,
          messageId: result.messageId
        };
      } catch (error) {
        console.error('SMTP send error:', error);
        return {
          success: false,
          error: {
            code: 'SMTP_SEND_ERROR',
            message: error instanceof Error ? error.message : 'Unknown SMTP error',
            provider: 'smtp'
          }
        };
      }
    },

    async validateToken(): Promise<boolean> {
      try {
        await transporter.verify();
        return true;
      } catch (error) {
        console.error('SMTP validation error:', error);
        return false;
      }
    }
  };
}
