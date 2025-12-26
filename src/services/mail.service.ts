import nodemailer, { Transporter } from "nodemailer";
import { env } from "../config/env";

export interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
}

class MailService {
  private transporter: Transporter;
  private isConnected: boolean = false;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465, // true for 465, false for other ports
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });
  }

  /**
   * Verify the SMTP connection
   * @returns Promise<boolean> - Returns true if connection is successful
   */
  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      this.isConnected = true;
      return true;
    } catch (error) {
      this.isConnected = false;
      console.error("SMTP connection verification failed:", error);
      throw error;
    }
  }

  /**
   * Check if the mail service is connected
   */
  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  /**
   * Send an email
   * @param options - Email options (to, subject, text, html)
   */
  async sendMail(options: EmailOptions) {
    try {
      const mailOptions = {
        from: env.SMTP_USER,
        to: Array.isArray(options.to) ? options.to.join(", ") : options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log("Email sent successfully:", info.messageId);
      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (error) {
      console.error("Error sending email:", error);
      throw error;
    }
  }

  /**
   * Send an email verification email
   */
  async sendVerificationEmail(to: string, verificationToken: string) {
    const verificationUrl = `${env.CORS_ORIGIN}/verify-email?token=${verificationToken}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .button { 
              display: inline-block; 
              padding: 12px 24px; 
              background-color: #007bff; 
              color: #ffffff; 
              text-decoration: none; 
              border-radius: 4px; 
              margin: 20px 0;
            }
            .footer { margin-top: 30px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>Verify Your Email Address</h2>
            <p>Thank you for registering! Please verify your email address by clicking the button below:</p>
            <a href="${verificationUrl}" class="button">Verify Email</a>
            <p>Or copy and paste this link into your browser:</p>
            <p>${verificationUrl}</p>
            <div class="footer">
              <p>If you didn't create an account, you can safely ignore this email.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendMail({
      to,
      subject: "Verify Your Email Address",
      html,
      text: `Please verify your email by visiting: ${verificationUrl}`,
    });
  }

  /**
   * Send a password reset email
   */
  async sendPasswordResetEmail(to: string, resetToken: string) {
    const resetUrl = `${env.CORS_ORIGIN}/reset-password?token=${resetToken}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .button { 
              display: inline-block; 
              padding: 12px 24px; 
              background-color: #dc3545; 
              color: #ffffff; 
              text-decoration: none; 
              border-radius: 4px; 
              margin: 20px 0;
            }
            .footer { margin-top: 30px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>Reset Your Password</h2>
            <p>You requested a password reset. Click the button below to reset your password:</p>
            <a href="${resetUrl}" class="button">Reset Password</a>
            <p>Or copy and paste this link into your browser:</p>
            <p>${resetUrl}</p>
            <div class="footer">
              <p>If you didn't request a password reset, you can safely ignore this email.</p>
              <p>This link will expire in 1 hour.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendMail({
      to,
      subject: "Reset Your Password",
      html,
      text: `Reset your password by visiting: ${resetUrl}`,
    });
  }
}

// Export singleton instance
export const mailService = new MailService();
