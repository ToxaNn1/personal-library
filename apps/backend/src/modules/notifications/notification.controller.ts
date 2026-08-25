import { authed } from "../../orpc.js";
import type { NotificationService } from "./notification.service.js";

export function createNotificationController(service: NotificationService) {
  return {
    listNotifications: authed.listNotifications.handler(async ({ context }) => {
      const items = await service.listForUser(context.user.id);

      return items.map((item) => ({
        id: item.id,
        type: item.type,
        title: item.title,
        body: item.body,
        read: item.readAt !== null,
        createdAt: item.createdAt.toISOString(),
      }));
    }),

    markNotificationRead: authed.markNotificationRead.handler(async ({ input, context }) => {
      await service.markRead(context.user.id, input.id);
      return { success: true };
    }),
  };
}
