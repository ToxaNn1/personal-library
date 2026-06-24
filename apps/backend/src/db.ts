import pg from "pg";

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set. Did you create apps/backend/.env?");
}

export const pool = new Pool({ connectionString });

pool.on("error", (err) => {
  console.error("Unexpected error on idle Postgres client:", err);
  process.exit(1);
});
