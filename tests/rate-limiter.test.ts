import test, { describe, it } from "node:test";
import assert from "node:assert";
import { SlidingWindowRateLimiter } from "../lib/rate-limiter";

describe("Rate Limiter — Sliding Window Flood Protection", () => {
  it("permits requests within maximum allowance", () => {
    const limiter = new SlidingWindowRateLimiter({ maxRequests: 3, windowMs: 1000 });
    const now = 10000;

    assert.strictEqual(limiter.tryAcquire(now).allowed, true);
    assert.strictEqual(limiter.tryAcquire(now + 100).allowed, true);
    assert.strictEqual(limiter.tryAcquire(now + 200).allowed, true);
  });

  it("blocks rapid-fire requests exceeding quota and calculates retry time", () => {
    const limiter = new SlidingWindowRateLimiter({ maxRequests: 2, windowMs: 1000 });
    const now = 10000;

    limiter.tryAcquire(now);
    limiter.tryAcquire(now + 100);

    const blocked = limiter.tryAcquire(now + 200);
    assert.strictEqual(blocked.allowed, false);
    assert.strictEqual(blocked.retryAfterMs > 0, true);
  });

  it("resets and clears expired requests when sliding window expires", () => {
    const limiter = new SlidingWindowRateLimiter({ maxRequests: 2, windowMs: 1000 });
    const now = 10000;

    limiter.tryAcquire(now);
    limiter.tryAcquire(now + 100);

    // After 1000ms window expires
    const allowedLater = limiter.tryAcquire(now + 1500);
    assert.strictEqual(allowedLater.allowed, true);
  });
});
