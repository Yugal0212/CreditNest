const axios = require('axios');
const logger = require('../utils/logger');
const { APP_NAME } = require('../config/constants');

// EmailJS Credentials
const EMAILJS_URL = 'https://api.emailjs.com/api/v1.0/email/send';
const SERVICE_ID = process.env.EMAILJS_SERVICE_ID;
const TEMPLATE_ID = process.env.EMAILJS_TEMPLATE_ID;
const PUBLIC_KEY = process.env.EMAILJS_PUBLIC_KEY;
const PRIVATE_KEY = process.env.EMAILJS_PRIVATE_KEY;

/**
 * Send email using EmailJS REST API
 */
const sendEmail = async (to, templateParams) => {
  try {
    const response = await axios.post(EMAILJS_URL, {
      service_id: SERVICE_ID,
      template_id: TEMPLATE_ID,
      user_id: PUBLIC_KEY,
      accessToken: PRIVATE_KEY,
      template_params: {
        to_email: to,
        app_name: APP_NAME,
        ...templateParams,
      },
    });

    logger.info(`Email sent via EmailJS to ${to}`);
    return { success: true, data: response.data };
  } catch (error) {
    const errorMsg = error.response?.data || error.message;
    logger.error(`Email error to ${to}:`, errorMsg);
    throw new Error(`Failed to send email via EmailJS: ${errorMsg}`);
  }
};

/**
 * Send OTP email
 */
const sendOTPEmail = async (email, otp, type = 'verification') => {
  const text = `Your ${APP_NAME} OTP is: ${otp}. Valid for 5 minutes. If you didn't request this, please ignore this email.`;
  
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
          <img src="${process.env.FRONTEND_URL}/CreditNest.png" alt="${APP_NAME} Logo" style="max-height: 55px; filter: drop-shadow(0px 2px 4px rgba(0,0,0,0.2));" />
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

  return sendEmail(email, {
    otp: otp,
    type: type,
    message: text,
    html_content: html,
    subject: `${APP_NAME} - OTP Verification`,
  });
};

/**
 * Send welcome email to customer
 */
const sendWelcomeEmail = async (email, name, shopName, phone) => {
  const loginUrl = process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}/login` : '/login';
  const text = `You have been registered on ${APP_NAME} by ${shopName}. Login at ${loginUrl} using your mobile or email.`;

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
          <img src="${process.env.FRONTEND_URL}/CreditNest.png" alt="${APP_NAME} Logo" style="max-height: 55px; filter: drop-shadow(0px 2px 4px rgba(0,0,0,0.2));" />
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

  return sendEmail(email, {
    to_name: name,
    shop_name: shopName,
    message: text,
    html_content: html,
    subject: `Welcome to ${shopName} - ${APP_NAME}`,
  });
};

module.exports = {
  sendEmail,
  sendOTPEmail,
  sendWelcomeEmail,
};
