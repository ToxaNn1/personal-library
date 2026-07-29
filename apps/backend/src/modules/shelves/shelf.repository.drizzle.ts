import { and, asc, books, count, desc, eq, shelfItems, shelves, sql, type DB } from "@library/db";
import type { ShelfRepository } from "./shelf.repository.js";
import type {
  ListShelfBooksParams,
  ListShelfBooksResult,
  ShelfEntity,
  ShelfKind,
} from "./shelf.types.js";

const KIND_ORDER = sql`case ${shelves.kind}
  when 'to_read' then 1 when 'reading' then 2 when 'finished' then 3 else 4 end`;

const SHELF_FIELDS = {
  id: shelves.id,
  userId: shelves.userId,
  name: shelves.name,
  kind: sql<ShelfKind>`${shelves.kind}`.as("kind"),
  bookCount: sql<number>`count(${shelfItems.id})::int`.as("book_count"),
};

export class DrizzleShelfRepository implements ShelfRepository {
  constructor(private readonly db: DB) {}

  listForUser(userId: string): Promise<ShelfEntity[]> {
    return this.db
      .select(SHELF_FIELDS)
      .from(shelves)
      .leftJoin(shelfItems, eq(shelfItems.shelfId, shelves.id))
      .where(eq(shelves.userId, userId))
      .groupBy(shelves.id)
      .orderBy(KIND_ORDER, asc(shelves.name));
  }

  async findByKind(userId: string, kind: ShelfKind): Promise<ShelfEntity | null> {
    const [shelf] = await this.db
      .select(SHELF_FIELDS)
      .from(shelves)
      .leftJoin(shelfItems, eq(shelfItems.shelfId, shelves.id))
      .where(and(eq(shelves.userId, userId), eq(shelves.kind, kind)))
      .groupBy(shelves.id)
      .limit(1);
    return shelf ?? null;
  }

  async findShelfOfBook(userId: string, bookId: string): Promise<ShelfEntity | null> {
    const [shelf] = await this.db
      .select(SHELF_FIELDS)
      .from(shelfItems)
      .innerJoin(shelves, eq(shelves.id, shelfItems.shelfId))
      .where(and(eq(shelfItems.userId, userId), eq(shelfItems.bookId, bookId)))
      .groupBy(shelves.id)
      .limit(1);
    return shelf ?? null;
  }

  async listBooks(params: ListShelfBooksParams): Promise<ListShelfBooksResult> {
    const where = and(eq(shelfItems.userId, params.userId), eq(shelves.kind, params.kind));

    const items = await this.db
      .select({
        id: books.id,
        title: books.title,
        author: books.author,
        year: books.year,
        isbn: books.isbn,
        addedAt: shelfItems.addedAt,
      })
      .from(shelfItems)
      .innerJoin(shelves, eq(shelves.id, shelfItems.shelfId))
      .innerJoin(books, eq(books.id, shelfItems.bookId))
      .where(where)
      .orderBy(desc(shelfItems.addedAt))
      .limit(params.limit)
      .offset((params.page - 1) * params.limit);

    const [totals] = await this.db
      .select({ total: count() })
      .from(shelfItems)
      .innerJoin(shelves, eq(shelves.id, shelfItems.shelfId))
      .where(where);

    return { items, total: totals?.total ?? 0 };
  }

  async placeBook(userId: string, shelfId: string, bookId: string): Promise<void> {
    await this.db
      .insert(shelfItems)
      .values({ userId, shelfId, bookId })
      .onConflictDoUpdate({
        target: [shelfItems.userId, shelfItems.bookId],
        set: { shelfId, addedAt: sql`now()` },
      });
  }

  async removeBook(userId: string, bookId: string): Promise<boolean> {
    const removed = await this.db
      .delete(shelfItems)
      .where(and(eq(shelfItems.userId, userId), eq(shelfItems.bookId, bookId)))
      .returning({ id: shelfItems.id });
    return removed.length > 0;
  }
}
