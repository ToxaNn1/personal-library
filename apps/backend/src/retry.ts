import { HttpException } from "./errors.js";

interface RetryOptions {
  retries?: number;
  baseMs?: number;
  maxMs?: number;
}

export function isRetriable(err: unknown): boolean {
  if (err instanceof HttpException) {
    return err.status >= 500 || err.status === 429;
  }
  return true;
}

function equalJitter(attempt: number, baseMs: number, maxMs: number): number {
  const expo = Math.min(baseMs * 2 ** attempt, maxMs);
  return expo / 2 + Math.random() * (expo / 2);
}

export async function retry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const { retries = 3, baseMs = 200, maxMs = 4_000 } = options;
  let attempt = 0;

  for (;;) {
    try {
      return await fn();
    } catch (err) {
      if (attempt >= retries || !isRetriable(err)) throw err;
      const delay = equalJitter(attempt, baseMs, maxMs);
      await new Promise((resolve) => setTimeout(resolve, delay));
      attempt++;
    }
  }
}
