const prisma = require('../config/database');
const generateOTP = require('../utils/generateOTP');
const { sendOTPEmail } = require('./email.service');
const { sendOTPSMS } = require('./sms.service');
const logger = require('../utils/logger');
const { OTP } = require('../config/constants');

/**
 * Generate and send OTP
 */
const sendOTP = async (identifier, type, method = 'email') => {
  try {
    // Development mode - shorter wait time between requests
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    // Check if recently sent OTP exists (shorter window in development)
    const recentWindow = isDevelopment ? 30 * 1000 : 60 * 1000; // 30 seconds in dev, 1 minute in prod
    const recentOTP = await prisma.oTPVerification.findFirst({
      where: {
        identifier,
        createdAt: {
          gte: new Date(Date.now() - recentWindow),
        },
      },
    });

    if (recentOTP && !isDevelopment) {
      throw new Error('OTP already sent. Please wait 1 minute before requesting again.');
    }

    // Generate random OTP (6 digits)
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + OTP.EXPIRY_MINUTES * 60 * 1000);

    // Delete old OTPs for this identifier
    await prisma.oTPVerification.deleteMany({
      where: { identifier },
    });

    // Store OTP in database
    await prisma.oTPVerification.create({
      data: {
        identifier,
        otp,
        otpType: type,
        expiresAt,
      },
    });

    // Send OTP based on method
    // In development, we allow the request to succeed even if external providers fail,
    // because the OTP is already stored in DB and printed to console below.
    if (method === 'email') {
      try {
        await sendOTPEmail(identifier, otp, type === 'REGISTRATION' ? 'registration' : 'login');
      } catch (sendError) {
        if (!isDevelopment) throw sendError;
        logger.warn('OTP email sending failed in development; continuing with console OTP.', {
          identifier,
          error: String(sendError?.message || sendError),
        });
      }
    } else if (method === 'sms') {
      try {
        await sendOTPSMS(identifier, otp);
      } catch (sendError) {
        if (!isDevelopment) throw sendError;
        logger.warn('OTP SMS sending failed in development; continuing with console OTP.', {
          identifier,
          error: String(sendError?.message || sendError),
        });
      }
    }

    // Log OTP prominently in development mode
    if (isDevelopment) {
      console.log('\n' + '='.repeat(70));
      console.log('🔐 OTP GENERATED (DEVELOPMENT MODE)');
      console.log('='.repeat(70));
      console.log(`📱 Phone/Email: ${identifier}`);
      console.log(`🔢 OTP Code: ${otp}`);
      console.log(`⏰ Expires in: ${OTP.EXPIRY_MINUTES} minutes`);
      console.log(`📝 Type: ${type}`);
      console.log('='.repeat(70) + '\n');
    }

    logger.info(`OTP sent to ${identifier} via ${method}`);

    return {
      success: true,
      message: 'OTP sent successfully',
      expiresIn: OTP.EXPIRY_MINUTES * 60, // seconds
    };
  } catch (error) {
    logger.error('Send OTP error:', error);
    throw error;
  }
};

/**
 * Verify OTP
 */
const verifyOTP = async (identifier, otp) => {
  try {
    // Find OTP record
    const otpRecord = await prisma.oTPVerification.findFirst({
      where: {
        identifier,
        isVerified: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!otpRecord) {
      throw new Error('Invalid OTP or OTP not found');
    }

    // Check if expired
    if (new Date() > otpRecord.expiresAt) {
      await prisma.oTPVerification.delete({ where: { id: otpRecord.id } });
      throw new Error('OTP has expired. Please request a new one.');
    }

    // Check attempts
    if (otpRecord.attempts >= OTP.MAX_ATTEMPTS) {
      await prisma.oTPVerification.delete({ where: { id: otpRecord.id } });
      throw new Error('Maximum OTP attempts exceeded. Please request a new OTP.');
    }

    // Verify OTP
    if (otpRecord.otp !== otp) {
      // Increment attempts
      await prisma.oTPVerification.update({
        where: { id: otpRecord.id },
        data: { attempts: otpRecord.attempts + 1 },
      });
      throw new Error('Invalid OTP. Please try again.');
    }

    // Mark as verified
    await prisma.oTPVerification.update({
      where: { id: otpRecord.id },
      data: { isVerified: true },
    });

    // Delete the OTP record after successful verification
    await prisma.oTPVerification.delete({ where: { id: otpRecord.id } });

    logger.info(`OTP verified for ${identifier}`);

    return { success: true, message: 'OTP verified successfully' };
  } catch (error) {
    logger.error('Verify OTP error:', error);
    throw error;
  }
};

/**
 * Clean up expired OTPs (can be run as a cron job)
 */
const cleanupExpiredOTPs = async () => {
  try {
    const result = await prisma.oTPVerification.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    logger.info(`Cleaned up ${result.count} expired OTPs`);
    return result.count;
  } catch (error) {
    logger.error('Cleanup OTPs error:', error);
    throw error;
  }
};

module.exports = {
  sendOTP,
  verifyOTP,
  cleanupExpiredOTPs,
};
