import { books, type DB } from "@library/db";
import { and, asc, desc, eq, ilike, sql, type SQL } from "drizzle-orm";
import type { BookRepository } from "./book.repository.js";
import type { BookEntity, ListBooksParams, ListBooksResult, NewBook } from "./book.types.js";

const SORT_COLUMNS = {
  title: books.title,
  year: books.year,
  createdAt: books.createdAt,
} as const;

export class DrizzleBookRepository implements BookRepository {
  constructor(private readonly db: DB) {}

  async list(params: ListBooksParams): Promise<ListBooksResult> {
    const conditions: SQL[] = [];
    if (params.author) conditions.push(eq(books.author, params.author));
    if (params.search) conditions.push(ilike(books.title, `%${params.search}%`));
    const where = conditions.length ? and(...conditions) : undefined;

    const column = SORT_COLUMNS[params.sort];
    const orderBy = params.order === "asc" ? asc(column) : desc(column);

    const items = await this.db
      .select()
      .from(books)
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
    const [book] = await this.db.insert(books).values(data).returning();
    if (!book) throw new Error("INSERT ... RETURNING returned no row");
    return book;
  }

  async delete(id: string): Promise<boolean> {
    const deleted = await this.db
      .delete(books)
      .where(eq(books.id, id))
      .returning({ id: books.id });
    return deleted.length > 0;
  }

  async findById(id: string): Promise<BookEntity | null> {
    const [book] = await this.db.select().from(books).where(eq(books.id, id)).limit(1);
    return book ?? null;
  }

  async updateBook(id: string, data: Partial<NewBook>): Promise<BookEntity | null> {
    const [book] = await this.db.update(books).set(data).where(eq(books.id, id)).returning();
    return book ?? null;
  }
}
