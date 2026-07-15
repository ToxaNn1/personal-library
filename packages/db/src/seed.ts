import "./load-env.js";
import { db, pool } from "./client.js";
import { books } from "./schema.js";

const SEED_BOOKS = [
  { title: "Книга 1", author: "Антон", year: 1975 },
  { title: "Книга 2", author: "Антон Д", year: 1999 },
  { title: "Книга 6", author: "Кирило", year: 1999 },
  { title: "Книга 12", author: "Іларіон", year: 1999 },
  { title: "Книга 3", author: "Сергій Д", year: 1999 },
];

async function main() {
  await db.delete(books);
  await db.insert(books).values(SEED_BOOKS);

  const rows = await db.select().from(books);
  console.log(`Seeded ${rows.length} books`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
