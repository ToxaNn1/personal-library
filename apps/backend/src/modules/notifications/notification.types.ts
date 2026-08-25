export interface NotificationEntity {
  id: string;
  type: string;
  title: string;
  body: string | null;
  readAt: Date | null;
  createdAt: Date;
}

export interface FriendReadingEvent {
  actorId: string;
  actorName: string;
  bookId: string;
  bookTitle: string;
}
