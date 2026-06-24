import { contract, type Book } from "@library/contracts";
import { implement, ORPCError } from "@orpc/server";
import { pool } from "./db.js";

const os = implement(contract);

export const router = os.router({
  hello: os.hello.handler(({ input }) => {
    return { message: `Hello, ${input.name}!` };
  }),

  listBooks: os.listBooks.handler(async (): Promise<Book[]> => {
    const result = await pool.query<Book>(
      "SELECT id, title, author, year FROM books ORDER BY year ASC NULLS LAST",
    );
    return result.rows;
  }),

  createBook: os.createBook.handler(async ({ input }): Promise<Book> => {
    const result = await pool.query<Book>(
      `INSERT INTO books (title, author, year)
       VALUES ($1, $2, $3)
       RETURNING id, title, author, year`,
      [input.title, input.author, input.year ?? null],
    );
    const book = result.rows[0];
    if (!book) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "Failed to insert book" });
    }
    return book;
  }),

  deleteBook: os.deleteBook.handler(async ({ input }) => {
    const result = await pool.query("DELETE FROM books WHERE id = $1", [input.id]);
    if (result.rowCount === 0) {
      throw new ORPCError("NOT_FOUND", { message: `Book ${input.id} not found` });
    }
    return { success: true };
  }),
});

export type AppRouter = typeof router;
