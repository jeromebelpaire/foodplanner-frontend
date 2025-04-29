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
  recipe?: Recipe;
  guests: number;
  planned_on?: string;
}

// Interface for planned extras
export interface PlannedExtraItem extends PlannedItemBase {
  ingredient?: Ingredient;
  quantity: number;
  unit?: Unit;
}

// Union type to represent either a planned recipe or extra
export type PlannedRecipe = PlannedRecipeItem | PlannedExtraItem;
