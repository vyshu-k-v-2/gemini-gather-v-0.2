/**
 * @file rate-limiter.ts
 * @description Sliding window token bucket rate limiter to protect
 * against client-side request floods and automated prompt injection hammering.
 */

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export class SlidingWindowRateLimiter {
  private timestamps: number[] = [];
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(config: RateLimitConfig = { maxRequests: 20, windowMs: 60000 }) {
    this.maxRequests = config.maxRequests;
    this.windowMs = config.windowMs;
  }

  /**
   * Attempts to consume an allowance. Returns true if permitted, false if rate limited.
   */
  public tryAcquire(now: number = Date.now()): { allowed: boolean; remaining: number; retryAfterMs: number } {
    // Purge expired timestamps outside the window
    const cutoff = now - this.windowMs;
    this.timestamps = this.timestamps.filter((t) => t > cutoff);

    if (this.timestamps.length >= this.maxRequests) {
      const oldest = this.timestamps[0];
      const retryAfterMs = Math.max(0, oldest + this.windowMs - now);
      return { allowed: false, remaining: 0, retryAfterMs };
    }

    this.timestamps.push(now);
    return {
      allowed: true,
      remaining: this.maxRequests - this.timestamps.length,
      retryAfterMs: 0,
    };
  }

  /**
   * Resets the rate limiter window (useful for tests or user clear).
   */
  public reset(): void {
    this.timestamps = [];
  }
}

// Global singleton instance for prompt submissions
export const promptRateLimiter = new SlidingWindowRateLimiter({
  maxRequests: 15,
  windowMs: 60000, // 15 requests per minute
});
