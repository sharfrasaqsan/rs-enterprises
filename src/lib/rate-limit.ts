import "server-only";

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

// In-memory store for rate limiting by IP / client hash
const rateLimitMap = new Map<string, RateLimitRecord>();

// Clean up stale entries every 15 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of rateLimitMap.entries()) {
      if (now > value.resetTime) {
        rateLimitMap.delete(key);
      }
    }
  }, 15 * 60 * 1000);
}

/**
 * Check if an IP has exceeded the allowed submissions within the window.
 * Default: 6 requests per 10 minutes window.
 */
export function checkRateLimit(
  clientIp: string,
  limit: number = 6,
  windowMs: number = 10 * 60 * 1000
): { success: boolean; remaining: number; resetMs: number } {
  const now = Date.now();
  const record = rateLimitMap.get(clientIp);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(clientIp, {
      count: 1,
      resetTime: now + windowMs,
    });
    return { success: true, remaining: limit - 1, resetMs: windowMs };
  }

  if (record.count >= limit) {
    const remainingMs = Math.max(0, record.resetTime - now);
    return { success: false, remaining: 0, resetMs: remainingMs };
  }

  record.count += 1;
  return {
    success: true,
    remaining: limit - record.count,
    resetMs: Math.max(0, record.resetTime - now),
  };
}

