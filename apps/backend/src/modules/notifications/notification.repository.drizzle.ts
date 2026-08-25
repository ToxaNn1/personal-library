import { and, eq, notifications, sql, type DB } from "@library/db";
import type { NotificationRepository } from "./notification.repository.js";
import type { FriendReadingEvent, NotificationEntity } from "./notification.types.js";

export class DrizzleNotificationRepository implements NotificationRepository {
  constructor(private readonly db: DB) {}

  async listForUser(userId: string, limit: number): Promise<NotificationEntity[]> {
    return this.db
      .select({
        id: notifications.id,
        type: notifications.type,
        title: notifications.title,
        body: notifications.body,
        readAt: notifications.readAt,
        createdAt: notifications.createdAt,
      })
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(sql`${notifications.createdAt} desc`)
      .limit(limit);
  }

  async markRead(userId: string, id: string): Promise<boolean> {
    const updated = await this.db
      .update(notifications)
      .set({ readAt: sql`now()` })
      .where(and(eq(notifications.userId, userId), eq(notifications.id, id)))
      .returning({ id: notifications.id });
    return updated.length > 0;
  }

  async fanOutFriendReading(event: FriendReadingEvent): Promise<number> {
    const result = await this.db.execute(sql`
      insert into notifications (user_id, type, title, body, data)
      select
        f.follower_id,
        'friend_reading',
        ${`${event.actorName} started reading`},
        ${event.bookTitle},
        jsonb_build_object('bookId', ${event.bookId}::text, 'actorId', ${event.actorId}::text)
      from follows f
      where f.followee_id = ${event.actorId}
    `);

    return result.rowCount ?? 0;
  }
}
