export interface RecipeRating {
  id: number;
  recipe: number;
  rating: number; // 0-10, should be 0-5 in the UI
  comment: string;
  created_on: string;
  updated_on: string;
}
