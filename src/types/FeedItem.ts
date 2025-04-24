import { RecipeRating } from "./RecipeRating";
import { Recipe } from "./Recipe";

export enum FeedItemType {
  NEW_RECIPE = "new_recipe",
  NEW_RECIPE_RATING = "new_rating",
  UPDATE_RECIPE = "update_recipe",
  UPDATE_RATING = "update_rating",
}

export interface FeedItem {
  id: number;
  event_type: FeedItemType;
  created_on: string;
  recipe: Recipe;
  rating?: RecipeRating;
}
