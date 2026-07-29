import { pino } from "pino";

const isProduction = process.env.NODE_ENV === "production";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? (isProduction ? "warn" : "info"),
  formatters: { level: (label) => ({ level: label }) },
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: ["req.headers.authorization", "req.headers.cookie", "*.password", "*.token"],
  transport: isProduction ? undefined : { target: "pino-pretty", options: { colorize: true } },
});

export type Logger = typeof logger;
