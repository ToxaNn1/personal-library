import type { Book } from "@library/contracts";
import { UnauthorisedError } from "../../errors.js";
import { authed, os } from "../../orpc.js";
import type { BookService } from "./book.service.js";
import type { BookEntity } from "./book.types.js";

function toBookDto(book: BookEntity): Book {
  return {
    id: book.id,
    title: book.title,
    author: book.author,
    year: book.year,
    isbn: book.isbn,
    ownerId: book.ownerId,
    ownerName: book.ownerName,
  };
}

export function createBookController(service: BookService) {
  return {
    listBooks: os.listBooks.handler(async ({ input, context }) => {
      const { owner, ...query } = input;
      if (owner === "mine" && !context.session) {
        throw new UnauthorisedError("Sign in to see your books");
      }

      const { items, total } = await service.list({
        ...query,
        ownerId: owner === "mine" ? context.session?.user.id : undefined,
      });

      return {
        items: items.map(toBookDto),
        meta: { page: input.page, limit: input.limit, total },
      };
    }),

    findBookById: os.findBookById.handler(async ({ input }) => {
      const book = await service.findById(input.id);
      return toBookDto(book);
    }),

    createBook: authed.createBook.handler(async ({ input, context }) => {
      const book = await service.create({
        title: input.title,
        author: input.author,
        year: input.year ?? null,
        isbn: input.isbn ?? null,
        ownerId: context.user.id,
      });
      return toBookDto(book);
    }),

    updateBook: authed.updateBook.handler(async ({ input, context }) => {
      const { id, ...data } = input;
      const book = await service.updateBook(id, data, context.user.id);
      return toBookDto(book);
    }),

    deleteBook: authed.deleteBook.handler(async ({ input, context }) => {
      await service.remove(input.id, context.user.id);
      return { success: true };
    }),
  };
}
