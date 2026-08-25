import { db } from "./client.js";
import { bookGenres, books, genres } from "./schema.js";

const SEED_BOOKS = [
  {
    title: "The Mythical Man-Month",
    pages: 322,
    genres: ["software-engineering"],
    author: "Fred Brooks",
    year: 1975,
    isbn: "978-0201835953",
  },
  {
    title: "The C Programming Language",
    pages: 272,
    genres: ["programming-languages"],
    author: "Brian Kernighan",
    year: 1978,
    isbn: "978-0131103627",
  },
  {
    title: "Structure and Interpretation of Computer Programs",
    pages: 657,
    genres: ["programming-languages", "computer-science"],
    author: "Harold Abelson",
    year: 1985,
    isbn: "978-0262510875",
  },
  {
    title: "The Pragmatic Programmer",
    pages: 352,
    genres: ["software-engineering"],
    author: "Andrew Hunt",
    year: 1999,
    isbn: "978-0201616224",
  },
  {
    title: "Refactoring",
    pages: 448,
    genres: ["software-engineering"],
    author: "Martin Fowler",
    year: 1999,
    isbn: "978-0201485677",
  },
  {
    title: "Design Patterns",
    pages: 395,
    genres: ["software-engineering"],
    author: "Erich Gamma",
    year: 1994,
    isbn: "978-0201633610",
  },
  {
    title: "The Art of Computer Programming",
    pages: 650,
    genres: ["computer-science"],
    author: "Donald Knuth",
    year: 1968,
    isbn: null,
  },
  {
    title: "Introduction to Algorithms",
    pages: 1312,
    genres: ["computer-science"],
    author: "Thomas Cormen",
    year: 1990,
    isbn: "978-0262033848",
  },
  {
    title: "Clean Code",
    pages: 464,
    genres: ["software-engineering"],
    author: "Robert C. Martin",
    year: 2008,
    isbn: "978-0132350884",
  },
  {
    title: "Clean Architecture",
    pages: 432,
    genres: ["architecture"],
    author: "Robert C. Martin",
    year: 2017,
    isbn: "978-0134494166",
  },
  {
    title: "Domain-Driven Design",
    pages: 560,
    genres: ["architecture"],
    author: "Eric Evans",
    year: 2003,
    isbn: "978-0321125217",
  },
  {
    title: "Patterns of Enterprise Application Architecture",
    pages: 560,
    genres: ["architecture"],
    author: "Martin Fowler",
    year: 2002,
    isbn: "978-0321127426",
  },
  {
    title: "Working Effectively with Legacy Code",
    pages: 456,
    genres: ["software-engineering"],
    author: "Michael Feathers",
    year: 2004,
    isbn: "978-0131177055",
  },
  {
    title: "Code Complete",
    pages: 960,
    genres: ["software-engineering"],
    author: "Steve McConnell",
    year: 2004,
    isbn: "978-0735619678",
  },
  {
    title: "The Go Programming Language",
    pages: 380,
    genres: ["programming-languages"],
    author: "Alan Donovan",
    year: 2015,
    isbn: "978-0134190440",
  },
  {
    title: "Programming Rust",
    pages: 622,
    genres: ["programming-languages"],
    author: "Jim Blandy",
    year: 2017,
    isbn: "978-1491927281",
  },
  {
    title: "Effective TypeScript",
    pages: 264,
    genres: ["programming-languages"],
    author: "Dan Vanderkam",
    year: 2019,
    isbn: "978-1492053743",
  },
  {
    title: "Designing Data-Intensive Applications",
    pages: 616,
    genres: ["databases", "architecture"],
    author: "Martin Kleppmann",
    year: 2017,
    isbn: "978-1449373320",
  },
  {
    title: "Database Internals",
    pages: 376,
    genres: ["databases"],
    author: "Alex Petrov",
    year: 2019,
    isbn: "978-1492040347",
  },
  {
    title: "Site Reliability Engineering",
    pages: 552,
    genres: ["devops"],
    author: "Betsy Beyer",
    year: 2016,
    isbn: "978-1491929124",
  },
  {
    title: "The Phoenix Project",
    pages: 432,
    genres: ["devops"],
    author: "Gene Kim",
    year: 2013,
    isbn: "978-0988262508",
  },
  {
    title: "Accelerate",
    pages: 288,
    genres: ["devops"],
    author: "Nicole Forsgren",
    year: 2018,
    isbn: "978-1942788331",
  },
  {
    title: "Release It!",
    pages: 378,
    genres: ["devops", "architecture"],
    author: "Michael Nygard",
    year: 2007,
    isbn: "978-0978739218",
  },
  {
    title: "Grokking Algorithms",
    pages: 256,
    genres: ["computer-science"],
    author: "Aditya Bhargava",
    year: 2016,
    isbn: "978-1617292231",
  },
  {
    title: "You Don't Know JS",
    pages: 278,
    genres: ["programming-languages"],
    author: "Kyle Simpson",
    year: 2015,
    isbn: null,
  },
  {
    title: "Eloquent JavaScript",
    pages: 472,
    genres: ["programming-languages"],
    author: "Marijn Haverbeke",
    year: 2018,
    isbn: "978-1593279509",
  },
  {
    title: "Fluent Python",
    pages: 792,
    genres: ["programming-languages"],
    author: "Luciano Ramalho",
    year: 2015,
    isbn: "978-1491946008",
  },
  {
    title: "Programming Pearls",
    pages: 256,
    genres: ["computer-science"],
    author: "Jon Bentley",
    year: 1986,
    isbn: "978-0201657883",
  },
  {
    title: "The Rust Programming Language",
    pages: 560,
    genres: ["programming-languages"],
    author: "Steve Klabnik",
    year: 2019,
    isbn: "978-1718500440",
  },
  {
    title: "Test-Driven Development",
    pages: 240,
    genres: ["software-engineering"],
    author: "Kent Beck",
    year: 2002,
    isbn: "978-0321146533",
  },
];

const SEED_GENRES = [
  { name: "Software engineering", slug: "software-engineering" },
  { name: "Programming languages", slug: "programming-languages" },
  { name: "Computer science", slug: "computer-science" },
  { name: "Architecture", slug: "architecture" },
  { name: "Databases", slug: "databases" },
  { name: "DevOps", slug: "devops" },
];

export async function seed() {
  await db.delete(bookGenres);
  await db.delete(books);
  await db.delete(genres);

  const genreRows = await db.insert(genres).values(SEED_GENRES).returning();
  const genreBySlug = new Map(genreRows.map((g) => [g.slug, g.id]));

  const bookRows = await db
    .insert(books)
    .values(SEED_BOOKS.map(({ genres: _genres, ...book }) => book))
    .returning();

  const links = SEED_BOOKS.flatMap((seed, i) =>
    seed.genres.map((slug) => ({
      bookId: bookRows[i]!.id,
      genreId: genreBySlug.get(slug)!,
    })),
  );
  await db.insert(bookGenres).values(links);

  console.log(`Seeded ${bookRows.length} books, ${genreRows.length} genres, ${links.length} links`);
}
