import { useState } from "react";
import GroceryListDropdown from "./GroceryListDropdown";
import PlannedIngredientsList from "./PlannedIngredientsList";
import RecipyListDropdown from "./RecipeListDropdown";
import PlannedRecipesList from "./PlannedRecipesList";

function GroceryListManage() {
  const [recipeUpdateFlag, setRecipeUpdateFlag] = useState(false);

  const handleRecipePlanned = () => {
    setRecipeUpdateFlag((prev) => !prev);
  };
  return (
    <div className="container py-5">
      <GroceryListDropdown />
      <PlannedIngredientsList recipeUpdateFlag={recipeUpdateFlag} />
      <RecipyListDropdown onPlanned={handleRecipePlanned} type={"recipe"} />
      <PlannedRecipesList
        onRecipePlanned={handleRecipePlanned}
        recipeUpdateFlag={recipeUpdateFlag}
        type={"recipe"}
      />
      <RecipyListDropdown onPlanned={handleRecipePlanned} type={"extra"} />
      <PlannedRecipesList
        onRecipePlanned={handleRecipePlanned}
        recipeUpdateFlag={recipeUpdateFlag}
        type={"extra"}
      />
    </div>
  );
}

export default GroceryListManage;
