const prisma = require('../config/database');
const generateOTP = require('../utils/generateOTP');
const { sendOTPEmail } = require('./email.service');
const { sendOTPSMS } = require('./sms.service');
const logger = require('../utils/logger');
const { OTP } = require('../config/constants');

const buildOtpTargets = (identifierOrTargets, method) => {
  if (typeof identifierOrTargets === 'string') {
    return [{ identifier: identifierOrTargets, method }];
  }

  if (!identifierOrTargets || typeof identifierOrTargets !== 'object') {
    return [];
  }

  const targets = [];
  if (identifierOrTargets.email) {
    targets.push({ identifier: identifierOrTargets.email, method: 'email' });
  }
  if (identifierOrTargets.phone) {
    targets.push({ identifier: identifierOrTargets.phone, method: 'sms' });
  }

  return targets;
};

const getOtpEmailType = (type) => {
  if (type === 'REGISTRATION') return 'registration';
  if (type === 'RESET_PASSWORD') return 'password reset';
  return 'login';
};

/**
 * Generate and send OTP
 */
const sendOTP = async (identifierOrTargets, type, method = 'email') => {
  try {
    // Development mode - shorter wait time between requests
    const isDevelopment = process.env.NODE_ENV === 'development';
    const targets = buildOtpTargets(identifierOrTargets, method);
    const uniqueIdentifiers = [...new Set(targets.map((target) => target.identifier))];

    if (uniqueIdentifiers.length === 0) {
      throw new Error('No valid OTP destination found');
    }
    
      // Block requests while locked
      const lockedRecord = await prisma.oTPVerification.findFirst({
        where: {
          identifier: { in: uniqueIdentifiers },
          lockedUntil: { gt: new Date() },
        },
        orderBy: { lockedUntil: 'desc' },
      });

      if (lockedRecord) {
        throw new Error('Account locked due to multiple incorrect OTP attempts. Please try again after 10 minutes.');
      }

      // Enforce per-identifier rate limit (max requests per hour)
      const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const requestCounts = await Promise.all(
        uniqueIdentifiers.map((identifier) =>
          prisma.oTPVerification.count({
            where: {
              identifier,
              createdAt: { gte: hourAgo },
            },
          })
        )
      );

      if (requestCounts.some((count) => count >= OTP.MAX_REQUESTS_PER_HOUR)) {
        throw new Error('Too many OTP requests. Please try again after 1 hour.');
      }

      // Check if recently sent OTP exists (shorter window in development)
      const recentWindow = isDevelopment ? 60 * 1000 : 60 * 1000; // 1 minute
      const recentOTP = await prisma.oTPVerification.findFirst({
        where: {
          identifier: { in: uniqueIdentifiers },
          createdAt: {
            gte: new Date(Date.now() - recentWindow),
          },
        },
      });

      if (recentOTP) {
        throw new Error('OTP already sent. Please wait 1 minute before requesting again.');
      }

    // Generate random OTP (6 digits)
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + OTP.EXPIRY_MINUTES * 60 * 1000);

      // Mark previous OTPs as verified to prevent reuse, but keep for rate-limiting
      await prisma.oTPVerification.updateMany({
        where: { identifier: { in: uniqueIdentifiers }, isVerified: false },
        data: { isVerified: true },
      });

      // Cleanup very old OTPs to keep collection lean
      await prisma.oTPVerification.deleteMany({
        where: {
          createdAt: { lt: new Date(Date.now() - 2 * 60 * 60 * 1000) },
        },
      });

    // Store OTP in database for each destination
    await Promise.all(
      uniqueIdentifiers.map((identifier) =>
        prisma.oTPVerification.create({
          data: {
            identifier,
            otp,
            otpType: type,
            expiresAt,
          },
        })
      )
    );

    // Send OTP based on method(s)
    // In development, we allow the request to succeed even if external providers fail,
    // because the OTP is already stored in DB and printed to console below.
    const sendResults = await Promise.allSettled(
      targets.map(async (target) => {
        if (target.method === 'email') {
          await sendOTPEmail(target.identifier, otp, getOtpEmailType(type));
          return { method: 'email', identifier: target.identifier };
        }

        if (target.method === 'sms') {
          await sendOTPSMS(target.identifier, otp);
          return { method: 'sms', identifier: target.identifier };
        }

        return null;
      })
    );

    const failures = sendResults.filter((result) => result.status === 'rejected');
    const successes = sendResults.length - failures.length;

    if (failures.length > 0) {
      const failedMessages = failures.map((failure) => String(failure.reason?.message || failure.reason));
      const logPayload = {
        identifiers: uniqueIdentifiers,
        errors: failedMessages,
      };

      logger.warn('OTP delivery had partial or total failures.', logPayload);
      
      // If ALL methods failed and we are in production, throw error to notify frontend
      if (!isDevelopment && successes === 0) {
        throw new Error('Failed to send OTP. Please try again later.');
      }
    }

    // Log OTP prominently in development mode or if all providers failed
    if (isDevelopment || successes === 0) {
      console.log('\n' + '='.repeat(70));
      console.log('🔐 OTP GENERATED (DEVELOPMENT MODE OR FALLBACK)');
      console.log('='.repeat(70));
      console.log(`📱 Phone/Email: ${uniqueIdentifiers.join(', ')}`);
      console.log(`🔢 OTP Code: ${otp}`);
      console.log(`⏰ Expires in: ${OTP.EXPIRY_MINUTES} minutes`);
      console.log(`📝 Type: ${type}`);
      console.log('='.repeat(70) + '\n');
    }

    const methodsUsed = [...new Set(targets.map((target) => target.method))];
    const methodLabel = methodsUsed.length > 1 ? methodsUsed.join('+') : methodsUsed[0];
    logger.info(`OTP sent to ${uniqueIdentifiers.join(', ')} via ${methodLabel}`);

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

const normalizeIdentifiers = (identifierOrIdentifiers) => {
  if (Array.isArray(identifierOrIdentifiers)) {
    return [...new Set(identifierOrIdentifiers.filter(Boolean))];
  }
  return identifierOrIdentifiers ? [identifierOrIdentifiers] : [];
};

/**
 * Verify OTP
 */
const verifyOTP = async (identifierOrIdentifiers, otp) => {
  try {
    const identifiers = normalizeIdentifiers(identifierOrIdentifiers);
    if (identifiers.length === 0) {
      throw new Error('Identifier is required for OTP verification');
    }

    const lockedRecord = await prisma.oTPVerification.findFirst({
      where: {
        identifier: { in: identifiers },
        lockedUntil: { gt: new Date() },
      },
      orderBy: { lockedUntil: 'desc' },
    });

    if (lockedRecord) {
      throw new Error('Account locked due to multiple incorrect OTP attempts. Please try again after 10 minutes.');
    }

    // Find OTP record
    const otpRecord = await prisma.oTPVerification.findFirst({
      where: {
        identifier: { in: identifiers },
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
      await prisma.oTPVerification.updateMany({
        where: { identifier: { in: identifiers }, otp: otpRecord.otp },
        data: { isVerified: true },
      });
      throw new Error('OTP has expired. Please request a new one.');
    }

    // Check attempts
    if (otpRecord.attempts >= OTP.MAX_ATTEMPTS) {
      await prisma.oTPVerification.updateMany({
        where: { identifier: { in: identifiers }, otp: otpRecord.otp },
        data: { lockedUntil: new Date(Date.now() + OTP.LOCK_MINUTES * 60 * 1000) },
      });
      throw new Error('Account locked due to multiple incorrect OTP attempts. Please try again after 10 minutes.');
    }

    // Verify OTP
    if (otpRecord.otp !== otp) {
        const nextAttempts = otpRecord.attempts + 1;
        const updatePayload = { attempts: nextAttempts };

        if (nextAttempts >= OTP.MAX_ATTEMPTS) {
          updatePayload.lockedUntil = new Date(Date.now() + OTP.LOCK_MINUTES * 60 * 1000);
        }

        await prisma.oTPVerification.updateMany({
          where: {
            identifier: { in: identifiers },
            otp: otpRecord.otp,
          },
          data: updatePayload,
        });

        if (nextAttempts >= OTP.MAX_ATTEMPTS) {
          throw new Error('Account locked due to multiple incorrect OTP attempts. Please try again after 10 minutes.');
        }

        throw new Error('Invalid OTP. Please try again.');
    }

      // Mark OTP as verified after successful verification
      await prisma.oTPVerification.updateMany({
        where: { identifier: { in: identifiers }, otp: otpRecord.otp },
        data: { isVerified: true },
      });

    logger.info(`OTP verified for ${identifiers.join(', ')}`);

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
        expiresAt: { lt: new Date() },
        OR: [
          { lockedUntil: null },
          { lockedUntil: { lt: new Date() } },
        ],
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
