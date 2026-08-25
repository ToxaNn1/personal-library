export interface YearStatsEntity {
  year: number;
  booksFinished: number;
  totalPages: number;
  averageRating: number | null;
  topGenre: string | null;
}

export interface ReadingStats {
  user: { id: string; name: string };
  years: YearStatsEntity[];
}
