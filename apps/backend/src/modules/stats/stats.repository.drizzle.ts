import { sql, type DB } from "@library/db";
import type { StatsRepository } from "./stats.repository.js";
import type { ReadingStats, YearStatsEntity } from "./stats.types.js";

export class DrizzleStatsRepository implements StatsRepository {
  constructor(private readonly db: DB) {}

  async readingStats(userId: string): Promise<ReadingStats | null> {
    const owner = await this.db.execute(
      sql`select id, name from "user" where id = ${userId} limit 1`,
    );
    const found = owner.rows[0] as { id: string; name: string } | undefined;
    if (!found) return null;

    const stats = await this.db.execute(sql`
      with finished as (
        select
          si.book_id,
          extract(year from si.added_at)::int as year
        from shelf_items si
        join shelves s on s.id = si.shelf_id
        where si.user_id = ${userId} and s.kind = 'finished'
      ),
      per_year as (
        select
          f.year,
          count(*)::int                       as books_finished,
          coalesce(sum(b.pages), 0)::int      as total_pages,
          round(avg(r.rating)::numeric, 2)    as average_rating
        from finished f
        join books b on b.id = f.book_id
        left join reviews r on r.book_id = f.book_id and r.user_id = ${userId}
        group by f.year
      ),
      genre_ranked as (
        select
          f.year,
          g.name,
          row_number() over (
            partition by f.year
            order by count(*) desc, g.name asc
          ) as rn
        from finished f
        join book_genres bg on bg.book_id = f.book_id
        join genres g on g.id = bg.genre_id
        group by f.year, g.name
      )
      select
        p.year                                 as "year",
        p.books_finished                       as "booksFinished",
        p.total_pages                          as "totalPages",
        p.average_rating::float                as "averageRating",
        gr.name                                as "topGenre"
      from per_year p
      left join genre_ranked gr on gr.year = p.year and gr.rn = 1
      order by p.year desc
    `);

    return { user: found, years: stats.rows as unknown as YearStatsEntity[] };
  }
}
