export interface ReviewEntity {
  id: string;
  userId: string;
  bookId: string;
  rating: number;
  body: string | null;
  createdAt: Date;
}

export interface ReviewWithAuthor extends ReviewEntity {
  authorName: string | null;
}

export interface NewReview {
  bookId: string;
  rating: number;
  body: string | null;
}

export interface FinishAndReviewResult {
  review: ReviewEntity;
  finishedCount: number;
}
