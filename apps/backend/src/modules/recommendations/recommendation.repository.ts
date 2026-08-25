import type { RecommendationEntity } from "./recommendation.types.js";

export interface RecommendationRepository {
  forUser(userId: string, limit: number): Promise<RecommendationEntity[]>;
}
