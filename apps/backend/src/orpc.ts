import { contract } from "@library/contracts";
import { ORPCError, implement } from "@orpc/server";
import { HttpException } from "./errors.js";
import { logger } from "./logger.js";

export const os = implement(contract).use(async ({ next }) => {
  try {
    return await next();
  } catch (err) {
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
