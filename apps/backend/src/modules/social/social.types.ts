export interface PersonEntity {
  id: string;
  name: string;
  booksFinished: number;
  isFollowing: boolean;
}

export interface FeedItemEntity {
  userId: string;
  userName: string;
  bookId: string;
  title: string;
  author: string;
  startedAt: Date;
}
