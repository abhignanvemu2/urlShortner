const rateLimit = require('express-rate-limit');

const createRateLimiter = (windowMs, max, message) => {
  return rateLimit({
    windowMs: windowMs || parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: max || parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    message: {
      error: 'Too Many Requests',
      message: message || 'You have exceeded the rate limit. Please try again later.',
      retryAfter: Math.ceil(windowMs / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      return req.user?.id || req.ip;
    }
  });
};

// Different rate limits for different endpoints
const urlCreationLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  50, // 50 requests per 15 minutes
  'Too many URL creation requests. Please try again later.'
);

const analyticsLimiter = createRateLimiter(
  60 * 1000, // 1 minute
  30, // 30 requests per minute
  'Too many analytics requests. Please try again later.'
);

const generalLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  1000, // 1000 requests per 15 minutes
  'Too many requests from this IP. Please try again later.'
);

module.exports = {
  urlCreationLimiter,
  analyticsLimiter,
  generalLimiter,
  createRateLimiter
};