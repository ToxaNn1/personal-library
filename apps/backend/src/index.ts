import { env } from "./env.js";
import { captureException, closeSentry, sentryEnabled } from "./sentry.js";

import { randomUUID } from "node:crypto";
import { serve } from "@hono/node-server";
import { getConnInfo } from "@hono/node-server/conninfo";
import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { RPCHandler } from "@orpc/server/fetch";
import { ZodSmartCoercionPlugin } from "@orpc/zod";
import { Hono, type Context, type MiddlewareHandler } from "hono";
import { cors } from "hono/cors";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { db, pool, sql } from "@library/db";
import { auth } from "./auth.js";
import { RedisCache, redis } from "./cache.js";
import { BookCache } from "./modules/books/book.cache.js";
import { HttpException, RateLimitError } from "./errors.js";
import { logger } from "./logger.js";
import { docsPage, openApiSpec } from "./openapi.js";
import { os } from "./orpc.js";
import { RateLimiter } from "./rate-limit.js";
import { createBookController } from "./modules/books/book.controller.js";
import { DrizzleBookRepository } from "./modules/books/book.repository.drizzle.js";
import { BookService } from "./modules/books/book.service.js";
import { createShelfController } from "./modules/shelves/shelf.controller.js";
import { DrizzleShelfRepository } from "./modules/shelves/shelf.repository.drizzle.js";
import { ShelfService } from "./modules/shelves/shelf.service.js";
import { createGenreController } from "./modules/genres/genre.controller.js";
import { DrizzleGenreRepository } from "./modules/genres/genre.repository.drizzle.js";
import { GenreService } from "./modules/genres/genre.service.js";
import { createStatsController } from "./modules/stats/stats.controller.js";
import { DrizzleStatsRepository } from "./modules/stats/stats.repository.drizzle.js";
import { StatsService } from "./modules/stats/stats.service.js";
import { createNotificationController } from "./modules/notifications/notification.controller.js";
import { DrizzleNotificationRepository } from "./modules/notifications/notification.repository.drizzle.js";
import { NotificationService } from "./modules/notifications/notification.service.js";
import { createGoalController } from "./modules/goals/goal.controller.js";
import { DrizzleGoalRepository } from "./modules/goals/goal.repository.drizzle.js";
import { GoalService } from "./modules/goals/goal.service.js";
import { createRecommendationController } from "./modules/recommendations/recommendation.controller.js";
import { DrizzleRecommendationRepository } from "./modules/recommendations/recommendation.repository.drizzle.js";
import { RecommendationService } from "./modules/recommendations/recommendation.service.js";
import { createSocialController } from "./modules/social/social.controller.js";
import { DrizzleSocialRepository } from "./modules/social/social.repository.drizzle.js";
import { SocialService } from "./modules/social/social.service.js";
import { createReviewController } from "./modules/reviews/review.controller.js";
import { DrizzleReviewRepository } from "./modules/reviews/review.repository.drizzle.js";
import { ReviewService } from "./modules/reviews/review.service.js";

const bookRepository = new DrizzleBookRepository(db);
const bookCache = new BookCache(new RedisCache(redis));
const bookService = new BookService(bookRepository, bookCache);
const shelfRepository = new DrizzleShelfRepository(db);
const notificationService = new NotificationService(new DrizzleNotificationRepository(db));
const shelfService = new ShelfService(
  shelfRepository,
  bookRepository,
  bookCache,
  notificationService,
);
const reviewRepository = new DrizzleReviewRepository(db);
const reviewService = new ReviewService(reviewRepository, bookRepository, bookCache);
const genreService = new GenreService(new DrizzleGenreRepository(db));
const statsService = new StatsService(new DrizzleStatsRepository(db));
const recommendationService = new RecommendationService(new DrizzleRecommendationRepository(db));
const socialService = new SocialService(new DrizzleSocialRepository(db));
const goalService = new GoalService(new DrizzleGoalRepository(db));
const rateLimiter = new RateLimiter(redis);

