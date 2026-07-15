import type { Pool } from "pg";
import type { BookRepository } from "./book.repository.js";
import type { BookEntity, NewBook } from "./book.types.js";

export class PgBookRepository implements BookRepository {
  constructor(private readonly pool: Pool) {}

  async findAll(): Promise<BookEntity[]> {
    const result = await this.pool.query<BookEntity>(
      "SELECT id, title, author, year FROM books ORDER BY year ASC NULLS LAST",
    );
    return result.rows;
  }

  async create(data: NewBook): Promise<BookEntity> {
    const result = await this.pool.query<BookEntity>(
      `INSERT INTO books (title, author, year)
       VALUES ($1, $2, $3)
       RETURNING id, title, author, year`,
      [data.title, data.author, data.year],
    );
    const book = result.rows[0];
    if (!book) throw new Error("INSERT ... RETURNING returned no row");
    return book;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.pool.query("DELETE FROM books WHERE id = $1", [id]);
    return (result.rowCount ?? 0) > 0;
  }
}
