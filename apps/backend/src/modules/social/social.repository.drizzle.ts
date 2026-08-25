import { and, eq, follows, sql, type DB } from "@library/db";
import type { SocialRepository } from "./social.repository.js";
import type { FeedItemEntity, PersonEntity } from "./social.types.js";

export class DrizzleSocialRepository implements SocialRepository {
  constructor(private readonly db: DB) {}

  async listPeople(viewerId: string): Promise<PersonEntity[]> {
    const result = await this.db.execute(sql`
      select
        u.id                              as "id",
        u.name                            as "name",
        coalesce(fin.count, 0)::int       as "booksFinished",
        (f.follower_id is not null)       as "isFollowing"
      from "user" u
      left join follows f
        on f.followee_id = u.id and f.follower_id = ${viewerId}
      left join (
        select si.user_id, count(*)::int as count
        from shelf_items si
        join shelves s on s.id = si.shelf_id and s.kind = 'finished'
        group by si.user_id
      ) fin on fin.user_id = u.id
      where u.id <> ${viewerId}
      order by "booksFinished" desc, u.name asc
      limit 50
    `);

    return result.rows as unknown as PersonEntity[];
  }

  async follow(followerId: string, followeeId: string): Promise<boolean> {
    const target = await this.db.execute(
      sql`select 1 from "user" where id = ${followeeId} limit 1`,
    );
    if (target.rows.length === 0) return false;

    await this.db.insert(follows).values({ followerId, followeeId }).onConflictDoNothing();
    return true;
  }

  async unfollow(followerId: string, followeeId: string): Promise<void> {
    await this.db
      .delete(follows)
      .where(and(eq(follows.followerId, followerId), eq(follows.followeeId, followeeId)));
  }

  async friendsReading(viewerId: string, limit: number): Promise<FeedItemEntity[]> {
    const result = await this.db.execute(sql`
      select
        u.id          as "userId",
        u.name        as "userName",
        b.id          as "bookId",
        b.title       as "title",
        b.author      as "author",
        si.added_at   as "startedAt"
      from follows f
      join "user" u on u.id = f.followee_id
      join shelves s on s.user_id = f.followee_id and s.kind = 'reading'
      join shelf_items si on si.shelf_id = s.id
      join books b on b.id = si.book_id
      where f.follower_id = ${viewerId}
      order by si.added_at desc
      limit ${limit}
    `);

    const rows = result.rows as unknown as (Omit<FeedItemEntity, "startedAt"> & {
      startedAt: string;
    })[];

    return rows.map((row) => ({ ...row, startedAt: new Date(row.startedAt) }));
  }
}
