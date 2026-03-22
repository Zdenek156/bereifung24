/**
 * IP-based rate limiter for auth endpoints
 * Protects against brute-force and credential stuffing attacks
 */

interface RateLimitEntry {
  count: number
  resetTime: number
}

const ipCounts = new Map<string, RateLimitEntry>()

// Cleanup old entries every 10 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of ipCounts.entries()) {
    if (now > entry.resetTime) {
      ipCounts.delete(key)
    }
  }
}, 10 * 60 * 1000)

/**
 * Check if a request from this IP is within the rate limit
 * @param ip IP address of the request
 * @param maxAttempts Maximum attempts per time window (default: 10)
 * @param windowMs Time window in milliseconds (default: 15 minutes)
 * @returns Object with allowed flag and retry-after seconds
 */
export function checkAuthRateLimit(
  ip: string,
  maxAttempts: number = 10,
  windowMs: number = 15 * 60 * 1000
): { allowed: boolean; retryAfterSeconds: number; remaining: number } {
  const now = Date.now()
  const entry = ipCounts.get(ip)

  if (!entry || now > entry.resetTime) {
    ipCounts.set(ip, { count: 1, resetTime: now + windowMs })
    return { allowed: true, retryAfterSeconds: 0, remaining: maxAttempts - 1 }
  }

  if (entry.count >= maxAttempts) {
    const retryAfterSeconds = Math.ceil((entry.resetTime - now) / 1000)
    return { allowed: false, retryAfterSeconds, remaining: 0 }
  }

  entry.count++
  ipCounts.set(ip, entry)
  return { allowed: true, retryAfterSeconds: 0, remaining: maxAttempts - entry.count }
}

/**
 * Preset: Login rate limit (5 attempts per 15 minutes)
 */
export function checkLoginRateLimit(ip: string) {
  return checkAuthRateLimit(ip, 5, 15 * 60 * 1000)
}

/**
 * Preset: Registration rate limit (3 attempts per hour)
 */
export function checkRegisterRateLimit(ip: string) {
  return checkAuthRateLimit(ip, 3, 60 * 60 * 1000)
}

/**
 * Preset: Password reset rate limit (3 attempts per hour)
 */
export function checkPasswordResetRateLimit(ip: string) {
  return checkAuthRateLimit(ip, 3, 60 * 60 * 1000)
}

/**
 * Preset: Token refresh rate limit (30 attempts per hour)
 */
export function checkRefreshRateLimit(ip: string) {
  return checkAuthRateLimit(ip, 30, 60 * 60 * 1000)
}

/**
 * Get client IP from NextRequest
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  const realIp = request.headers.get('x-real-ip')
  if (realIp) return realIp
  return '127.0.0.1'
}
