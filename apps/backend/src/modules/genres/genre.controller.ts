import { os } from "../../orpc.js";
import type { GenreService } from "./genre.service.js";

export function createGenreController(service: GenreService) {
  return {
    listGenres: os.listGenres.handler(async () => {
      const genres = await service.list();
      return genres.map((genre) => ({
        id: genre.id,
        name: genre.name,
        slug: genre.slug,
        bookCount: genre.bookCount,
      }));
    }),
  };
}
