import type Redis from "ioredis";
import { RateLimitError } from "./errors.js";

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

    let count: number;
    try {
      const results = await this.client
        .multi()
        .zremrangebyscore(redisKey, 0, cutoff)
        .zadd(redisKey, now, `${now}-${Math.random()}`)
        .zcard(redisKey)
        .expire(redisKey, windowSec)
        .exec();

      count = Number(results?.[2]?.[1] ?? 0);
    } catch {
      return;
    }

    if (count > limit) {
      throw new RateLimitError(windowSec);
    }
  }
}
