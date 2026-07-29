import { sql } from "drizzle-orm";
import {
  foreignKey,
  index,
  pgTable,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "./auth-schema.js";
import { books } from "./schema.js";

export const SHELF_KINDS = ["to_read", "reading", "finished", "custom"] as const;
export type ShelfKind = (typeof SHELF_KINDS)[number];

export const DEFAULT_SHELVES: { kind: ShelfKind; name: string }[] = [
  { kind: "to_read", name: "To read" },
  { kind: "reading", name: "Reading" },
  { kind: "finished", name: "Finished" },
];

export const shelves = pgTable(
  "shelves",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    kind: text("kind").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique("shelves_user_name_unique").on(t.userId, t.name),
    unique("shelves_id_user_unique").on(t.id, t.userId),
    uniqueIndex("shelves_user_kind_unique")
      .on(t.userId, t.kind)
      .where(sql`${t.kind} <> 'custom'`),
    index("shelves_user_idx").on(t.userId),
  ],
);

export const shelfItems = pgTable(
  "shelf_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    shelfId: uuid("shelf_id").notNull(),
    userId: text("user_id").notNull(),
    bookId: uuid("book_id")
      .notNull()
      .references(() => books.id, { onDelete: "cascade" }),
    addedAt: timestamp("added_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    foreignKey({
      columns: [t.shelfId, t.userId],
      foreignColumns: [shelves.id, shelves.userId],
      name: "shelf_items_shelf_fk",
    }).onDelete("cascade"),
    unique("shelf_items_user_book_unique").on(t.userId, t.bookId),
    index("shelf_items_shelf_idx").on(t.shelfId),
    index("shelf_items_book_idx").on(t.bookId),
  ],
);

export type ShelfRow = typeof shelves.$inferSelect;
export type ShelfItemRow = typeof shelfItems.$inferSelect;
