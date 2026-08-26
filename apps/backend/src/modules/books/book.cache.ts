import type { Cache } from "../../cache.js";

const VERSION_KEY = "books:ver";

const CACHED_SHAPE_VERSION = 3;

export class BookCache {
  constructor(private readonly cache: Cache) {}

  private async version(): Promise<number> {
    return (await this.cache.get<number>(VERSION_KEY)) ?? 0;
  }

  async listKey(params: unknown): Promise<string> {
    return `books:s${CACHED_SHAPE_VERSION}:v${await this.version()}:list:${JSON.stringify(params)}`;
  }

  async bookKey(id: string, viewerId?: string): Promise<string> {
    return `books:s${CACHED_SHAPE_VERSION}:v${await this.version()}:book:${id}:${viewerId ?? "anon"}`;
  }

  get<T>(key: string): Promise<T | null> {
    return this.cache.get<T>(key);
  }

  set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    return this.cache.set(key, value, ttlSeconds);
  }

  async invalidate(): Promise<void> {
    await this.cache.incr(VERSION_KEY);
  }
}
