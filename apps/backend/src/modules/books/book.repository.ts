import type { BookEntity, NewBook } from "./book.types.js";

export interface BookRepository {
  findAll(): Promise<BookEntity[]>;
  create(data: NewBook): Promise<BookEntity>;
  delete(id: string): Promise<boolean>;
  findById(id: string): Promise<BookEntity | null>
}
