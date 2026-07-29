import { randomUUID } from "node:crypto";
import type { BookRepository } from "./book.repository.js";
import type { BookEntity, ListBooksParams, ListBooksResult, NewBook } from "./book.types.js";

export class InMemoryBookRepository implements BookRepository {
  private readonly books = new Map<string, BookEntity>();

  async list(params: ListBooksParams): Promise<ListBooksResult> {
    let rows = [...this.books.values()];

    if (params.author) rows = rows.filter((b) => b.author === params.author);
    if (params.search) {
      const needle = params.search.toLowerCase();
      rows = rows.filter((b) => b.title.toLowerCase().includes(needle));
    }

    rows.sort((a, b) => {
      const dir = params.order === "asc" ? 1 : -1;
      const av = a[params.sort];
      const bv = b[params.sort];
      if (av === bv) return 0;
      if (av === null) return 1;
      if (bv === null) return -1;
      return av < bv ? -dir : dir;
    });

    const total = rows.length;
    const start = (params.page - 1) * params.limit;
    const items = rows.slice(start, start + params.limit);
    return { items, total };
  }

  async create(data: NewBook): Promise<BookEntity> {
    const book: BookEntity = { id: randomUUID(), createdAt: new Date(), ...data };
    this.books.set(book.id, book);
    return book;
  }

  async delete(id: string): Promise<boolean> {
    return this.books.delete(id);
  }

  async findById(id: string): Promise<BookEntity | null> {
    return this.books.get(id) ?? null
  }

  async updateBook(id: string, data: Partial<NewBook>): Promise<BookEntity | null> {
    const existing = this.books.get(id);
    if (!existing) return null;

    const updated = { ...existing, ...data };
    this.books.set(id, updated);
    return updated;
  }
}
