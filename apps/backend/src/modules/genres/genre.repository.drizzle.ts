import { asc, bookGenres, eq, genres, sql, type DB } from "@library/db";
import type { GenreRepository } from "./genre.repository.js";
import type { GenreEntity } from "./genre.types.js";

export class DrizzleGenreRepository implements GenreRepository {
  constructor(private readonly db: DB) {}

  list(): Promise<GenreEntity[]> {
    return this.db
      .select({
        id: genres.id,
        name: genres.name,
        slug: genres.slug,
        bookCount: sql<number>`count(${bookGenres.bookId})::int`,
      })
      .from(genres)
      .leftJoin(bookGenres, eq(bookGenres.genreId, genres.id))
      .groupBy(genres.id)
      .orderBy(asc(genres.name));
  }
}
