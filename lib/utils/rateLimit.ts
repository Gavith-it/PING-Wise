/**
 * Rate Limiting Utility
 * 
 * Simple in-memory rate limiting for Next.js API routes
 */

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

export interface RateLimitOptions {
  windowMs: number;
  max: number;
}

export function rateLimit(options: RateLimitOptions) {
  const { windowMs, max } = options;

  return (req: any, res: any, next: () => void) => {
    const key = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
    const now = Date.now();

    if (!store[key] || now > store[key].resetTime) {
      store[key] = {
        count: 1,
        resetTime: now + windowMs
      };
      return next();
    }

    if (store[key].count >= max) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests, please try again later.'
      });
    }

    store[key].count++;
    next();
  };
}

