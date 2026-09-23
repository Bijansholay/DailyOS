/**
 * DailyOS Auth Rate Limiter Middleware
 * Prevents automated password guessing and brute force attacks on authentication endpoints.
 */

const ipStore = new Map();

// Periodic cleanup of expired rate limit buckets (runs every 10 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of ipStore.entries()) {
    if (now > record.resetTime) {
      ipStore.delete(ip);
    }
  }
}, 10 * 60 * 1000);

export function createRateLimiter({ windowMs = 15 * 60 * 1000, maxRequests = 10, message = 'Too many requests' } = {}) {
  return function rateLimiter(req, res, next) {
    // Get IP address from headers or connection
    const clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
                     req.socket?.remoteAddress || 
                     req.ip || 
                     '127.0.0.1';

    const now = Date.now();
    let record = ipStore.get(clientIp);

    if (!record || now > record.resetTime) {
      record = { count: 1, resetTime: now + windowMs };
      ipStore.set(clientIp, record);
      return next();
    }

    record.count += 1;

    if (record.count > maxRequests) {
      const retryAfterSeconds = Math.ceil((record.resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfterSeconds);
      return res.status(429).json({
        error: message,
        retryAfterSeconds
      });
    }

    next();
  };
}

export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 10,
  message: 'Too many authentication attempts from this IP. Please wait 15 minutes before trying again.'
});
