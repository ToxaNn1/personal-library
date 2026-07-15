import { randomUUID } from "node:crypto";
import type { BookRepository } from "./book.repository.js";
import type { BookEntity, NewBook } from "./book.types.js";

export class InMemoryBookRepository implements BookRepository {
  private readonly books = new Map<string, BookEntity>();

  async findAll(): Promise<BookEntity[]> {
    return [...this.books.values()].sort(
      (a, b) => (a.year ?? Number.POSITIVE_INFINITY) - (b.year ?? Number.POSITIVE_INFINITY),
    );
  }

  async create(data: NewBook): Promise<BookEntity> {
    const book: BookEntity = { id: randomUUID(), ...data };
    this.books.set(book.id, book);
    return book;
  }

  async delete(id: string): Promise<boolean> {
    return this.books.delete(id);
  }

  async findById(id: string): Promise<BookEntity | null> {
    return this.books.get(id) ?? null
  }
}
