import { authed } from "../../orpc.js";
import type { GoalService } from "./goal.service.js";
import type { ReadingGoalEntity } from "./goal.types.js";

function toGoalDto(goal: ReadingGoalEntity) {
  return {
    year: goal.year,
    targetBooks: goal.targetBooks,
    booksFinished: goal.booksFinished,
  };
}

export function createGoalController(service: GoalService) {
  return {
    readingGoals: authed.readingGoals.handler(async ({ context }) => {
      const goals = await service.listForUser(context.user.id);
      return goals.map(toGoalDto);
    }),

    setReadingGoal: authed.setReadingGoal.handler(async ({ input, context }) => {
      const goal = await service.setGoal(context.user.id, input.year, input.targetBooks);
      return toGoalDto(goal);
    }),
  };
}
