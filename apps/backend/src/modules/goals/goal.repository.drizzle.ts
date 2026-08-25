import { readingGoals, sql, type DB } from "@library/db";
import type { GoalRepository } from "./goal.repository.js";
import type { ReadingGoalEntity } from "./goal.types.js";

export class DrizzleGoalRepository implements GoalRepository {
  constructor(private readonly db: DB) {}

  async listForUser(userId: string): Promise<ReadingGoalEntity[]> {
    const result = await this.db.execute(sql`
      select
        g.year                          as "year",
        g.target_books                  as "targetBooks",
        coalesce(f.count, 0)::int       as "booksFinished"
      from reading_goals g
      left join (
        select
          extract(year from si.added_at)::int as year,
          count(*)::int                       as count
        from shelf_items si
        join shelves s on s.id = si.shelf_id and s.kind = 'finished'
        where si.user_id = ${userId}
        group by 1
      ) f on f.year = g.year
      where g.user_id = ${userId}
      order by g.year desc
    `);

    return result.rows as unknown as ReadingGoalEntity[];
  }

  async setGoal(userId: string, year: number, targetBooks: number): Promise<ReadingGoalEntity> {
    await this.db
      .insert(readingGoals)
      .values({ userId, year, targetBooks })
      .onConflictDoUpdate({
        target: [readingGoals.userId, readingGoals.year],
        set: { targetBooks },
      });

    const goals = await this.listForUser(userId);
    return goals.find((goal) => goal.year === year) ?? { year, targetBooks, booksFinished: 0 };
  }
}
