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
  };
}

export function createBookController(service: BookService) {
  return {
    listBooks: os.listBooks.handler(async () => {
      const books = await service.list();
      return books.map(toBookDto);
    }),

    createBook: os.createBook.handler(async ({ input }) => {
      const book = await service.create({
        title: input.title,
        author: input.author,
        year: input.year ?? null,
      });
      return toBookDto(book);
    }),

    deleteBook: os.deleteBook.handler(async ({ input }) => {
      await service.remove(input.id);
      return { success: true };
    }),
  };
}
