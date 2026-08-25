import type { RecommendationRepository } from "./recommendation.repository.js";
import type { RecommendationEntity } from "./recommendation.types.js";

export class RecommendationService {
  constructor(private readonly repo: RecommendationRepository) {}

  forUser(userId: string, limit: number): Promise<RecommendationEntity[]> {
    return this.repo.forUser(userId, limit);
  }
}
