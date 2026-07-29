import type { Review } from "@library/contracts";
import { authed, os } from "../../orpc.js";
import type { ReviewService } from "./review.service.js";
import type { ReviewEntity, ReviewWithAuthor } from "./review.types.js";

function toReviewDto(review: ReviewWithAuthor): Review {
  return {
    id: review.id,
    bookId: review.bookId,
    rating: review.rating,
    body: review.body,
    authorName: review.authorName,
    createdAt: review.createdAt.toISOString(),
  };
}

function toOwnReviewDto(review: ReviewEntity, authorName: string): Review {
  return { ...toReviewDto({ ...review, authorName }) };
}

export function createReviewController(service: ReviewService) {
  return {
    listBookReviews: os.listBookReviews.handler(async ({ input }) => {
      const reviews = await service.listForBook(input.bookId);
      return reviews.map(toReviewDto);
    }),

    finishAndReview: authed.finishAndReview.handler(async ({ input, context }) => {
      const { review, finishedCount } = await service.finishAndReview(context.user.id, {
        bookId: input.bookId,
        rating: input.rating,
        body: input.body ?? null,
      });
      return { review: toOwnReviewDto(review, context.user.name), finishedCount };
    }),
  };
}
