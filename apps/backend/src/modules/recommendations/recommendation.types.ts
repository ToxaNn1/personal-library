export interface RecommendationEntity {
  id: string;
  title: string;
  author: string;
  year: number | null;
  pages: number | null;
  matchedGenres: string[];
  score: number;
}
