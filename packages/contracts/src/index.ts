import { oc } from "@orpc/contract";
import { z } from "zod";

export const ShelfKindSchema = z.enum(["to_read", "reading", "finished", "custom"]);
export type ShelfKind = z.infer<typeof ShelfKindSchema>;

export const BookSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  author: z.string(),
  year: z.number().int().nullable(),
  isbn: z.string().nullable(),
  ownerId: z.string().nullable(),
  ownerName: z.string().nullable(),
  shelfKind: ShelfKindSchema.nullable(),
  pages: z.number().int().nullable(),
  genres: z.array(z.object({ id: z.string().uuid(), name: z.string(), slug: z.string() })),
});

export type Book = z.infer<typeof BookSchema>;

export const CreateBookInput = z.object({
  title: z.string().min(1).max(500),
  author: z.string().min(1).max(200),
  year: z.number().int().min(0).max(9999).nullable().optional(),
  isbn: z.string().min(1).max(20).nullable().optional(),
  pages: z.number().int().min(1).max(50000).nullable().optional(),
  genreIds: z.array(z.string().uuid()).max(5).optional(),
});

export const ListBooksInput = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(["title", "year", "createdAt"]).default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
  author: z.string().min(1).optional(),
  search: z.string().min(1).optional(),
  owner: z.enum(["all", "mine"]).default("all"),
  genre: z.string().min(1).optional(),
});

export type ListBooksQuery = z.infer<typeof ListBooksInput>;

export const ListBooksOutput = z.object({
  items: z.array(BookSchema),
  meta: z.object({
    page: z.number().int(),
    limit: z.number().int(),
    total: z.number().int(),
  }),
});

export const ShelfSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  kind: ShelfKindSchema,
  bookCount: z.number().int(),
});

export type Shelf = z.infer<typeof ShelfSchema>;

export const ShelfBookSchema = BookSchema.omit({
  ownerId: true,
  ownerName: true,
  shelfKind: true,
  genres: true,
}).extend({
  addedAt: z.string(),
});

export const ListShelfBooksInput = z.object({
  kind: ShelfKindSchema,
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const ReviewSchema = z.object({
  id: z.string().uuid(),
  bookId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  body: z.string().nullable(),
  authorName: z.string().nullable(),
  createdAt: z.string(),
});

export type Review = z.infer<typeof ReviewSchema>;

export const FinishAndReviewInput = z.object({
  bookId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  body: z.string().max(2000).optional(),
});

export const GenreSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  bookCount: z.number().int(),
});

export const YearStatsSchema = z.object({
  year: z.number().int(),
  booksFinished: z.number().int(),
  totalPages: z.number().int(),
  averageRating: z.number().nullable(),
  topGenre: z.string().nullable(),
});

export type YearStats = z.infer<typeof YearStatsSchema>;

export const RecommendationSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  author: z.string(),
  year: z.number().int().nullable(),
  pages: z.number().int().nullable(),
  matchedGenres: z.array(z.string()),
  score: z.number().int(),
});

export type Recommendation = z.infer<typeof RecommendationSchema>;

export const PersonSchema = z.object({
  id: z.string(),
  name: z.string(),
  booksFinished: z.number().int(),
  isFollowing: z.boolean(),
});

export type Person = z.infer<typeof PersonSchema>;

export const FeedItemSchema = z.object({
  userId: z.string(),
  userName: z.string(),
  bookId: z.string().uuid(),
  title: z.string(),
  author: z.string(),
  startedAt: z.string(),
});

export type FeedItem = z.infer<typeof FeedItemSchema>;

export const contract = {
  hello: oc
    .route({ method: "GET", path: "/hello" })
    .input(z.object({ name: z.string().min(1) }))
    .output(z.object({ message: z.string() })),

  listBooks: oc
    .route({ method: "GET", path: "/books" })
    .input(ListBooksInput)
    .output(ListBooksOutput),

  createBook: oc
    .route({ method: "POST", path: "/books" })
    .input(CreateBookInput)
    .output(BookSchema),

  deleteBook: oc
    .route({ method: "DELETE", path: "/books/{id}" })
    .input(z.object({ id: z.string().uuid() }))
    .output(z.object({ success: z.boolean() })),

  findBookById: oc
    .route({ method: "GET", path: "/books/{id}" })
    .input(z.object({ id: z.string().uuid() }))
    .output(BookSchema),

  updateBook: oc
    .route({ method: "PATCH", path: "/books/{id}" })
    .input(CreateBookInput.omit({ genreIds: true }).partial().extend({ id: z.string().uuid() }))
    .output(BookSchema),

  listShelves: oc.route({ method: "GET", path: "/shelves" }).output(z.array(ShelfSchema)),

  listShelfBooks: oc
    .route({ method: "GET", path: "/shelves/{kind}/books" })
    .input(ListShelfBooksInput)
    .output(
      z.object({
        items: z.array(ShelfBookSchema),
        meta: z.object({
          page: z.number().int(),
          limit: z.number().int(),
          total: z.number().int(),
        }),
      }),
    ),

  placeBookOnShelf: oc
    .route({ method: "PUT", path: "/shelf-items/{bookId}" })
    .input(z.object({ bookId: z.string().uuid(), kind: ShelfKindSchema }))
    .output(ShelfSchema),

  removeBookFromShelves: oc
    .route({ method: "DELETE", path: "/shelf-items/{bookId}" })
    .input(z.object({ bookId: z.string().uuid() }))
    .output(z.object({ success: z.boolean() })),

  finishAndReview: oc
    .route({ method: "POST", path: "/reviews" })
    .input(FinishAndReviewInput)
    .output(
      z.object({
        review: ReviewSchema,
        finishedCount: z.number().int(),
      }),
    ),

  listBookReviews: oc
    .route({ method: "GET", path: "/books/{bookId}/reviews" })
    .input(z.object({ bookId: z.string().uuid() }))
    .output(z.array(ReviewSchema)),

  listGenres: oc.route({ method: "GET", path: "/genres" }).output(z.array(GenreSchema)),

  readingStats: oc
    .route({ method: "GET", path: "/stats" })
    .input(z.object({ userId: z.string().optional() }))
    .output(
      z.object({
        user: z.object({ id: z.string(), name: z.string() }),
        years: z.array(YearStatsSchema),
      }),
    ),

  recommendations: oc
    .route({ method: "GET", path: "/recommendations" })
    .input(z.object({ limit: z.coerce.number().int().min(1).max(20).default(6) }))
    .output(z.array(RecommendationSchema)),

  listPeople: oc.route({ method: "GET", path: "/people" }).output(z.array(PersonSchema)),

  followUser: oc
    .route({ method: "PUT", path: "/following/{userId}" })
    .input(z.object({ userId: z.string().min(1) }))
    .output(z.object({ success: z.boolean() })),

  unfollowUser: oc
    .route({ method: "DELETE", path: "/following/{userId}" })
    .input(z.object({ userId: z.string().min(1) }))
    .output(z.object({ success: z.boolean() })),

  friendsReading: oc.route({ method: "GET", path: "/feed" }).output(z.array(FeedItemSchema)),
};

export type Contract = typeof contract;
