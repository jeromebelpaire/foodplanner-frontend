import { Ingredient, Recipe, Unit } from "./Recipe";

export interface GroceryListItem {
  id: number;
  ingredient: Ingredient;
  unit: Unit;
  quantity: number;
  is_checked: boolean;
  from_recipes: string;
}

interface PlannedItemBase {
  id: string;
  grocery_list_name: string;
  delete_url?: string;
}

export interface PlannedRecipeItem extends PlannedItemBase {
  type: "recipe";
  recipe: Recipe;
  guests: number;
  planned_on?: string;
}

export interface PlannedExtraItem extends PlannedItemBase {
  type: "extra";
  ingredient: Ingredient;
  quantity: number;
  unit: Unit;
}

export type PlannedItem = PlannedRecipeItem | PlannedExtraItem;
