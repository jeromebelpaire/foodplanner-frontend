import { Recipe } from "./Recipe";
import { RecipeRating } from "./RecipeRating";

export interface FeedEvent {
  id: number;
  user_username: string;
  event_type: "new_recipe" | "update_recipe" | "new_rating" | "update_rating";
  created_on: string;
  recipe: Pick<
    Recipe,
    | "id"
    | "title"
    | "slug"
    | "author_username"
    | "created_on"
    | "image"
    | "average_rating"
    | "rating_count"
  >;
  rating:
    | (Pick<RecipeRating, "id" | "recipe" | "rating" | "comment" | "created_on" | "updated_on"> & {
        author_username: string;
      })
    | null;
}
