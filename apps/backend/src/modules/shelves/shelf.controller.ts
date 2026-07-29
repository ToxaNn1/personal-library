import type { Shelf } from "@library/contracts";
import { authed } from "../../orpc.js";
import type { ShelfService } from "./shelf.service.js";
import type { ShelfBookEntity, ShelfEntity } from "./shelf.types.js";

function toShelfDto(shelf: ShelfEntity): Shelf {
  return {
    id: shelf.id,
    name: shelf.name,
    kind: shelf.kind,
    bookCount: shelf.bookCount,
  };
}

function toShelfBookDto(book: ShelfBookEntity) {
  return {
    id: book.id,
    title: book.title,
    author: book.author,
    year: book.year,
    isbn: book.isbn,
    addedAt: book.addedAt.toISOString(),
  };
}

export function createShelfController(service: ShelfService) {
  return {
    listShelves: authed.listShelves.handler(async ({ context }) => {
      const shelves = await service.list(context.user.id);
      return shelves.map(toShelfDto);
    }),

    listShelfBooks: authed.listShelfBooks.handler(async ({ input, context }) => {
      const { items, total } = await service.listBooks({
        userId: context.user.id,
        kind: input.kind,
        page: input.page,
        limit: input.limit,
      });
      return {
        items: items.map(toShelfBookDto),
        meta: { page: input.page, limit: input.limit, total },
      };
    }),

    placeBookOnShelf: authed.placeBookOnShelf.handler(async ({ input, context }) => {
      const shelf = await service.placeBook(context.user.id, input.bookId, input.kind);
      return toShelfDto(shelf);
    }),

    removeBookFromShelves: authed.removeBookFromShelves.handler(async ({ input, context }) => {
      await service.removeBook(context.user.id, input.bookId);
      return { success: true };
    }),
  };
}
