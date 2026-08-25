import type { GoalRepository } from "./goal.repository.js";
import type { ReadingGoalEntity } from "./goal.types.js";

export class GoalService {
  constructor(private readonly repo: GoalRepository) {}

  listForUser(userId: string): Promise<ReadingGoalEntity[]> {
    return this.repo.listForUser(userId);
  }

  setGoal(userId: string, year: number, targetBooks: number): Promise<ReadingGoalEntity> {
    return this.repo.setGoal(userId, year, targetBooks);
  }
}
