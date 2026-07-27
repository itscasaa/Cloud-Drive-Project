import rateLimit, { ipKeyGenerator } from 'express-rate-limit'

export function createRateLimiter(options: { windowMs: number; max: number; message: string }) {
  return rateLimit({
    windowMs: options.windowMs,
    limit: options.max, // express-rate-limit v7 uses 'limit' instead of 'max'
    message: {
      code: 'TOO_MANY_REQUESTS',
      message: options.message,
    },
    // Standard secure client IP detection under reverse proxies
    keyGenerator: (req) => {
      const forwarded = req.headers['x-forwarded-for']
      let rawIp = ''
      if (Array.isArray(forwarded)) rawIp = forwarded[0]
      else if (typeof forwarded === 'string') rawIp = forwarded.split(',')[0].trim()
      else rawIp = req.ip || req.socket.remoteAddress || 'unknown'

      // Must use ipKeyGenerator for IPv6 compliance
      return ipKeyGenerator(rawIp)
    },
    standardHeaders: true, // Return rate limit info in the standard `RateLimit-*` headers
    legacyHeaders: false, // Disable legacy `X-RateLimit-*` headers
  })
}
