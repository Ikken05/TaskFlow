import nodemailer from 'nodemailer';

// Email configuration (you'll need to set these environment variables)
const EMAIL_HOST = process.env.EMAIL_HOST || 'smtp-mail.outlook.com';
const EMAIL_PORT = parseInt(process.env.EMAIL_PORT || '587');
const EMAIL_USER = process.env.EMAIL_USER || '';
const EMAIL_PASS = process.env.EMAIL_PASS || '';
const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@taskflow.com';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Create transporter
const createTransporter = () => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] 📧 Creating email transporter with config:`);
  console.log(`[${timestamp}] Host: ${EMAIL_HOST}`);
  console.log(`[${timestamp}] Port: ${EMAIL_PORT}`);
  console.log(`[${timestamp}] Secure: ${EMAIL_PORT === 465}`);
  console.log(`[${timestamp}] User: ${EMAIL_USER ? '***configured***' : 'NOT_SET'}`);
  console.log(`[${timestamp}] Pass: ${EMAIL_PASS ? '***configured***' : 'NOT_SET'}`);

  return nodemailer.createTransport({
    host: EMAIL_HOST,
    port: EMAIL_PORT,
    secure: EMAIL_PORT === 465,
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS
    }
  });
};

export const sendVerificationEmail = async (
  email: string,
  firstName: string,
  verificationToken: string
): Promise<void> => {
  const transporter = createTransporter();

  const verificationUrl = `${FRONTEND_URL}/verify-email?token=${verificationToken}`;

  const mailOptions = {
    from: EMAIL_FROM,
    to: email,
    subject: 'Verify your TaskFlow account',
    html: `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <h2 style="color: #333; text-align: center;">Welcome to TaskFlow!</h2>
        <p>Hi ${firstName},</p>
        <p>Thank you for registering with TaskFlow. To complete your registration, please verify your email address by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}"
             style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Verify Email Address
          </a>
        </div>
        <p>If the button above doesn't work, you can also copy and paste the following link into your browser:</p>
        <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
        <p><strong>Note:</strong> This verification link will expire in 24 hours.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">
          If you didn't create an account with TaskFlow, please ignore this email.
        </p>
      </div>
    `
  };

  try {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] 📨 Sending verification email to: ${email}`);
    const result = await transporter.sendMail(mailOptions);
    console.log(`[${timestamp}] ✅ Verification email sent successfully`);
    console.log(`[${timestamp}] Message ID: ${result.messageId}`);
    console.log(`[${timestamp}] Response: ${result.response}`);
  } catch (error: any) {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] ❌ Error sending verification email:`);
    console.error(`[${timestamp}] Error name: ${error.name}`);
    console.error(`[${timestamp}] Error message: ${error.message}`);
    console.error(`[${timestamp}] Error code: ${error.code}`);
    console.error(`[${timestamp}] Error response: ${error.response}`);
    console.error(`[${timestamp}] Stack trace:`, error.stack);
    throw new Error(`Failed to send verification email: ${error.message}`);
  }
};

export const sendPasswordResetEmail = async (
  email: string,
  firstName: string,
  resetToken: string
): Promise<void> => {
  const transporter = createTransporter();

  const resetUrl = `${FRONTEND_URL}/reset-password?token=${resetToken}`;

  const mailOptions = {
    from: EMAIL_FROM,
    to: email,
    subject: 'Reset your TaskFlow password',
    html: `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <h2 style="color: #333; text-align: center;">Password Reset Request</h2>
        <p>Hi ${firstName},</p>
        <p>You recently requested to reset your password for your TaskFlow account. Click the button below to reset it:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}"
             style="background-color: #dc3545; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p>If the button above doesn't work, you can also copy and paste the following link into your browser:</p>
        <p style="word-break: break-all; color: #666;">${resetUrl}</p>
        <p><strong>Note:</strong> This password reset link will expire in 10 minutes for security reasons.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">
          If you didn't request a password reset, please ignore this email or contact our support team if you have concerns.
        </p>
      </div>
    `
  };

  try {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] 📨 Sending password reset email to: ${email}`);
    const result = await transporter.sendMail(mailOptions);
    console.log(`[${timestamp}] ✅ Password reset email sent successfully`);
    console.log(`[${timestamp}] Message ID: ${result.messageId}`);
    console.log(`[${timestamp}] Response: ${result.response}`);
  } catch (error: any) {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] ❌ Error sending password reset email:`);
    console.error(`[${timestamp}] Error name: ${error.name}`);
    console.error(`[${timestamp}] Error message: ${error.message}`);
    console.error(`[${timestamp}] Error code: ${error.code}`);
    console.error(`[${timestamp}] Error response: ${error.response}`);
    console.error(`[${timestamp}] Stack trace:`, error.stack);
    throw new Error(`Failed to send password reset email: ${error.message}`);
  }
};

export const sendWelcomeEmail = async (
  email: string,
  firstName: string
): Promise<void> => {
  const transporter = createTransporter();

  const mailOptions = {
    from: EMAIL_FROM,
    to: email,
    subject: 'Welcome to TaskFlow!',
    html: `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <h2 style="color: #333; text-align: center;">Welcome to TaskFlow!</h2>
        <p>Hi ${firstName},</p>
        <p>Congratulations! Your email has been successfully verified and your TaskFlow account is now active.</p>
        <p>You can now:</p>
        <ul>
          <li>Create and manage tasks</li>
          <li>Collaborate with team members</li>
          <li>Track project progress</li>
          <li>Set up notifications and preferences</li>
        </ul>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${FRONTEND_URL}/dashboard"
             style="background-color: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Go to Dashboard
          </a>
        </div>
        <p>If you have any questions or need help getting started, don't hesitate to reach out to our support team.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">
          Thank you for choosing TaskFlow for your project management needs!
        </p>
      </div>
    `
  };

  try {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] 📨 Sending welcome email to: ${email}`);
    const result = await transporter.sendMail(mailOptions);
    console.log(`[${timestamp}] ✅ Welcome email sent successfully`);
    console.log(`[${timestamp}] Message ID: ${result.messageId}`);
    console.log(`[${timestamp}] Response: ${result.response}`);
  } catch (error: any) {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] ❌ Error sending welcome email (non-critical):`);
    console.error(`[${timestamp}] Error name: ${error.name}`);
    console.error(`[${timestamp}] Error message: ${error.message}`);
    console.error(`[${timestamp}] Error code: ${error.code}`);
    console.error(`[${timestamp}] Error response: ${error.response}`);
    // Don't throw error for welcome email as it's not critical
  }
};