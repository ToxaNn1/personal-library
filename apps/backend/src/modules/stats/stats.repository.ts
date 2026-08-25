import type { ReadingStats } from "./stats.types.js";

export interface StatsRepository {
  readingStats(userId: string): Promise<ReadingStats | null>;
}
