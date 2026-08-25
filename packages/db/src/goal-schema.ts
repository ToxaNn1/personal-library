import { sql } from "drizzle-orm";
import { check, integer, pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./auth-schema.js";

export const readingGoals = pgTable(
  "reading_goals",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    year: integer("year").notNull(),
    targetBooks: integer("target_books").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.year] }),
    check("reading_goals_target_positive", sql`${t.targetBooks} > 0`),
  ],
);

export type ReadingGoalRow = typeof readingGoals.$inferSelect;
