export interface BookEntity {
  id: string;
  title: string;
  author: string;
  year: number | null;
}

export interface NewBook {
  title: string;
  author: string;
  year: number | null;
}
