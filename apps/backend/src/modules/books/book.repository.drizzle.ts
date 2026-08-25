import {
  and,
  asc,
  bookGenres,
  books,
  desc,
  eq,
  ilike,
  shelfItems,
  shelves,
  sql,
  user,
  type DB,
  type SQL,
} from "@library/db";
import type { BookRepository } from "./book.repository.js";
import type {
  BookEntity,
  BookUpdate,
  ListBooksParams,
  ListBooksResult,
  NewBook,
} from "./book.types.js";

const SORT_COLUMNS = {
  title: books.title,
  year: books.year,
  createdAt: books.createdAt,
} as const;

const BOOK_FIELDS = {
  id: books.id,
  title: books.title,
  author: books.author,
  year: books.year,
  isbn: books.isbn,
  pages: books.pages,
  genres: sql<{ id: string; name: string; slug: string }[]>`coalesce(
    (select json_agg(json_build_object('id', g.id, 'name', g.name, 'slug', g.slug) order by g.name)
     from book_genres bg join genres g on g.id = bg.genre_id
     where bg.book_id = ${books.id}),
    '[]'::json)`,
  ownerId: books.ownerId,
  ownerName: user.name,
  shelfKind: shelves.kind,
  createdAt: books.createdAt,
};

function toTsQuery(search: string): string | null {
  const terms = search
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);

  if (terms.length === 0) return null;

  return terms.map((term, i) => (i === terms.length - 1 ? `${term}:*` : term)).join(" & ");
}

function viewerShelfJoin(viewerId: string | undefined) {
  if (!viewerId) return sql`false`;
  return and(eq(shelfItems.userId, viewerId), sql`${shelfItems.kind} <> 'custom'`);
}

export class DrizzleBookRepository implements BookRepository {
  constructor(private readonly db: DB) {}

  async list(params: ListBooksParams): Promise<ListBooksResult> {
    const conditions: SQL[] = [];
    if (params.author) conditions.push(eq(books.author, params.author));
    if (params.search) {
      const tsQuery = toTsQuery(params.search);
      conditions.push(
        tsQuery
          ? sql`to_tsvector('simple', ${books.title}) @@ to_tsquery('simple', ${tsQuery})`
          : ilike(books.title, `%${params.search}%`),
      );
    }
    if (params.ownerId) conditions.push(eq(books.ownerId, params.ownerId));
    if (params.genre) {
      conditions.push(
        sql`exists (select 1 from book_genres bg join genres g on g.id = bg.genre_id
              where bg.book_id = ${books.id} and g.slug = ${params.genre})`,
      );
    }
    const where = conditions.length ? and(...conditions) : undefined;

    const column = SORT_COLUMNS[params.sort];
    const orderBy = params.order === "asc" ? asc(column) : desc(column);

    const items = await this.db
      .select(BOOK_FIELDS)
      .from(books)
      .leftJoin(user, eq(books.ownerId, user.id))
      .leftJoin(shelfItems, and(eq(shelfItems.bookId, books.id), viewerShelfJoin(params.viewerId)))
      .leftJoin(shelves, eq(shelves.id, shelfItems.shelfId))
      .where(where)
      .orderBy(orderBy)
      .limit(params.limit)
      .offset((params.page - 1) * params.limit);

    const countRows = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(books)
      .where(where);
    const total = countRows[0]?.count ?? 0;

    return { items, total };
  }

  async create(data: NewBook): Promise<BookEntity> {
    const { genreIds, ...values } = data;

    const inserted = await this.db.transaction(async (tx) => {
      const [row] = await tx.insert(books).values(values).returning({ id: books.id });
      if (!row) throw new Error("INSERT ... RETURNING returned no row");

      if (genreIds?.length) {
        await tx
          .insert(bookGenres)
          .values(genreIds.map((genreId) => ({ bookId: row.id, genreId })))
          .onConflictDoNothing();
      }
      return row;
    });

    const book = await this.findById(inserted.id);
    if (!book) throw new Error("Inserted book could not be read back");
    return book;
  }

  async delete(id: string, ownerId: string): Promise<boolean> {
    const deleted = await this.db
      .delete(books)
      .where(and(eq(books.id, id), eq(books.ownerId, ownerId)))
      .returning({ id: books.id });
    return deleted.length > 0;
  }

  async findById(id: string, viewerId?: string): Promise<BookEntity | null> {
    const [book] = await this.db
      .select(BOOK_FIELDS)
      .from(books)
      .leftJoin(user, eq(books.ownerId, user.id))
      .leftJoin(shelfItems, and(eq(shelfItems.bookId, books.id), viewerShelfJoin(viewerId)))
      .leftJoin(shelves, eq(shelves.id, shelfItems.shelfId))
      .where(eq(books.id, id))
      .limit(1);
    return book ?? null;
  }

  async updateBook(id: string, data: BookUpdate, ownerId: string): Promise<BookEntity | null> {
    const [updated] = await this.db
      .update(books)
      .set(data)
      .where(and(eq(books.id, id), eq(books.ownerId, ownerId)))
      .returning({ id: books.id });
    if (!updated) return null;

    return this.findById(updated.id);
  }
}
