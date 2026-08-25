import { authed } from "../../orpc.js";
import type { SocialService } from "./social.service.js";

export function createSocialController(service: SocialService) {
  return {
    listPeople: authed.listPeople.handler(async ({ context }) => {
      const people = await service.listPeople(context.user.id);

      return people.map((person) => ({
        id: person.id,
        name: person.name,
        booksFinished: person.booksFinished,
        isFollowing: person.isFollowing,
      }));
    }),

    followUser: authed.followUser.handler(async ({ input, context }) => {
      await service.follow(context.user.id, input.userId);
      return { success: true };
    }),

    unfollowUser: authed.unfollowUser.handler(async ({ input, context }) => {
      await service.unfollow(context.user.id, input.userId);
      return { success: true };
    }),

    friendsReading: authed.friendsReading.handler(async ({ context }) => {
      const items = await service.friendsReading(context.user.id);

      return items.map((item) => ({
        userId: item.userId,
        userName: item.userName,
        bookId: item.bookId,
        title: item.title,
        author: item.author,
        startedAt: item.startedAt.toISOString(),
      }));
    }),
  };
}
