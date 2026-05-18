/**
 * Phone Number Validation and Normalization Utility (Frontend)
 * Handles various Indian phone number formats
 */

/**
 * Normalize phone number to standard format
 * Accepts: 9327117231, +919327117231, 919327117231, 091 9327117231, etc.
 * Returns: +919327117231
 */
export const normalizePhoneNumber = (phone: string): string => {
  if (!phone) return '';

  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '');

  // Handle different formats
  if (cleaned.length === 10) {
    // 9327117231 -> +919327117231
    return `+91${cleaned}`;
  } else if (cleaned.length === 12 && cleaned.startsWith('91')) {
    // 919327117231 -> +919327117231
    return `+${cleaned}`;
  } else if (cleaned.length === 11 && cleaned.startsWith('0')) {
    // 09327117231 -> +919327117231
    return `+91${cleaned.substring(1)}`;
  } else if (cleaned.length === 13 && cleaned.startsWith('091')) {
    // 0919327117231 -> +919327117231
    return `+${cleaned.substring(1)}`;
  }

  // Already in correct format or has country code
  if (phone.startsWith('+91') && cleaned.length === 12) {
    return phone;
  }

  // Return original if can't normalize
  return phone;
};

/**
 * Validate Indian phone number
 */
export const isValidIndianPhone = (phone: string): boolean => {
  if (!phone) return false;

  const normalized = normalizePhoneNumber(phone);
  // Indian phone numbers should be +91 followed by 10 digits starting with 6-9
  const phoneRegex = /^\+91[6-9]\d{9}$/;
  
  return phoneRegex.test(normalized);
};

/**
 * Format phone number for display
 * +919327117231 -> +91 93271 17231
 */
export const formatPhoneForDisplay = (phone: string): string => {
  if (!phone) return '';

  const normalized = normalizePhoneNumber(phone);
  if (!normalized || !normalized.startsWith('+91')) return phone;

  const digits = normalized.substring(3); // Remove +91
  return `+91 ${digits.substring(0, 5)} ${digits.substring(5)}`;
};

/**
 * Check if input is likely a phone number (vs email)
 */
export const isPhoneNumber = (input: string): boolean => {
  if (!input) return false;
  
  // If it contains @, it's an email
  if (input.includes('@')) return false;
  
  // If it starts with + or contains only digits and spaces, it's likely a phone
  return /^[\d\s+\-()]+$/.test(input);
};
