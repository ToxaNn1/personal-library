import type { ShelfKind } from "@library/db";

export type { ShelfKind };

export interface ShelfEntity {
  id: string;
  userId: string;
  name: string;
  kind: ShelfKind;
  bookCount: number;
}

export interface ShelfBookEntity {
  id: string;
  title: string;
  author: string;
  year: number | null;
  isbn: string | null;
  addedAt: Date;
}

export interface ListShelfBooksParams {
  userId: string;
  kind: ShelfKind;
  page: number;
  limit: number;
}

export interface ListShelfBooksResult {
  items: ShelfBookEntity[];
  total: number;
}
