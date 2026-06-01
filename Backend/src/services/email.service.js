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
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #334155; margin: 0; padding: 0; background-color: #f8fafc; }
        .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); border: 1px solid #e2e8f0; }
        .header { background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: white; padding: 40px 30px; text-align: center; }
        .logo-text { font-size: 32px; font-weight: 800; letter-spacing: -1px; margin: 0; display: inline-flex; align-items: center; justify-content: center; background: white; color: #4f46e5; padding: 8px 24px; border-radius: 99px; box-shadow: 0 4px 14px 0 rgba(0,0,0,0.1); }
        .content { padding: 40px 30px; }
        h2 { color: #1e293b; font-size: 24px; font-weight: 700; margin-top: 0; margin-bottom: 20px; }
        p { margin: 0 0 16px 0; color: #475569; font-size: 16px; }
        .otp-container { background: #f1f5f9; border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0; border: 2px dashed #cbd5e1; }
        .otp { font-size: 42px; font-weight: 800; color: #4f46e5; letter-spacing: 12px; font-family: monospace; margin: 0; }
        .validity { font-size: 14px; color: #64748b; margin-top: 10px; font-weight: 600; }
        .warning { background: #fffbeb; border-left: 4px solid #f59e0b; padding: 16px 20px; margin: 30px 0; border-radius: 0 8px 8px 0; font-size: 14px; color: #92400e; }
        .footer { background: #f8fafc; padding: 24px 30px; text-align: center; border-top: 1px solid #e2e8f0; }
        .footer p { font-size: 13px; color: #94a3b8; margin: 0; }
        .divider { height: 1px; background: #e2e8f0; margin: 30px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo-text">${APP_NAME}</div>
        </div>
        <div class="content">
          <h2>OTP Verification</h2>
          <p>Hello,</p>
          <p>You recently requested to verify your identity for <strong>${type}</strong>. Your One-Time Password (OTP) is:</p>
          
          <div class="otp-container">
            <div class="otp">${otp}</div>
            <div class="validity">Valid for 5 minutes only</div>
          </div>
          
          <div class="warning">
            <strong style="color: #b45309;">⚠️ Security Notice:</strong> Please do not share this OTP with anyone. ${APP_NAME} personnel will never ask for your password or OTP.
          </div>
          
          <p>If you did not request this OTP, please ignore this email or contact support if you have concerns.</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
          <p style="margin-top: 8px;">This is an automated message, please do not reply.</p>
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
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #334155; margin: 0; padding: 0; background-color: #f8fafc; }
        .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); border: 1px solid #e2e8f0; }
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 40px 30px; text-align: center; }
        .logo-text { font-size: 32px; font-weight: 800; letter-spacing: -1px; margin: 0; display: inline-flex; align-items: center; justify-content: center; background: white; color: #059669; padding: 8px 24px; border-radius: 99px; box-shadow: 0 4px 14px 0 rgba(0,0,0,0.1); }
        .content { padding: 40px 30px; }
        h2 { color: #1e293b; font-size: 24px; font-weight: 700; margin-top: 0; margin-bottom: 20px; }
        p { margin: 0 0 16px 0; color: #475569; font-size: 16px; }
        .details-box { background: #f1f5f9; border-radius: 12px; padding: 24px; margin: 30px 0; border: 1px solid #e2e8f0; }
        .details-box p { margin: 0 0 10px 0; color: #334155; }
        .details-box p:last-child { margin: 0; }
        .details-box strong { color: #0f172a; }
        .btn-container { text-align: center; margin: 30px 0; }
        .btn { display: inline-block; background: #10b981; color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.2); transition: background 0.2s; }
        .footer { background: #f8fafc; padding: 24px 30px; text-align: center; border-top: 1px solid #e2e8f0; }
        .footer p { font-size: 13px; color: #94a3b8; margin: 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo-text">${APP_NAME}</div>
        </div>
        <div class="content">
          <h2>Welcome to ${APP_NAME}! 🎉</h2>
          <p>Hi <strong>${name}</strong>,</p>
          <p>We are thrilled to let you know that you have been successfully added as a customer at <strong>${shopName}</strong> using the ${APP_NAME} platform.</p>
          
          <div class="details-box">
            <p><strong>Your Account Details:</strong></p>
            <p><strong>Shop:</strong> ${shopName}</p>
            <p><strong>Phone:</strong> ${phone}</p>
          </div>
          
          <p>You can now easily manage your purchases, track your credit balance, and make secure payments directly through our platform.</p>
          
          <div class="btn-container">
            <a href="${loginUrl}" class="btn">Access Your Dashboard</a>
          </div>
          
          <p>If you have any questions, feel free to contact the shop owner or our support team.</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
          <p style="margin-top: 8px;">This email was sent because you were registered as a customer at ${shopName}.</p>
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
