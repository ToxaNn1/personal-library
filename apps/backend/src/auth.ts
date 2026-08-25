import { DEFAULT_SHELVES, db, shelves } from "@library/db";
import * as schema from "@library/db/schema";
import { betterAuth } from "better-auth";
import { env } from "./env.js";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", schema }),
  databaseHooks: {
    user: {
      create: {
        after: async (createdUser) => {
          await db
            .insert(shelves)
            .values(DEFAULT_SHELVES.map((shelf) => ({ ...shelf, userId: createdUser.id })));
        },
      },
    },
  },
  emailAndPassword: { enabled: true },
  session: {
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
    cookieCache: { enabled: true, maxAge: 5 * 60 },
  },
  trustedOrigins: [env.WEB_ORIGIN],
  advanced: {
    cookiePrefix: "library",
  },
});

export type Session = typeof auth.$Infer.Session;
