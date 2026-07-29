import type { Book } from "@library/contracts";
import { os } from "../../orpc.js";
import type { BookService } from "./book.service.js";
import type { BookEntity } from "./book.types.js";

function toBookDto(book: BookEntity): Book {
  return {
    id: book.id,
    title: book.title,
    author: book.author,
    year: book.year,
    isbn: book.isbn,
  };
}

export function createBookController(service: BookService) {
  return {
    listBooks: os.listBooks.handler(async ({ input }) => {
      const { items, total } = await service.list(input);
      return {
        items: items.map(toBookDto),
        meta: { page: input.page, limit: input.limit, total },
      };
    }),

    createBook: os.createBook.handler(async ({ input }) => {
      const book = await service.create({
        title: input.title,
        author: input.author,
        year: input.year ?? null,
        isbn: input.isbn ?? null,
      });
      return toBookDto(book);
    }),

    deleteBook: os.deleteBook.handler(async ({ input }) => {
      await service.remove(input.id);
      return { success: true };
    }),


    findBookById: os.findBookById.handler(async ({ input }) => {
      const book = await service.findById(input.id);
      return toBookDto(book);
    }),

    updateBook: os.updateBook.handler(async ({ input }) => {
      const { id, ...data } = input;
      const book = await service.updateBook(id, data);
      return toBookDto(book);
    }),
  };
}
