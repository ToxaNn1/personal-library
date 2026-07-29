export interface BookEntity {
  id: string;
  title: string;
  author: string;
  year: number | null;
  isbn: string | null;
  ownerId: string | null;
  ownerName: string | null;
  createdAt: Date;
}

export interface NewBook {
  title: string;
  author: string;
  year: number | null;
  isbn: string | null;
  ownerId: string | null;
}

export type BookUpdate = Partial<Omit<NewBook, "ownerId">>;

export interface ListBooksParams {
  page: number;
  limit: number;
  sort: "title" | "year" | "createdAt";
  order: "asc" | "desc";
  author?: string;
  search?: string;
  ownerId?: string;
}

export interface ListBooksResult {
  items: BookEntity[];
  total: number;
}
