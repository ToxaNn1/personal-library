import { ForbiddenError, NotFoundError } from "../../errors.js";
import type { HttpException } from "../../errors.js";
import type { Cache } from "../../cache.js";
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
const VERSION_KEY = "books:ver";

export class BookService {
  constructor(
    private readonly repo: BookRepository,
    private readonly cache: Cache,
  ) {}

  async list(params: ListBooksParams): Promise<ListBooksResult> {
    const version = (await this.cache.get<number>(VERSION_KEY)) ?? 0;
    const key = `books:list:v${version}:${JSON.stringify(params)}`;

    const cached = await this.cache.get<ListBooksResult>(key);
    if (cached) return cached;

    const result = await this.repo.list(params);
    await this.cache.set(key, result, LIST_TTL);
    return result;
  }

  async findById(id: string): Promise<BookEntity> {
    const key = `book:${id}`;

    const cached = await this.cache.get<BookEntity>(key);
    if (cached) return cached;

    const book = await this.repo.findById(id);
    if (!book) {
      throw new NotFoundError(`Book ${id} not found`);
    }

    await this.cache.set(key, book, BOOK_TTL);
    return book;
  }

  async create(data: NewBook): Promise<BookEntity> {
    const book = await this.repo.create(data);
    await this.cache.incr(VERSION_KEY);
    return book;
  }

  async updateBook(id: string, data: BookUpdate, userId: string): Promise<BookEntity> {
    const updated = await this.repo.updateBook(id, data, userId);
    if (!updated) throw await this.writeDenied(id);

    await this.invalidate(id);
    return updated;
  }

  async remove(id: string, userId: string): Promise<void> {
    const deleted = await this.repo.delete(id, userId);
    if (!deleted) throw await this.writeDenied(id);

    await this.invalidate(id);
  }

  private async writeDenied(id: string): Promise<HttpException> {
    const book = await this.repo.findById(id);
    return book
      ? new ForbiddenError("You can only modify books you added")
      : new NotFoundError(`Book ${id} not found`);
  }

  private async invalidate(id: string): Promise<void> {
    await this.cache.del(`book:${id}`);
    await this.cache.incr(VERSION_KEY);
  }
}
