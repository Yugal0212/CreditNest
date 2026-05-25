const logger = require('../utils/logger');
const axios = require('axios');

/**
 * SMS Service - Fast2SMS with DLT Support
 * 
 * Note: Fast2SMS now requires DLT registration for free SMS.
 * This service uses paid credits until DLT is configured.
 * 
 * Features:
 * - Works with paid credits (₹95 in your account)
 * - Reliable SMS delivery (2-5 seconds)
 * - Console fallback for development
 */

/**
 * Initialize Fast2SMS
 */
const initializeFast2SMS = () => {
  const apiKey = process.env.FAST2SMS_API_KEY;
  
  if (!apiKey) {
    logger.error('❌ Fast2SMS API Key not configured in .env file');
    throw new Error('Fast2SMS API Key is required. Please add FAST2SMS_API_KEY to .env');
  }

  logger.info('✅ Fast2SMS SMS service initialized');
  logger.info('💰 Using paid credits (Your balance: ₹95)');
  logger.info('ℹ️  SMS cost: ~₹0.15-0.25 per message');
  
  return {
    apiKey,
    // Use quick route for paid SMS (works without DLT for OTPs)
    route: 'q', // Quick route - works with paid credits without DLT
  };
};

/**
 * Send SMS via Fast2SMS
 * 
 * @param {string} phone - Phone number with country code (e.g., +919723023403)
 * @param {string} message - The message to send
 * @returns {Promise<Object>} Result object with success status
 */
const sendSMS = async (phone, message) => {
  try {
    logger.info(`📤 Sending SMS to ${phone}`);

    const fast2smsConfig = initializeFast2SMS();

    // Format phone number (remove +91 for Indian numbers)
    let formattedPhone = phone.replace(/\D/g, ''); // Remove non-digits
    
    // Fast2SMS expects numbers without country code
    if (formattedPhone.startsWith('91') && formattedPhone.length === 12) {
      formattedPhone = formattedPhone.substring(2); // Remove 91 prefix
    }

    // Fast2SMS API endpoint for PAID SMS
    const url = 'https://www.fast2sms.com/dev/bulkV2';
    
    // For PAID SMS: Use quick route which works without DLT
    // Cost: ~₹0.15-0.25 per SMS
    const params = {
      authorization: fast2smsConfig.apiKey,
      route: fast2smsConfig.route, // 'q' for quick (paid)
      message: message,
      numbers: formattedPhone, // 10-digit number without country code
      flash: 0, // Normal SMS (not flash)
    };

    // Log the request for debugging
    logger.info('📡 Fast2SMS Request:', {
      url,
      route: fast2smsConfig.route,
      numbers: formattedPhone,
      messageLength: message.length,
      cost: '~₹0.15-0.25',
    });

    // Send SMS via Fast2SMS
    const response = await axios.get(url, { params });

    // Log response for debugging
    logger.info('📥 Fast2SMS Response:', JSON.stringify(response.data, null, 2));

    if (response.data.return === true || response.data.return === 'true') {
      logger.info('✅ SMS sent successfully via Fast2SMS');
      logger.info(`📱 To: +91${formattedPhone}`);
      logger.info(`📝 Message: ${message.substring(0, 50)}${message.length > 50 ? '...' : ''}`);
      logger.info(`💰 Cost: ~₹0.15-0.25 from your balance`);
      logger.info(`💳 Remaining balance: Check Fast2SMS dashboard`);

      return {
        success: true,
        method: 'fast2sms',
        message: 'SMS sent successfully',
        provider: 'Fast2SMS',
        phoneNumber: `+91${formattedPhone}`,
        free: false,
        cost: '~₹0.15-0.25',
      };
    } else {
      logger.error('❌ Fast2SMS API error:', response.data);
      throw new Error(response.data.message || 'Fast2SMS API request failed');
    }
  } catch (error) {
    logger.error('❌ SMS sending failed:', error.message);
    
    // If it's an axios error, provide more details
    if (error.response) {
      logger.error('Fast2SMS Error Status:', error.response.status);
      logger.error('Fast2SMS Error Response:', JSON.stringify(error.response.data, null, 2));
      logger.error('Fast2SMS Error Headers:', error.response.headers);
    } else if (error.request) {
      logger.error('Fast2SMS No Response - Request was made but no response received');
      logger.error('Request details:', error.request);
    } else {
      logger.error('Fast2SMS Error Details:', error);
    }
    
    // FALLBACK: Console OTP for development (when Fast2SMS fails)
    logger.warn('⚠️  Fast2SMS failed - Using CONSOLE FALLBACK');
    logger.warn('📱 SMS will be displayed in console only');
    logger.warn('💡 Tip: Consider using Firebase Phone Auth for free SMS');
    
    // Extract OTP from message
    const otpMatch = message.match(/\b\d{6}\b/);
    const otp = otpMatch ? otpMatch[0] : 'N/A';
    
    console.log('\n' + '='.repeat(80));
    console.log('🔐 OTP VERIFICATION CODE (CONSOLE FALLBACK - SMS FAILED)');
    console.log('='.repeat(80));
    console.log(`📱 Phone: ${phone}`);
    console.log(`🔑 OTP: ${otp}`);
    console.log(`⏰ Expires: 10 minutes`);
    console.log(`ℹ️  Reason: Fast2SMS API failed`);
    console.log(`💡 Use this OTP to test registration`);
    console.log('='.repeat(80) + '\n');
    
    logger.info(`✅ OTP logged to console for development: ${otp}`);
    
    return {
      success: true,
      method: 'console',
      message: 'OTP displayed in console (Fast2SMS unavailable)',
      provider: 'Console Fallback',
      phoneNumber: phone,
      free: true,
    };
  }
};

/**
 * Send OTP SMS via Fast2SMS
 */
const sendOTPSMS = async (phone, otp) => {
  const message = `Your CreditNest verification code is: ${otp}\n\nThis code expires in 5 minutes.\nDo not share this code with anyone.`;
  
  logger.info(`📱 Sending OTP ${otp} to ${phone}`);
  
  return sendSMS(phone, message);
};

/**
 * Send welcome SMS via Fast2SMS
 */
const sendWelcomeSMS = async (phone, name, shopName) => {
  const loginUrl = process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}/login` : 'our app';
  const message = `You have been registered on CreditNest by ${shopName}. Login at ${loginUrl} using your mobile or email.`;
  return sendSMS(phone, message);
};

/**
 * Send payment reminder SMS via Fast2SMS
 */
const sendPaymentReminderSMS = async (phone, name, amount, shopName) => {
  const message = `Hi ${name}, you have a pending credit of ₹${amount} at ${shopName}. Please clear your dues. Thank you!`;
  return sendSMS(phone, message);
};

module.exports = {
  sendSMS,
  sendOTPSMS,
  sendWelcomeSMS,
  sendPaymentReminderSMS,
};
