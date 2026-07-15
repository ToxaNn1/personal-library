import { ORPCError } from "@orpc/server";
import type { BookRepository } from "./book.repository.js";
import type { BookEntity, NewBook } from "./book.types.js";

export class BookService {
  constructor(private readonly repo: BookRepository) {}

  list(): Promise<BookEntity[]> {
    return this.repo.findAll();
  }

  create(data: NewBook): Promise<BookEntity> {
    return this.repo.create(data);
  }

  async remove(id: string): Promise<void> {
    const deleted = await this.repo.delete(id);

    if (!deleted) {
      throw new ORPCError("NOT_FOUND", { message: `Book ${id} not found` });
    }
  }
  async findById(id: string): Promise<BookEntity> {
    const book = await this.repo.findById(id);

    if (!book) {
      throw new ORPCError("NOT_FOUND", { message: `Book ${id} not found` });
    }

    return book;
  }
}
