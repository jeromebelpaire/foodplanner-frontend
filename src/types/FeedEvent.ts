import { RecipeRating } from "./RecipeRating";
import { Recipe } from "./Recipe";

export enum FeedEventType {
  NEW_RECIPE = "new_recipe",
  NEW_RATING = "new_rating",
  UPDATE_RECIPE = "update_recipe",
  UPDATE_RATING = "update_rating",
  // Add other event types if needed
}

export interface FeedEvent {
  id: number;
  user_username: string;
  event_type: FeedEventType | string;
  created_on: string;
  recipe: Recipe;
  rating?: RecipeRating;

  // Added fields
  like_count: number;
  comment_count: number;
  is_liked_by_user: boolean;
}
