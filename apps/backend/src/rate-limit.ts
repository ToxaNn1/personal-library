import type Redis from "ioredis";
import { RateLimitError } from "./errors.js";
import { logger } from "./logger.js";

interface LimitOptions {
  limit: number;
  windowSec: number;
}

export class RateLimiter {
  constructor(private readonly client: Redis) {}

  async check(scope: string, key: string, { limit, windowSec }: LimitOptions): Promise<void> {
    const now = Date.now();
    const cutoff = now - windowSec * 1_000;
    const redisKey = `rl:${scope}:${key}`;
    const member = `${now}-${Math.random()}`;

    let count: number;
    try {
      const results = await this.client
        .multi()
        .zremrangebyscore(redisKey, 0, cutoff)
        .zadd(redisKey, now, member)
        .zcard(redisKey)
        .expire(redisKey, windowSec)
        .exec();

      count = Number(results?.[2]?.[1] ?? 0);
    } catch (err) {
      logger.warn({ err, scope, key }, "rate limiter unavailable, allowing request");
      return;
    }

    if (count > limit) {
      // Drop the rejected attempt so a client that keeps hammering does not
      // keep extending its own window.
      await this.client.zrem(redisKey, member).catch(() => undefined);
      throw new RateLimitError(windowSec);
    }
  }
}
