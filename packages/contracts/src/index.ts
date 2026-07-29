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
});

export type Book = z.infer<typeof BookSchema>;

export const CreateBookInput = z.object({
  title: z.string().min(1).max(500),
  author: z.string().min(1).max(200),
  year: z.number().int().min(0).max(9999).nullable().optional(),
  isbn: z.string().min(1).max(20).nullable().optional(),
});

export const ListBooksInput = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(["title", "year", "createdAt"]).default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
  author: z.string().min(1).optional(),
  search: z.string().min(1).optional(),
  owner: z.enum(["all", "mine"]).default("all"),
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

export const ShelfBookSchema = BookSchema.omit({ ownerId: true, ownerName: true, shelfKind: true }).extend({
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

export const contract = {
  hello: oc.input(z.object({ name: z.string().min(1) })).output(z.object({ message: z.string() })),

  listBooks: oc.input(ListBooksInput).output(ListBooksOutput),

  createBook: oc.input(CreateBookInput).output(BookSchema),

  deleteBook: oc
    .input(z.object({ id: z.string().uuid() }))
    .output(z.object({ success: z.boolean() })),

  findBookById: oc.input(z.object({ id: z.string().uuid() })).output(BookSchema),

  updateBook: oc.input(CreateBookInput.partial().extend({id: z.string().uuid()})).output(BookSchema),

  listShelves: oc.output(z.array(ShelfSchema)),

  listShelfBooks: oc.input(ListShelfBooksInput).output(
    z.object({
      items: z.array(ShelfBookSchema),
      meta: z.object({ page: z.number().int(), limit: z.number().int(), total: z.number().int() }),
    }),
  ),

  placeBookOnShelf: oc
    .input(z.object({ bookId: z.string().uuid(), kind: ShelfKindSchema }))
    .output(ShelfSchema),

  removeBookFromShelves: oc
    .input(z.object({ bookId: z.string().uuid() }))
    .output(z.object({ success: z.boolean() })),

  finishAndReview: oc.input(FinishAndReviewInput).output(
    z.object({
      review: ReviewSchema,
      finishedCount: z.number().int(),
    }),
  ),

  listBookReviews: oc
    .input(z.object({ bookId: z.string().uuid() }))
    .output(z.array(ReviewSchema)),
};

export type Contract = typeof contract;
