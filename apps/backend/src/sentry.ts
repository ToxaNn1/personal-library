import * as Sentry from "@sentry/node";
import { env } from "./env.js";

const enabled = Boolean(env.SENTRY_DSN);

if (enabled) {
  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.RAILWAY_ENVIRONMENT_NAME ?? env.NODE_ENV,
    release: env.RAILWAY_GIT_COMMIT_SHA ?? env.RAILWAY_DEPLOYMENT_ID,
    tracesSampleRate: 0,
    sendDefaultPii: false,
  });
}

export function captureException(err: unknown, context: Record<string, unknown> = {}): void {
  if (!enabled) return;
  Sentry.captureException(err, { extra: context });
}

export async function closeSentry(): Promise<void> {
  if (!enabled) return;
  await Sentry.close(2000);
}

export const sentryEnabled = enabled;
