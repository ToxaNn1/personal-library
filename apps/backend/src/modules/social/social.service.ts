import { NotFoundError, ValidationError } from "../../errors.js";
import type { SocialRepository } from "./social.repository.js";
import type { FeedItemEntity, PersonEntity } from "./social.types.js";

const FEED_LIMIT = 30;

export class SocialService {
  constructor(private readonly repo: SocialRepository) {}

  listPeople(viewerId: string): Promise<PersonEntity[]> {
    return this.repo.listPeople(viewerId);
  }

  async follow(followerId: string, followeeId: string): Promise<void> {
    if (followerId === followeeId) {
      throw new ValidationError("You cannot follow yourself");
    }

    const followed = await this.repo.follow(followerId, followeeId);
    if (!followed) throw new NotFoundError("User not found");
  }

  unfollow(followerId: string, followeeId: string): Promise<void> {
    return this.repo.unfollow(followerId, followeeId);
  }

  friendsReading(viewerId: string): Promise<FeedItemEntity[]> {
    return this.repo.friendsReading(viewerId, FEED_LIMIT);
  }
}
