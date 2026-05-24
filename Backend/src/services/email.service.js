const nodemailer = require('nodemailer');
const logger = require('../utils/logger');
const { APP_NAME } = require('../config/constants');

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Send email
 */
const sendEmail = async (to, subject, text, html) => {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || `"${APP_NAME}" <noreply@creditnest.com>`,
      to,
      subject,
      text,
      html,
    });

    logger.info(`Email sent: ${info.messageId} to ${to}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error(`Email error to ${to}:`, error);
    throw error;
  }
};

/**
 * Send OTP email
 */
const sendOTPEmail = async (email, otp, type = 'verification') => {
  const subject = `${APP_NAME} - OTP Verification`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .otp-box { background: white; border: 2px dashed #667eea; padding: 20px; text-align: center; margin: 20px 0; border-radius: 10px; }
        .otp { font-size: 36px; font-weight: bold; color: #667eea; letter-spacing: 8px; }
        .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
        .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 5px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">🏪 ${APP_NAME}</h1>
        </div>
        <div class="content">
          <h2 style="color: #667eea;">OTP Verification</h2>
          <p>Hello,</p>
          <p>Your OTP for ${type} is:</p>
          
          <div class="otp-box">
            <div class="otp">${otp}</div>
          </div>
          
          <p><strong>Valid for 5 minutes only.</strong></p>
          
          <div class="warning">
            <strong>⚠️ Security Notice:</strong> Never share this OTP with anyone. ${APP_NAME} will never ask for your OTP via call or SMS.
          </div>
          
          <p>If you didn't request this OTP, please ignore this email.</p>
        </div>
        <div class="footer">
          <p>© 2026 ${APP_NAME}. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `Your ${APP_NAME} OTP is: ${otp}. Valid for 5 minutes. If you didn't request this, please ignore this email.`;

  return sendEmail(email, subject, text, html);
};

/**
 * Send welcome email to customer
 */
const sendWelcomeEmail = async (email, name, shopName, phone) => {
  const loginUrl = process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}/login` : '/login';
  const subject = `Welcome to ${shopName} - ${APP_NAME}`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .info-box { background: white; padding: 20px; margin: 20px 0; border-radius: 10px; border: 1px solid #e5e7eb; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">🎉 Welcome to ${shopName}!</h1>
        </div>
        <div class="content">
          <p>Dear ${name},</p>
          <p>You have been registered on ${APP_NAME} by <strong>${shopName}</strong>.</p>
          
          <div class="info-box">
            <h3 style="color: #667eea; margin-top: 0;">Login Details</h3>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Phone:</strong> ${phone}</p>
            <p style="color: #666; font-size: 14px; margin-top: 15px;">
              Login at ${loginUrl} using your mobile or email. You'll receive an OTP to verify your identity.
            </p>
          </div>
          
          <center>
            <a href="${loginUrl}" class="button">Login Now</a>
          </center>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `You have been registered on ${APP_NAME} by ${shopName}. Login at ${loginUrl} using your mobile or email.`;

  return sendEmail(email, subject, text, html);
};

module.exports = {
  sendEmail,
  sendOTPEmail,
  sendWelcomeEmail,
};
