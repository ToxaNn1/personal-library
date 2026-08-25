import { index, pgTable, primaryKey, text, uuid } from "drizzle-orm/pg-core";
import { books } from "./schema.js";

export const genres = pgTable("genres", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
});

export const bookGenres = pgTable(
  "book_genres",
  {
    bookId: uuid("book_id")
      .notNull()
      .references(() => books.id, { onDelete: "cascade" }),
    genreId: uuid("genre_id")
      .notNull()
      .references(() => genres.id, { onDelete: "cascade" }),
  },
  (t) => [
    primaryKey({ columns: [t.bookId, t.genreId] }),
    index("book_genres_genre_idx").on(t.genreId),
  ],
);

export type GenreRow = typeof genres.$inferSelect;
