import type { FeedItemEntity, PersonEntity } from "./social.types.js";

export interface SocialRepository {
  listPeople(viewerId: string): Promise<PersonEntity[]>;
  follow(followerId: string, followeeId: string): Promise<boolean>;
  unfollow(followerId: string, followeeId: string): Promise<void>;
  friendsReading(viewerId: string, limit: number): Promise<FeedItemEntity[]>;
}
