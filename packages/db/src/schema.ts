import { integer, pgTable, text, uuid } from "drizzle-orm/pg-core";

export const books = pgTable("books", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  author: text("author").notNull(),
  year: integer("year"),
});

export type BookRow = typeof books.$inferSelect;
export type NewBookRow = typeof books.$inferInsert;
