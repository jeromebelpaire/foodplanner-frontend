import { Ingredient, Unit } from "./Recipe";

export interface GroceryListItem {
  id: number;
  ingredient: Ingredient;
  unit: Unit;
  quantity: number;
  is_checked: boolean;
  from_recipes: string;
}
