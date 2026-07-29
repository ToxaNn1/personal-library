import { NotFoundError } from "../../errors.js";
import type { BookCache } from "../books/book.cache.js";
import type { BookRepository } from "../books/book.repository.js";
import type { ReviewRepository } from "./review.repository.js";
import type { FinishAndReviewResult, NewReview, ReviewWithAuthor } from "./review.types.js";

export class ReviewService {
  constructor(
    private readonly repo: ReviewRepository,
    private readonly books: BookRepository,
    private readonly bookCache: BookCache,
  ) {}

  listForBook(bookId: string): Promise<ReviewWithAuthor[]> {
    return this.repo.listForBook(bookId);
  }

  myReview(userId: string, bookId: string): Promise<ReviewWithAuthor | null> {
    return this.repo.findForUserAndBook(userId, bookId);
  }

  async finishAndReview(userId: string, data: NewReview): Promise<FinishAndReviewResult> {
    const book = await this.books.findById(data.bookId);
    if (!book) throw new NotFoundError(`Book ${data.bookId} not found`);

    const result = await this.repo.finishAndReview(userId, data);
    await this.bookCache.invalidate();
    return result;
  }
}
