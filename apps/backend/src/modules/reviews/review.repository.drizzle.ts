import {
  and,
  count,
  DEFAULT_SHELVES,
  desc,
  eq,
  reviews,
  shelfItems,
  shelves,
  sql,
  user,
  type DB,
} from "@library/db";
import { NotFoundError } from "../../errors.js";
import type { ReviewRepository } from "./review.repository.js";
import type { FinishAndReviewResult, NewReview, ReviewWithAuthor } from "./review.types.js";

const REVIEW_FIELDS = {
  id: reviews.id,
  userId: reviews.userId,
  bookId: reviews.bookId,
  rating: reviews.rating,
  body: reviews.body,
  createdAt: reviews.createdAt,
  authorName: user.name,
};

export class DrizzleReviewRepository implements ReviewRepository {
  constructor(private readonly db: DB) {}

  listForBook(bookId: string): Promise<ReviewWithAuthor[]> {
    return this.db
      .select(REVIEW_FIELDS)
      .from(reviews)
      .leftJoin(user, eq(user.id, reviews.userId))
      .where(eq(reviews.bookId, bookId))
      .orderBy(desc(reviews.createdAt));
  }

  async findForUserAndBook(userId: string, bookId: string): Promise<ReviewWithAuthor | null> {
    const [review] = await this.db
      .select(REVIEW_FIELDS)
      .from(reviews)
      .leftJoin(user, eq(user.id, reviews.userId))
      .where(and(eq(reviews.userId, userId), eq(reviews.bookId, bookId)))
      .limit(1);
    return review ?? null;
  }

  finishAndReview(userId: string, data: NewReview): Promise<FinishAndReviewResult> {
    return this.db.transaction(async (tx) => {
      await tx
        .insert(shelves)
        .values(DEFAULT_SHELVES.map((shelf) => ({ ...shelf, userId })))
        .onConflictDoNothing();

      const [finished] = await tx
        .select({ id: shelves.id })
        .from(shelves)
        .where(and(eq(shelves.userId, userId), eq(shelves.kind, "finished")))
        .limit(1);
      if (!finished) throw new NotFoundError("You have no finished shelf");

      await tx
        .insert(shelfItems)
        .values({ userId, shelfId: finished.id, kind: "finished", bookId: data.bookId })
        .onConflictDoUpdate({
          target: [shelfItems.userId, shelfItems.bookId],
          targetWhere: sql`${shelfItems.kind} <> 'custom'`,
          set: { shelfId: finished.id, kind: "finished", addedAt: sql`now()` },
        });

      const [review] = await tx
        .insert(reviews)
        .values({ userId, bookId: data.bookId, rating: data.rating, body: data.body })
        .onConflictDoUpdate({
          target: [reviews.userId, reviews.bookId],
          set: { rating: data.rating, body: data.body },
        })
        .returning();
      if (!review) throw new NotFoundError("Could not save the review");

      const [totals] = await tx
        .select({ total: count() })
        .from(shelfItems)
        .where(and(eq(shelfItems.userId, userId), eq(shelfItems.shelfId, finished.id)));

      return { review, finishedCount: totals?.total ?? 0 };
    });
  }
}
