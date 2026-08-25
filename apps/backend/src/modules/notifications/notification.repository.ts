import type { FriendReadingEvent, NotificationEntity } from "./notification.types.js";

export interface NotificationRepository {
  listForUser(userId: string, limit: number): Promise<NotificationEntity[]>;
  markRead(userId: string, id: string): Promise<boolean>;
  fanOutFriendReading(event: FriendReadingEvent): Promise<number>;
}
