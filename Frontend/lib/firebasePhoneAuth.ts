// Firebase Configuration for Frontend
// This allows Firebase to send SMS OTPs automatically

import { initializeApp } from 'firebase/app';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';

// Your Firebase Configuration (from Firebase Console)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Store recaptchaVerifier globally to prevent re-creation
let recaptchaVerifier: RecaptchaVerifier | null = null;

/**
 * Initialize reCAPTCHA verifier (call once)
 */
const initRecaptcha = () => {
  if (recaptchaVerifier) {
    return recaptchaVerifier;
  }

  // Create invisible reCAPTCHA
  recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
    size: 'invisible',
    callback: () => {
      console.log('✅ reCAPTCHA verified');
    },
    'expired-callback': () => {
      console.log('⚠️ reCAPTCHA expired, please retry');
    },
  });

  return recaptchaVerifier;
};

/**
 * Send OTP via Firebase Phone Authentication
 * Firebase automatically sends SMS - no backend code needed!
 */
export const sendPhoneOTP = async (phoneNumber: string): Promise<any> => {
  try {
    // Validate phone format
    if (!phoneNumber.startsWith('+')) {
      throw new Error('Phone number must include country code (e.g., +919723023403)');
    }

    console.log('📱 Sending OTP to:', phoneNumber);

    // Initialize reCAPTCHA
    const verifier = initRecaptcha();

    // Send OTP - Firebase handles SMS automatically
    const confirmationResult = await signInWithPhoneNumber(
      auth,
      phoneNumber,
      verifier
    );

    console.log('✅ OTP sent via Firebase to:', phoneNumber);
    console.log('ℹ️  Check your phone for the verification code');
    
    return {
      success: true,
      confirmationResult,
      message: 'OTP sent successfully',
    };
  } catch (error: any) {
    console.error('❌ Firebase OTP error:', error);
    
    // Clear recaptcha on error to allow retry
    if (recaptchaVerifier) {
      try {
        recaptchaVerifier.clear();
        recaptchaVerifier = null;
      } catch (e) {
        console.log('Could not clear recaptcha');
      }
    }
    
    throw new Error(error.message || 'Failed to send OTP');
  }
};

/**
 * Verify OTP and get Firebase ID Token
 */
export const verifyPhoneOTP = async (
  confirmationResult: any,
  otpCode: string
): Promise<string> => {
  try {
    if (!otpCode || otpCode.length !== 6) {
      throw new Error('Please enter a valid 6-digit OTP');
    }

    console.log('🔐 Verifying OTP...');

    // Verify OTP with Firebase
    const result = await confirmationResult.confirm(otpCode);
    
    // Get Firebase ID Token
    const idToken = await result.user.getIdToken();
    
    console.log('✅ OTP verified successfully');
    console.log('📱 Phone:', result.user.phoneNumber);
    console.log('🔑 Firebase UID:', result.user.uid);
    
    // Clear recaptcha after successful verification
    if (recaptchaVerifier) {
      try {
        recaptchaVerifier.clear();
        recaptchaVerifier = null;
      } catch (e) {
        console.log('Could not clear recaptcha');
      }
    }
    
    return idToken;
  } catch (error: any) {
    console.error('❌ OTP verification error:', error);
    throw new Error(error.message || 'Invalid OTP. Please try again.');
  }
};

/**
 * Complete Flow: Send OTP → Verify OTP → Login to Backend
 */
export const loginWithPhone = async (phoneNumber: string) => {
  try {
    // Step 1: Send OTP via Firebase (SMS sent automatically)
    const { confirmationResult } = await sendPhoneOTP(phoneNumber);
    
    return {
      success: true,
      confirmationResult, // Store this for OTP verification
      message: 'OTP sent to your phone',
    };
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export { auth };
export default app;
