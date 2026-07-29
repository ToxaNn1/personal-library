import "./load-env.js";
import { db, pool } from "./client.js";
import { books } from "./schema.js";

const SEED_BOOKS = [
  { title: "The Mythical Man-Month", author: "Fred Brooks", year: 1975, isbn: "978-0201835953" },
  { title: "The C Programming Language", author: "Brian Kernighan", year: 1978, isbn: "978-0131103627" },
  { title: "Structure and Interpretation of Computer Programs", author: "Harold Abelson", year: 1985, isbn: "978-0262510875" },
  { title: "The Pragmatic Programmer", author: "Andrew Hunt", year: 1999, isbn: "978-0201616224" },
  { title: "Refactoring", author: "Martin Fowler", year: 1999, isbn: "978-0201485677" },
  { title: "Design Patterns", author: "Erich Gamma", year: 1994, isbn: "978-0201633610" },
  { title: "The Art of Computer Programming", author: "Donald Knuth", year: 1968, isbn: null },
  { title: "Introduction to Algorithms", author: "Thomas Cormen", year: 1990, isbn: "978-0262033848" },
  { title: "Clean Code", author: "Robert C. Martin", year: 2008, isbn: "978-0132350884" },
  { title: "Clean Architecture", author: "Robert C. Martin", year: 2017, isbn: "978-0134494166" },
  { title: "Domain-Driven Design", author: "Eric Evans", year: 2003, isbn: "978-0321125217" },
  { title: "Patterns of Enterprise Application Architecture", author: "Martin Fowler", year: 2002, isbn: "978-0321127426" },
  { title: "Working Effectively with Legacy Code", author: "Michael Feathers", year: 2004, isbn: "978-0131177055" },
  { title: "Code Complete", author: "Steve McConnell", year: 2004, isbn: "978-0735619678" },
  { title: "The Go Programming Language", author: "Alan Donovan", year: 2015, isbn: "978-0134190440" },
  { title: "Programming Rust", author: "Jim Blandy", year: 2017, isbn: "978-1491927281" },
  { title: "Effective TypeScript", author: "Dan Vanderkam", year: 2019, isbn: "978-1492053743" },
  { title: "Designing Data-Intensive Applications", author: "Martin Kleppmann", year: 2017, isbn: "978-1449373320" },
  { title: "Database Internals", author: "Alex Petrov", year: 2019, isbn: "978-1492040347" },
  { title: "Site Reliability Engineering", author: "Betsy Beyer", year: 2016, isbn: "978-1491929124" },
  { title: "The Phoenix Project", author: "Gene Kim", year: 2013, isbn: "978-0988262508" },
  { title: "Accelerate", author: "Nicole Forsgren", year: 2018, isbn: "978-1942788331" },
  { title: "Release It!", author: "Michael Nygard", year: 2007, isbn: "978-0978739218" },
  { title: "Grokking Algorithms", author: "Aditya Bhargava", year: 2016, isbn: "978-1617292231" },
  { title: "You Don't Know JS", author: "Kyle Simpson", year: 2015, isbn: null },
  { title: "Eloquent JavaScript", author: "Marijn Haverbeke", year: 2018, isbn: "978-1593279509" },
  { title: "Fluent Python", author: "Luciano Ramalho", year: 2015, isbn: "978-1491946008" },
  { title: "Programming Pearls", author: "Jon Bentley", year: 1986, isbn: "978-0201657883" },
  { title: "The Rust Programming Language", author: "Steve Klabnik", year: 2019, isbn: "978-1718500440" },
  { title: "Test-Driven Development", author: "Kent Beck", year: 2002, isbn: "978-0321146533" },
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
