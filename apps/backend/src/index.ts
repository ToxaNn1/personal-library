import "dotenv/config";

import { serve } from "@hono/node-server";
import { RPCHandler } from "@orpc/server/fetch";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { pool } from "./db.js";
import { os } from "./orpc.js";
import { createBookController } from "./modules/books/book.controller.js";
import { PgBookRepository } from "./modules/books/book.repository.pg.js";
import { BookService } from "./modules/books/book.service.js";

const bookRepository = new PgBookRepository(pool);
const bookService = new BookService(bookRepository);

const router = os.router({
  hello: os.hello.handler(({ input }) => ({ message: `Hello, ${input.name}!` })),
  ...createBookController(bookService),
});

const app = new Hono();

app.use("*", logger());
app.use(
  "*",
  cors({
    origin: ["http://localhost:3000"],
    credentials: true,
  }),
);

app.get("/", (c) => c.json({ status: "ok", service: "@library/api" }));

const rpcHandler = new RPCHandler(router);

app.all("/rpc/*", async (c) => {
  const { matched, response } = await rpcHandler.handle(c.req.raw, {
    prefix: "/rpc",
    context: {},
  });
  if (matched) return response;
  return c.notFound();
});

const port = Number(process.env.PORT ?? 3001);

serve({ fetch: app.fetch, port }, ({ port }) => {
  console.log(`Backend - http://localhost:${port}`);
  console.log(`RPC endpoint - http://localhost:${port}/rpc`);
});
