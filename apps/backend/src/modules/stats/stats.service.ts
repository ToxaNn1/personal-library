import { NotFoundError } from "../../errors.js";
import type { StatsRepository } from "./stats.repository.js";
import type { ReadingStats } from "./stats.types.js";

export class StatsService {
  constructor(private readonly repo: StatsRepository) {}

  async readingStats(userId: string): Promise<ReadingStats> {
    const stats = await this.repo.readingStats(userId);
    if (!stats) throw new NotFoundError("User not found");
    return stats;
  }
}
