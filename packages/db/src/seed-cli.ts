import "./load-env.js";
import { pool } from "./client.js";
import { seed } from "./seed.js";

seed()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
