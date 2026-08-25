import { sql, type DB } from "@library/db";
import type { RecommendationRepository } from "./recommendation.repository.js";
import type { RecommendationEntity } from "./recommendation.types.js";

export class DrizzleRecommendationRepository implements RecommendationRepository {
  constructor(private readonly db: DB) {}

  async forUser(userId: string, limit: number): Promise<RecommendationEntity[]> {
    const result = await this.db.execute(sql`
      with my_genres as (
        select bg.genre_id, count(*)::int as weight
        from shelf_items si
        join shelves s on s.id = si.shelf_id
        join book_genres bg on bg.book_id = si.book_id
        where si.user_id = ${userId} and s.kind = 'finished'
        group by bg.genre_id
      )
      select
        b.id                                  as "id",
        b.title                               as "title",
        b.author                              as "author",
        b.year                                as "year",
        b.pages                               as "pages",
        sum(mg.weight)::int                   as "score",
        array_agg(g.name order by g.name)     as "matchedGenres"
      from books b
      join book_genres bg on bg.book_id = b.id
      join my_genres mg on mg.genre_id = bg.genre_id
      join genres g on g.id = mg.genre_id
      where not exists (
        select 1 from shelf_items si
        where si.user_id = ${userId} and si.book_id = b.id
      )
      group by b.id
      order by "score" desc, b.title asc
      limit ${limit}
    `);

    return result.rows as unknown as RecommendationEntity[];
  }
}
