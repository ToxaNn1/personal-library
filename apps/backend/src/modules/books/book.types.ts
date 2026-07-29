export interface BookEntity {
  id: string;
  title: string;
  author: string;
  year: number | null;
  isbn: string | null;
  createdAt: Date;
}

export interface NewBook {
  title: string;
  author: string;
  year: number | null;
  isbn: string | null;
}

export interface ListBooksParams {
  page: number;
  limit: number;
  sort: "title" | "year" | "createdAt";
  order: "asc" | "desc";
  author?: string;
  search?: string;
}

export interface ListBooksResult {
  items: BookEntity[];
  total: number;
}
