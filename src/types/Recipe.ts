export interface Ingredient {
  id: number;
  name: string;
  unit: string;
}

export interface RecipeIngredient {
  id?: number;
  ingredient_id: number;
  ingredient?: Ingredient;
  name?: string;
  quantity: number;
  unit?: string;
}

export interface Recipe {
  id?: number;
  title: string;
  slug?: string;
  author_username?: string;
  content: string;
  created_on?: string;
  updated_on?: string;
  image?: File | string | null;
  average_rating?: number;
  rating_count?: number;
  recipe_ingredients?: RecipeIngredient[];
}
