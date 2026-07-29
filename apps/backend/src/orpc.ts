import { contract } from "@library/contracts";
import { ORPCError, implement } from "@orpc/server";
import type { Session } from "./auth.js";
import { HttpException, UnauthorisedError } from "./errors.js";
import { logger } from "./logger.js";

export interface AppContext {
  session: Session | null;
}

const base = implement(contract).$context<AppContext>();

export const os = base.use(async ({ next }) => {
  try {
    return await next();
  } catch (err) {
    if (err instanceof ORPCError) throw err;

    if (err instanceof HttpException) {
      throw new ORPCError(err.code, {
        status: err.status,
        message: err.message,
        data: err.details,
      });
    }

    logger.error({ err }, "unhandled error in procedure");
    throw new ORPCError("INTERNAL_ERROR", {
      status: 500,
      message: "Something went wrong",
    });
  }
});

export const authed = os.use(async ({ context, next }) => {
  if (!context.session) {
    throw new UnauthorisedError("Sign in to perform this action");
  }
  return next({ context: { user: context.session.user } });
});
