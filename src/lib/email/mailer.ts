import nodemailer from 'nodemailer';

export interface EmailOptions {
  to: string;
  cc?: string[];
  subject: string;
  text: string;
  html: string;
}

export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; messageId?: string }> {
  const transporter = nodemailer.createTransport({
    host: 'smtp.office365.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: 'integrations@uniqueleverage.com',
      pass: process.env.OUTLOOK_SMTP_PASSWORD
    }
  });

  const mailOptions = {
    from: 'support@uniqueleverage.com',
    to: options.to,
    cc: options.cc,
    replyTo: 'support@uniqueleverage.com',
    subject: options.subject,
    text: options.text,
    html: options.html
  };

  try {
    const result = await transporter.sendMail(mailOptions);
    return {
      success: true,
      messageId: result.messageId
    };
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send email');
  }
}
