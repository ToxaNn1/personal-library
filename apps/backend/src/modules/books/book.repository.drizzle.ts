import { books, type DB } from "@library/db";
import { asc, eq } from "drizzle-orm";
import type { BookRepository } from "./book.repository.js";
import type { BookEntity, NewBook } from "./book.types.js";

export class DrizzleBookRepository implements BookRepository {
  constructor(private readonly db: DB) {}


  findAll(): Promise<BookEntity[]> {
    return this.db.select().from(books).orderBy(asc(books.year));
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
}
