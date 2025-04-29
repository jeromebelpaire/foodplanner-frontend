import { Ingredient, Recipe, Unit } from "./Recipe";

export interface GroceryListItem {
  id: number;
  ingredient: Ingredient;
  unit: Unit;
  quantity: number;
  is_checked: boolean;
  from_recipes: string;
}

// Base interface for planned items
interface PlannedItemBase {
  id: string;
  grocery_list_name: string;
  delete_url?: string;
}

// Interface for planned recipes
export interface PlannedRecipeItem extends PlannedItemBase {
  /** Discriminator for planned recipe items */
  type: "recipe";
  recipe: Recipe;
  guests: number;
  planned_on?: string;
}

// Interface for planned extras
export interface PlannedExtraItem extends PlannedItemBase {
  /** Discriminator for planned extra items */
  type: "extra";
  ingredient: Ingredient;
  quantity: number;
  unit: Unit;
}

// Union type to represent either a planned recipe or extra
export type PlannedItem = PlannedRecipeItem | PlannedExtraItem;
