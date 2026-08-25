import { sql } from "drizzle-orm";
import { index, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { user } from "./auth-schema.js";

export * from "./auth-schema.js";
export * from "./shelf-schema.js";
export * from "./review-schema.js";
export * from "./genre-schema.js";
export * from "./social-schema.js";
export * from "./goal-schema.js";
export * from "./notification-schema.js";

export const books = pgTable(
  "books",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    author: text("author").notNull(),
    year: integer("year"),
    isbn: text("isbn"),
    pages: integer("pages"),
    ownerId: text("owner_id").references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("books_author_idx").on(t.author),
    index("books_title_idx").on(t.title),
    index("books_created_at_idx").on(t.createdAt),
    index("books_search_idx").using("gin", sql`to_tsvector('simple', ${t.title})`),
  ],
);

export type BookRow = typeof books.$inferSelect;
export type NewBookRow = typeof books.$inferInsert;
