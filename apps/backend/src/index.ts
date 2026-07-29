import "dotenv/config";

import { randomUUID } from "node:crypto";
import { serve } from "@hono/node-server";
import { getConnInfo } from "@hono/node-server/conninfo";
import { RPCHandler } from "@orpc/server/fetch";
import { Hono, type Context } from "hono";
import { cors } from "hono/cors";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { db } from "@library/db";
import { RedisCache, redis } from "./cache.js";
import { HttpException, RateLimitError } from "./errors.js";
import { logger } from "./logger.js";
import { os } from "./orpc.js";
import { RateLimiter } from "./rate-limit.js";
import { createBookController } from "./modules/books/book.controller.js";
import { DrizzleBookRepository } from "./modules/books/book.repository.drizzle.js";
import { BookService } from "./modules/books/book.service.js";

const bookRepository = new DrizzleBookRepository(db);
const bookCache = new RedisCache(redis);
const bookService = new BookService(bookRepository, bookCache);
const rateLimiter = new RateLimiter(redis);

const router = os.router({
  hello: os.hello.handler(({ input }) => ({ message: `Hello, ${input.name}!` })),
  ...createBookController(bookService),
});

type Variables = { requestId: string };

const app = new Hono<{ Variables: Variables }>();

app.use("*", async (c, next) => {
  const requestId = c.req.header("x-request-id") ?? randomUUID();
  c.set("requestId", requestId);
  c.header("x-request-id", requestId);
  await next();
});

app.use("*", async (c, next) => {
  const start = Date.now();
  await next();
  logger.info(
    {
      requestId: c.get("requestId"),
      method: c.req.method,
      path: c.req.path,
      status: c.res.status,
      durationMs: Date.now() - start,
    },
    "request",
  );
});

app.use(
  "*",
  cors({
    origin: ["http://localhost:3000"],
    credentials: true,
  }),
);

const WRITE_PROCEDURES = ["createBook", "updateBook", "deleteBook"];

// Proxy headers are only trusted when we know a proxy sits in front, otherwise
// any client could spoof them to get a fresh bucket per request.
const TRUST_PROXY = process.env.TRUST_PROXY === "true";

function clientKey(c: Context<{ Variables: Variables }>): string {
  if (TRUST_PROXY) {
    const forwarded = c.req.header("x-forwarded-for")?.split(",")[0]?.trim();
    const real = c.req.header("x-real-ip")?.trim();
    if (forwarded) return forwarded;
    if (real) return real;
  }

  const socket = getConnInfo(c).remote.address;
  return socket ?? "unknown";
}

app.use("/rpc/*", async (c, next) => {
  const procedure = c.req.path.replace("/rpc/", "");
  if (!WRITE_PROCEDURES.includes(procedure)) return next();

  await rateLimiter.check("write", clientKey(c), { limit: 20, windowSec: 60 });
  await next();
});

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

app.onError((err, c) => {
  const requestId = c.get("requestId");

  if (err instanceof HttpException) {
    logger.warn({ requestId, code: err.code, status: err.status }, err.message);
    if (err instanceof RateLimitError) {
      c.header("Retry-After", String(err.retryAfterSeconds));
    }
    return c.json(
      { code: err.code, message: err.message, details: err.details },
      err.status as ContentfulStatusCode,
    );
  }

  logger.error({ requestId, err }, "unhandled error");
  return c.json({ code: "INTERNAL_ERROR", message: "Something went wrong" }, 500);
});

const port = Number(process.env.PORT ?? 3001);

serve({ fetch: app.fetch, port }, ({ port }) => {
  logger.info({ port }, `Backend listening on http://localhost:${port}`);
});
