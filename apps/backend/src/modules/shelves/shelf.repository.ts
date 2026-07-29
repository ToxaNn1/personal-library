import type {
  ListShelfBooksParams,
  ListShelfBooksResult,
  ShelfEntity,
  ShelfKind,
} from "./shelf.types.js";

export interface ShelfRepository {
  ensureDefaults(userId: string): Promise<void>;
  listForUser(userId: string): Promise<ShelfEntity[]>;
  findByKind(userId: string, kind: ShelfKind): Promise<ShelfEntity | null>;
  listBooks(params: ListShelfBooksParams): Promise<ListShelfBooksResult>;
  placeBook(userId: string, shelfId: string, bookId: string): Promise<void>;
  removeBook(userId: string, bookId: string): Promise<boolean>;
  findShelfOfBook(userId: string, bookId: string): Promise<ShelfEntity | null>;
}
