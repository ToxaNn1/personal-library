import { NotFoundError } from "../../errors.js";
import { logger } from "../../logger.js";
import type { NotificationRepository } from "./notification.repository.js";
import type { FriendReadingEvent, NotificationEntity } from "./notification.types.js";

const FEED_LIMIT = 30;

export class NotificationService {
  constructor(private readonly repo: NotificationRepository) {}

  listForUser(userId: string): Promise<NotificationEntity[]> {
    return this.repo.listForUser(userId, FEED_LIMIT);
  }

  async markRead(userId: string, id: string): Promise<void> {
    const marked = await this.repo.markRead(userId, id);
    if (!marked) throw new NotFoundError("Notification not found");
  }

  async notifyFriendReading(event: FriendReadingEvent): Promise<void> {
    try {
      const sent = await this.repo.fanOutFriendReading(event);
      logger.info({ actorId: event.actorId, sent }, "friend_reading notifications");
    } catch (err) {
      logger.warn({ err }, "failed to fan out notifications");
    }
  }
}
