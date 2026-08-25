import { authed } from "../../orpc.js";
import type { RecommendationService } from "./recommendation.service.js";

export function createRecommendationController(service: RecommendationService) {
  return {
    recommendations: authed.recommendations.handler(async ({ input, context }) => {
      const books = await service.forUser(context.user.id, input.limit);

      return books.map((book) => ({
        id: book.id,
        title: book.title,
        author: book.author,
        year: book.year,
        pages: book.pages,
        matchedGenres: book.matchedGenres,
        score: book.score,
      }));
    }),
  };
}
