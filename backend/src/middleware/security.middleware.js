import rateLimit from 'express-rate-limit';
import { ENV } from '../lib/env.js';

// General API rate limiting
export const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: (ENV.NODE_ENV === 'development' || ENV.ALLOW_DEV_RATE_LIMITS === 'true') ? 1000 : 100, // Much higher limit in development
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Configure for proxy environments (Render, Heroku, etc.)
  trustProxy: ENV.NODE_ENV === 'production',
  keyGenerator: (req) => {
    // In production with proxy, use X-Forwarded-For header
    if (ENV.NODE_ENV === 'production') {
      return req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.connection.remoteAddress || req.ip;
    }
    return req.ip;
  },
  skip: () => {
    // Skip rate limiting in development or when dev rate limits are allowed
    return ENV.NODE_ENV === 'development' || ENV.ALLOW_DEV_RATE_LIMITS === 'true';
  },
});

// Strict rate limiting for authentication endpoints
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: (ENV.NODE_ENV === 'development' || ENV.ALLOW_DEV_RATE_LIMITS === 'true') ? 1000 : 5, // Much higher limit in development
  message: {
    error: 'Too many authentication attempts, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Configure for proxy environments (Render, Heroku, etc.)
  trustProxy: ENV.NODE_ENV === 'production',
  keyGenerator: (req) => {
    // In production with proxy, use X-Forwarded-For header
    if (ENV.NODE_ENV === 'production') {
      return req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.connection.remoteAddress || req.ip;
    }
    return req.ip;
  },
  skip: () => {
    // Skip rate limiting in development or when dev rate limits are allowed
    return ENV.NODE_ENV === 'development' || ENV.ALLOW_DEV_RATE_LIMITS === 'true';
  },
});

// Rate limiting for message sending
export const messageRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: ENV.NODE_ENV === 'development' ? 1000 : 30, // Much higher limit in development
  message: {
    error: 'Too many messages sent, please slow down.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Configure for proxy environments (Render, Heroku, etc.)
  trustProxy: ENV.NODE_ENV === 'production',
  keyGenerator: (req) => {
    // In production with proxy, use X-Forwarded-For header
    if (ENV.NODE_ENV === 'production') {
      return req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.connection.remoteAddress || req.ip;
    }
    return req.ip;
  },
  skip: () => {
    // Skip rate limiting in development
    return ENV.NODE_ENV === 'development';
  },
});

// Rate limiting for file uploads (images)
export const uploadRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: ENV.NODE_ENV === 'development' ? 1000 : 10, // Much higher limit in development
  message: {
    error: 'Too many file uploads, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Configure for proxy environments (Render, Heroku, etc.)
  trustProxy: ENV.NODE_ENV === 'production',
  keyGenerator: (req) => {
    // In production with proxy, use X-Forwarded-For header
    if (ENV.NODE_ENV === 'production') {
      return req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.connection.remoteAddress || req.ip;
    }
    return req.ip;
  },
  skip: () => {
    // Skip rate limiting in development
    return ENV.NODE_ENV === 'development';
  },
});
