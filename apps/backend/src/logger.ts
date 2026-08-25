import { pino } from "pino";
import { env } from "./env.js";

const isProduction = env.NODE_ENV === "production";

export const logger = pino({
  level: env.LOG_LEVEL ?? (isProduction ? "warn" : "info"),
  formatters: { level: (label) => ({ level: label }) },
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: ["req.headers.authorization", "req.headers.cookie", "*.password", "*.token"],
  transport: isProduction ? undefined : { target: "pino-pretty", options: { colorize: true } },
});

export type Logger = typeof logger;
