import { randomUUID } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Cache } from "../../cache.js";
import { ForbiddenError, NotFoundError, ValidationError } from "../../errors.js";
import { BookCache } from "./book.cache.js";
import { toBookDto } from "./book.controller.js";
import { InMemoryBookRepository } from "./book.repository.memory.js";
import { BookService } from "./book.service.js";
import type { ListBooksParams, NewBook } from "./book.types.js";

class FakeCache implements Cache {
  private readonly store = new Map<string, string>();

  async get<T>(key: string): Promise<T | null> {
    const raw = this.store.get(key);
    return raw ? (JSON.parse(raw) as T) : null;
  }

  async set(key: string, value: unknown): Promise<void> {
    this.store.set(key, JSON.stringify(value));
  }

  async del(...keys: string[]): Promise<void> {
    for (const key of keys) this.store.delete(key);
  }

  async incr(key: string): Promise<number> {
    const next = Number(this.store.get(key) ?? 0) + 1;
    this.store.set(key, String(next));
    return next;
  }
}

const ANNA = "anna";
const BOHDAN = "bohdan";

const draft: NewBook = {
  title: "Domain-Driven Design",
  author: "Eric Evans",
  year: 2003,
  isbn: "978-0321125217",
  pages: 560,
  ownerId: ANNA,
};

const listParams: ListBooksParams = { page: 1, limit: 10, sort: "title", order: "asc" };

let repo: InMemoryBookRepository;
let service: BookService;

beforeEach(() => {
  repo = new InMemoryBookRepository();
  service = new BookService(repo, new BookCache(new FakeCache()));
});

describe("BookService.findById", () => {
  it("returns a NotFound result when the book does not exist", async () => {
    const found = await service.findById(randomUUID());

    expect(found.ok).toBe(false);
    if (!found.ok) expect(found.error).toBeInstanceOf(NotFoundError);
  });

  it("returns the book that was created", async () => {
    const created = await service.create(draft);
    const found = await service.findById(created.id);

    expect(found.ok).toBe(true);
    if (found.ok) expect(found.value.title).toBe(draft.title);
  });
});

describe("BookService.updateBook", () => {
  it("rejects an update with no fields", async () => {
    const created = await service.create(draft);

    await expect(service.updateBook(created.id, {}, ANNA)).rejects.toBeInstanceOf(ValidationError);
  });

  it("forbids updating a book owned by someone else", async () => {
    const created = await service.create(draft);

    await expect(
      service.updateBook(created.id, { title: "Hijacked" }, BOHDAN),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("reports a missing book as not found rather than forbidden", async () => {
    await expect(service.updateBook(randomUUID(), { title: "Ghost" }, ANNA)).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });
});

describe("BookService.remove", () => {
  it("forbids deleting a book owned by someone else and keeps it", async () => {
    const created = await service.create(draft);

    await expect(service.remove(created.id, BOHDAN)).rejects.toBeInstanceOf(ForbiddenError);

    const found = await service.findById(created.id);
    expect(found.ok).toBe(true);
  });
});

describe("BookService caching", () => {
  it("serves an identical list query from the cache", async () => {
    await service.create(draft);
    const spy = vi.spyOn(repo, "list");

    await service.list(listParams);
    await service.list(listParams);

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("invalidates the cached list after a write", async () => {
    await service.create(draft);
    const before = await service.list(listParams);

    await service.create({ ...draft, title: "Refactoring", author: "Martin Fowler" });
    const after = await service.list(listParams);

    expect(before.total).toBe(1);
    expect(after.total).toBe(2);
  });
});

describe("toBookDto", () => {
  it("does not leak internal entity fields into the API DTO", async () => {
    const created = await service.create(draft);

    expect(created).toHaveProperty("createdAt");
    expect(toBookDto(created)).not.toHaveProperty("createdAt");
  });
});
