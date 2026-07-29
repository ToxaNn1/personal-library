import { NotFoundError } from "../../errors.js";
import type { BookCache } from "../books/book.cache.js";
import type { BookRepository } from "../books/book.repository.js";
import type { ShelfRepository } from "./shelf.repository.js";
import type {
  ListShelfBooksParams,
  ListShelfBooksResult,
  ShelfEntity,
  ShelfKind,
} from "./shelf.types.js";

export class ShelfService {
  constructor(
    private readonly repo: ShelfRepository,
    private readonly books: BookRepository,
    private readonly bookCache: BookCache,
  ) {}

  async list(userId: string): Promise<ShelfEntity[]> {
    const shelves = await this.repo.listForUser(userId);
    if (shelves.length > 0) return shelves;

    await this.repo.ensureDefaults(userId);
    return this.repo.listForUser(userId);
  }

  listBooks(params: ListShelfBooksParams): Promise<ListShelfBooksResult> {
    return this.repo.listBooks(params);
  }

  shelfOfBook(userId: string, bookId: string): Promise<ShelfEntity | null> {
    return this.repo.findShelfOfBook(userId, bookId);
  }

  async placeBook(userId: string, bookId: string, kind: ShelfKind): Promise<ShelfEntity> {
    const book = await this.books.findById(bookId);
    if (!book) throw new NotFoundError(`Book ${bookId} not found`);

    let shelf = await this.repo.findByKind(userId, kind);
    if (!shelf) {
      await this.repo.ensureDefaults(userId);
      shelf = await this.repo.findByKind(userId, kind);
    }
    if (!shelf) throw new NotFoundError(`Shelf ${kind} not found`);

    await this.repo.placeBook(userId, shelf.id, bookId);
    await this.bookCache.invalidate();

    const updated = await this.repo.findByKind(userId, kind);
    return updated ?? shelf;
  }

  async removeBook(userId: string, bookId: string): Promise<void> {
    const removed = await this.repo.removeBook(userId, bookId);
    if (!removed) throw new NotFoundError("This book is not on any of your shelves");

    await this.bookCache.invalidate();
  }
}
