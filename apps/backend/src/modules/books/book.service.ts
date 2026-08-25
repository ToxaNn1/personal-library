import { ForbiddenError, NotFoundError, ValidationError } from "../../errors.js";
import type { HttpException } from "../../errors.js";
import type { BookCache } from "./book.cache.js";
import type { BookRepository } from "./book.repository.js";
import type {
  BookEntity,
  BookUpdate,
  ListBooksParams,
  ListBooksResult,
  NewBook,
} from "./book.types.js";

const LIST_TTL = 60;
const BOOK_TTL = 60;

export class BookService {
  constructor(
    private readonly repo: BookRepository,
    private readonly cache: BookCache,
  ) {}

  async list(params: ListBooksParams): Promise<ListBooksResult> {
    const key = await this.cache.listKey(params);

    const cached = await this.cache.get<ListBooksResult>(key);
    if (cached) return cached;

    const result = await this.repo.list(params);
    await this.cache.set(key, result, LIST_TTL);
    return result;
  }

  async findById(id: string, viewerId?: string): Promise<BookEntity> {
    const key = await this.cache.bookKey(id, viewerId);

    const cached = await this.cache.get<BookEntity>(key);
    if (cached) return cached;

    const book = await this.repo.findById(id, viewerId);
    if (!book) {
      throw new NotFoundError(`Book ${id} not found`);
    }

    await this.cache.set(key, book, BOOK_TTL);
    return book;
  }

  async create(data: NewBook): Promise<BookEntity> {
    const book = await this.repo.create(data);
    await this.cache.invalidate();
    return book;
  }

  async updateBook(id: string, data: BookUpdate, userId: string): Promise<BookEntity> {
    if (Object.keys(data).length === 0) {
      throw new ValidationError("Provide at least one field to update");
    }

    const updated = await this.repo.updateBook(id, data, userId);
    if (!updated) throw await this.writeDenied(id);

    await this.cache.invalidate();
    return updated;
  }

  async remove(id: string, userId: string): Promise<void> {
    const deleted = await this.repo.delete(id, userId);
    if (!deleted) throw await this.writeDenied(id);

    await this.cache.invalidate();
  }

  private async writeDenied(id: string): Promise<HttpException> {
    const book = await this.repo.findById(id);
    return book
      ? new ForbiddenError("You can only modify books you added")
      : new NotFoundError(`Book ${id} not found`);
  }
}
