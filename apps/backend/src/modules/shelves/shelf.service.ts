import { ConflictError, NotFoundError, ValidationError } from "../../errors.js";
import type { BookCache } from "../books/book.cache.js";
import type { BookRepository } from "../books/book.repository.js";
import type { NotificationService } from "../notifications/notification.service.js";
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
    private readonly notifications: NotificationService,
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

  async placeBook(
    userId: string,
    bookId: string,
    kind: ShelfKind,
    actorName: string,
  ): Promise<ShelfEntity> {
    const book = await this.books.findById(bookId);
    if (!book) throw new NotFoundError(`Book ${bookId} not found`);

    let shelf = await this.repo.findByKind(userId, kind);
    if (!shelf) {
      await this.repo.ensureDefaults(userId);
      shelf = await this.repo.findByKind(userId, kind);
    }
    if (!shelf) throw new NotFoundError(`Shelf ${kind} not found`);

    await this.repo.placeBook(userId, shelf.id, bookId, kind);
    await this.bookCache.invalidate();

    if (kind === "reading") {
      await this.notifications.notifyFriendReading({
        actorId: userId,
        actorName,
        bookId,
        bookTitle: book.title,
      });
    }

    const updated = await this.repo.findByKind(userId, kind);
    return updated ?? shelf;
  }

  async listCustomShelfBooks(params: ListShelfBooksParams): Promise<ListShelfBooksResult> {
    if (params.shelfId) await this.ownCustomShelf(params.userId, params.shelfId);
    return this.repo.listBooks(params);
  }

  async createShelf(userId: string, name: string): Promise<ShelfEntity> {
    await this.list(userId);

    const shelf = await this.repo.createCustom(userId, name.trim());
    if (!shelf) throw new ConflictError(`You already have a shelf called "${name.trim()}"`);
    return shelf;
  }

  async deleteShelf(userId: string, shelfId: string): Promise<void> {
    const deleted = await this.repo.deleteCustom(userId, shelfId);
    if (!deleted) throw new NotFoundError("Custom shelf not found");
  }

  private async ownCustomShelf(userId: string, shelfId: string): Promise<ShelfEntity> {
    const shelf = await this.repo.findById(userId, shelfId);
    if (!shelf) throw new NotFoundError("Shelf not found");
    if (shelf.kind !== "custom")
      throw new ValidationError("Use the shelf picker for status shelves");
    return shelf;
  }

  async addToShelf(userId: string, shelfId: string, bookId: string): Promise<ShelfEntity> {
    await this.ownCustomShelf(userId, shelfId);

    const book = await this.books.findById(bookId);
    if (!book) throw new NotFoundError(`Book ${bookId} not found`);

    await this.repo.addToShelf(userId, shelfId, bookId);
    return this.ownCustomShelf(userId, shelfId);
  }

  async removeFromShelf(userId: string, shelfId: string, bookId: string): Promise<void> {
    await this.ownCustomShelf(userId, shelfId);

    const removed = await this.repo.removeFromShelf(userId, shelfId, bookId);
    if (!removed) throw new NotFoundError("This book is not on that shelf");
  }

  async removeBook(userId: string, bookId: string): Promise<void> {
    const removed = await this.repo.removeBook(userId, bookId);
    if (!removed) throw new NotFoundError("This book is not on any of your shelves");

    await this.bookCache.invalidate();
  }
}
