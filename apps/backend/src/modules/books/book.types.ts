export interface BookEntity {
  id: string;
  title: string;
  author: string;
  year: number | null;
  isbn: string | null;
  pages: number | null;
  genres: { id: string; name: string; slug: string }[];
  ownerId: string | null;
  ownerName: string | null;
  shelfKind: string | null;
  createdAt: Date;
}

export interface NewBook {
  title: string;
  author: string;
  year: number | null;
  isbn: string | null;
  pages: number | null;
  genreIds?: string[];
  ownerId: string | null;
}

export type BookUpdate = Partial<Omit<NewBook, "ownerId" | "genreIds">>;

export interface ListBooksParams {
  page: number;
  limit: number;
  sort: "title" | "year" | "createdAt";
  order: "asc" | "desc";
  author?: string;
  search?: string;
  ownerId?: string;
  viewerId?: string;
  genre?: string;
}

export interface ListBooksResult {
  items: BookEntity[];
  total: number;
}
