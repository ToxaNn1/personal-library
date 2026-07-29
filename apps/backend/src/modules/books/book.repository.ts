import type {
  BookEntity,
  BookUpdate,
  ListBooksParams,
  ListBooksResult,
  NewBook,
} from "./book.types.js";

export interface BookRepository {
  list(params: ListBooksParams): Promise<ListBooksResult>;
  create(data: NewBook): Promise<BookEntity>;
  findById(id: string): Promise<BookEntity | null>;
  delete(id: string, ownerId: string): Promise<boolean>;
  updateBook(id: string, data: BookUpdate, ownerId: string): Promise<BookEntity | null>;
}
