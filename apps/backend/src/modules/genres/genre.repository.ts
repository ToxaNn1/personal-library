import type { GenreEntity } from "./genre.types.js";

export interface GenreRepository {
  list(): Promise<GenreEntity[]>;
}
