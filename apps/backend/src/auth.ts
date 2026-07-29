import "dotenv/config";

import { db } from "@library/db";
import * as schema from "@library/db/schema";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", schema }),
  emailAndPassword: { enabled: true },
  session: {
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
  },
  trustedOrigins: ["http://localhost:3000"],
  advanced: {
    cookiePrefix: "library",
  },
});

export type Session = typeof auth.$Infer.Session;
