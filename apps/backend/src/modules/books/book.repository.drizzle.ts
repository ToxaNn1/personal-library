import { and, asc, books, desc, eq, ilike, sql, user, type DB, type SQL } from "@library/db";
import type { BookRepository } from "./book.repository.js";
import type {
  BookEntity,
  BookUpdate,
  ListBooksParams,
  ListBooksResult,
  NewBook,
} from "./book.types.js";

const SORT_COLUMNS = {
  title: books.title,
  year: books.year,
  createdAt: books.createdAt,
} as const;

const BOOK_FIELDS = {
  id: books.id,
  title: books.title,
  author: books.author,
  year: books.year,
  isbn: books.isbn,
  ownerId: books.ownerId,
  ownerName: user.name,
  createdAt: books.createdAt,
};

export class DrizzleBookRepository implements BookRepository {
  constructor(private readonly db: DB) {}

  async list(params: ListBooksParams): Promise<ListBooksResult> {
    const conditions: SQL[] = [];
    if (params.author) conditions.push(eq(books.author, params.author));
    if (params.search) conditions.push(ilike(books.title, `%${params.search}%`));
    if (params.ownerId) conditions.push(eq(books.ownerId, params.ownerId));
    const where = conditions.length ? and(...conditions) : undefined;

    const column = SORT_COLUMNS[params.sort];
    const orderBy = params.order === "asc" ? asc(column) : desc(column);

    const items = await this.db
      .select(BOOK_FIELDS)
      .from(books)
      .leftJoin(user, eq(books.ownerId, user.id))
      .where(where)
      .orderBy(orderBy)
      .limit(params.limit)
      .offset((params.page - 1) * params.limit);

    const countRows = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(books)
      .where(where);
    const total = countRows[0]?.count ?? 0;

    return { items, total };
  }

  async create(data: NewBook): Promise<BookEntity> {
    const [inserted] = await this.db.insert(books).values(data).returning({ id: books.id });
    if (!inserted) throw new Error("INSERT ... RETURNING returned no row");

    const book = await this.findById(inserted.id);
    if (!book) throw new Error("Inserted book could not be read back");
    return book;
  }

  async delete(id: string, ownerId: string): Promise<boolean> {
    const deleted = await this.db
      .delete(books)
      .where(and(eq(books.id, id), eq(books.ownerId, ownerId)))
      .returning({ id: books.id });
    return deleted.length > 0;
  }

  async findById(id: string): Promise<BookEntity | null> {
    const [book] = await this.db
      .select(BOOK_FIELDS)
      .from(books)
      .leftJoin(user, eq(books.ownerId, user.id))
      .where(eq(books.id, id))
      .limit(1);
    return book ?? null;
  }

  async updateBook(id: string, data: BookUpdate, ownerId: string): Promise<BookEntity | null> {
    const [updated] = await this.db
      .update(books)
      .set(data)
      .where(and(eq(books.id, id), eq(books.ownerId, ownerId)))
      .returning({ id: books.id });
    if (!updated) return null;

    return this.findById(updated.id);
  }
}