const router = os.router({
  hello: os.hello.handler(({ input }) => ({ message: `Hello, ${input.name}!` })),
  ...createBookController(bookService),
  ...createShelfController(shelfService),
  ...createReviewController(reviewService),
  ...createGenreController(genreService),
  ...createStatsController(statsService),
  ...createRecommendationController(recommendationService),
  ...createSocialController(socialService),
  ...createGoalController(goalService),
  ...createNotificationController(notificationService),
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
    origin: env.WEB_ORIGIN,
    credentials: true,
  }),
);

const WRITE_PROCEDURES = [
  "createBook",
  "updateBook",
  "deleteBook",
  "placeBookOnShelf",
  "removeBookFromShelves",
  "finishAndReview",
  "followUser",
  "unfollowUser",
  "setReadingGoal",
  "createShelf",
  "deleteShelf",
  "addBookToShelf",
  "removeBookFromShelf",
  "markNotificationRead",
];

const TRUST_PROXY = env.TRUST_PROXY;

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

const limitWrite = (c: Context<{ Variables: Variables }>) =>
  rateLimiter.check("write", clientKey(c), { limit: 20, windowSec: 60 });

const rateLimitRpcWrites: MiddlewareHandler<{ Variables: Variables }> = async (c, next) => {
  const procedure = c.req.path.replace("/rpc/", "");
  if (!WRITE_PROCEDURES.includes(procedure)) return next();

  await limitWrite(c);
  await next();
};

const rateLimitRestWrites: MiddlewareHandler<{ Variables: Variables }> = async (c, next) => {
  if (c.req.method === "GET") return next();

  await limitWrite(c);
  await next();
};

app.use("/rpc/*", rateLimitRpcWrites);
app.use("/api/v1/*", rateLimitRestWrites);

app.use("/api/auth/*", async (c, next) => {
  const path = c.req.path;
  if (path.includes("/sign-in") || path.includes("/sign-up")) {
    await rateLimiter.check("auth", clientKey(c), { limit: 10, windowSec: 60 });
  }
  await next();
});

app.all("/api/auth/*", (c) => auth.handler(c.req.raw));

const VERSION =
  env.RAILWAY_GIT_COMMIT_SHA?.slice(0, 7) ?? env.RAILWAY_DEPLOYMENT_ID?.slice(0, 8) ?? "dev";

app.get("/", (c) => c.json({ status: "ok", service: "@library/api" }));

app.get("/health", async (c) => {
  const checks = await Promise.allSettled([db.execute(sql`select 1`), redis.ping()]);
  const database = checks[0]?.status === "fulfilled";
  const cache = checks[1]?.status === "fulfilled";
  const healthy = database && cache;

  return c.json(
    {
      status: healthy ? "ok" : "degraded",
      environment: env.RAILWAY_ENVIRONMENT_NAME ?? env.NODE_ENV,
      version: VERSION,
      checks: { database, cache },
    },
    healthy ? 200 : 503,
  );
});

const rpcHandler = new RPCHandler(router);

const apiHandler = new OpenAPIHandler(router, {
  plugins: [new ZodSmartCoercionPlugin()],
});

app.get("/openapi.json", async (c) => c.json((await openApiSpec()) as object));

app.get("/docs", (c) => c.html(docsPage));

app.all("/api/v1/*", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  const { matched, response } = await apiHandler.handle(c.req.raw, {
    prefix: "/api/v1",
    context: { session },
  });
  if (matched) return response;
  return c.notFound();
});

app.all("/rpc/*", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  const { matched, response } = await rpcHandler.handle(c.req.raw, {
    prefix: "/rpc",
    context: { session },
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
  captureException(err, { requestId, path: c.req.path });
  return c.json({ code: "INTERNAL_ERROR", message: "Something went wrong" }, 500);
});

const port = env.PORT;

const server = serve({ fetch: app.fetch, port, hostname: "0.0.0.0" }, ({ port }) => {
  logger.info(
    { port, version: VERSION, sentry: sentryEnabled },
    `Backend listening on port ${port}`,
  );
});

process.on("SIGTERM", () => {
  logger.info("SIGTERM received, draining connections");
  server.close(() => {
    void Promise.allSettled([closeSentry(), pool.end(), redis.quit()]).then(() => process.exit(0));
  });
});
