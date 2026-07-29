import "dotenv/config";

import { serve } from "@hono/node-server";
import { RPCHandler } from "@orpc/server/fetch";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { db } from "@library/db";
import { RedisCache, redis } from "./cache.js";
import { os } from "./orpc.js";
import { createBookController } from "./modules/books/book.controller.js";
import { DrizzleBookRepository } from "./modules/books/book.repository.drizzle.js";
import { BookService } from "./modules/books/book.service.js";

const bookRepository = new DrizzleBookRepository(db);
const bookCache = new RedisCache(redis);
const bookService = new BookService(bookRepository, bookCache);

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
