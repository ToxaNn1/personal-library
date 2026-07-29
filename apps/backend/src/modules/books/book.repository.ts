import type { BookEntity, ListBooksParams, ListBooksResult, NewBook } from "./book.types.js";

export interface BookRepository {
  list(params: ListBooksParams): Promise<ListBooksResult>;
  create(data: NewBook): Promise<BookEntity>;
  delete(id: string): Promise<boolean>;
  findById(id: string): Promise<BookEntity | null>
  updateBook(id: string, data: Partial<NewBook>): Promise<BookEntity | null>
}
