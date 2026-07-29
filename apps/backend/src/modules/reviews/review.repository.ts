import type { FinishAndReviewResult, NewReview, ReviewWithAuthor } from "./review.types.js";

export interface ReviewRepository {
  listForBook(bookId: string): Promise<ReviewWithAuthor[]>;
  findForUserAndBook(userId: string, bookId: string): Promise<ReviewWithAuthor | null>;
  finishAndReview(userId: string, data: NewReview): Promise<FinishAndReviewResult>;
}
