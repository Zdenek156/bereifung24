/**
 * Email Rate Limiter
 * Prevents spam detection by limiting emails per time window
 */

interface RateLimitEntry {
  count: number
  resetTime: number
}

const emailCounts = new Map<string, RateLimitEntry>()

/**
 * Check if email can be sent based on rate limits
 * @param recipient Email address of recipient
 * @param maxPerHour Maximum emails per hour (default: 10)
 * @returns true if email can be sent, false if rate limit exceeded
 */
export function canSendEmail(recipient: string, maxPerHour: number = 10): boolean {
  const now = Date.now()
  const entry = emailCounts.get(recipient)

  // No previous entry or reset time passed
  if (!entry || now > entry.resetTime) {
    emailCounts.set(recipient, {
      count: 1,
      resetTime: now + 60 * 60 * 1000 // 1 hour from now
    })
    return true
  }

  // Check if limit exceeded
  if (entry.count >= maxPerHour) {
    console.log(`[EMAIL RATE LIMIT] Blocked email to ${recipient} (${entry.count}/${maxPerHour} emails sent)`)
    return false
  }

  // Increment counter
  entry.count++
  emailCounts.set(recipient, entry)
  return true
}

/**
 * Check rate limit for booking-related emails
 * More strict limits to prevent spam detection
 */
export function canSendBookingEmail(recipient: string): boolean {
  // Max 5 booking emails per hour per recipient
  return canSendEmail(recipient, 5)
}

/**
 * Reset rate limit for specific recipient (for testing)
 */
export function resetRateLimit(recipient: string): void {
  emailCounts.delete(recipient)
}

/**
 * Clean up old entries (run periodically)
 */
export function cleanupRateLimits(): void {
  const now = Date.now()
  for (const [recipient, entry] of emailCounts.entries()) {
    if (now > entry.resetTime) {
      emailCounts.delete(recipient)
    }
  }
}
