import crypto from 'crypto';

/**
 * Generate a secure random token for email verification or password reset
 * @param {number} length - Length of the token (default: 32)
 * @returns {string} - Secure random token
 */
export const generateSecureToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Generate a 6-digit verification code
 * @returns {string} - 6-digit verification code
 */
export const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Hash a token for secure storage
 * @param {string} token - Token to hash
 * @returns {string} - Hashed token
 */
export const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Create expiration time for tokens
 * @param {number} minutes - Minutes from now (default: 60)
 * @returns {Date} - Expiration date
 */
export const createTokenExpiration = (minutes = 60) => {
  return new Date(Date.now() + minutes * 60 * 1000);
};

/**
 * Check if a token has expired
 * @param {Date} expirationDate - Token expiration date
 * @returns {boolean} - True if expired
 */
export const isTokenExpired = (expirationDate) => {
  return new Date() > new Date(expirationDate);
};
