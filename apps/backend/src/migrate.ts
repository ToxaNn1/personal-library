import { env } from "./env.js";

import { pool } from "@library/db";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";

const MIGRATIONS_FOLDER = process.env.MIGRATIONS_FOLDER ?? "packages/db/drizzle";

async function main() {
  console.log(`Applying migrations from ${MIGRATIONS_FOLDER}`);
  await migrate(drizzle(pool), { migrationsFolder: MIGRATIONS_FOLDER });
  console.log(`Migrations applied against ${new URL(env.DATABASE_URL).host}`);
}

main()
  .catch((err) => {
    console.error("Migration failed:", err);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
