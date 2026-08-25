import type { GenreRepository } from "./genre.repository.js";
import type { GenreEntity } from "./genre.types.js";

export class GenreService {
  constructor(private readonly repo: GenreRepository) {}

  list(): Promise<GenreEntity[]> {
    return this.repo.list();
  }
}
