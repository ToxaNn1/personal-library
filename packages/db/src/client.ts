import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema.js";

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

export const db = drizzle(pool, { schema });

export type DB = typeof db;
