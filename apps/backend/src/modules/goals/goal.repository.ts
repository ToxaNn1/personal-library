import type { ReadingGoalEntity } from "./goal.types.js";

export interface GoalRepository {
  listForUser(userId: string): Promise<ReadingGoalEntity[]>;
  setGoal(userId: string, year: number, targetBooks: number): Promise<ReadingGoalEntity>;
}
