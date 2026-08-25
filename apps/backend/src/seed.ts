import { env } from "./env.js";

import { pool, seed } from "@library/db";

seed()
  .then(() => console.log(`Seeded ${new URL(env.DATABASE_URL).host}`))
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
