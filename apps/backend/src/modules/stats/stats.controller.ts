import { UnauthorisedError } from "../../errors.js";
import { os } from "../../orpc.js";
import type { StatsService } from "./stats.service.js";

export function createStatsController(service: StatsService) {
  return {
    readingStats: os.readingStats.handler(async ({ input, context }) => {
      const userId = input.userId ?? context.session?.user.id;
      if (!userId) throw new UnauthorisedError("Sign in to see your stats");

      const stats = await service.readingStats(userId);
      return {
        user: stats.user,
        years: stats.years.map((year) => ({
          year: year.year,
          booksFinished: year.booksFinished,
          totalPages: year.totalPages,
          averageRating: year.averageRating,
          topGenre: year.topGenre,
        })),
      };
    }),
  };
}
