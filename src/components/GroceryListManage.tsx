import { useState } from "react";
import CreateNewList from "./CreateNewList";
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
      <CreateNewList />
      <GroceryListDropdown />
      <PlannedIngredientsList recipeUpdateFlag={recipeUpdateFlag} />
      <RecipyListDropdown onRecipePlanned={handleRecipePlanned} type={"recipe"} />
      <PlannedRecipesList
        onRecipePlanned={handleRecipePlanned}
        recipeUpdateFlag={recipeUpdateFlag}
        type={"recipe"}
      />
      <RecipyListDropdown onRecipePlanned={handleRecipePlanned} type={"extra"} />
      <PlannedRecipesList
        onRecipePlanned={handleRecipePlanned}
        recipeUpdateFlag={recipeUpdateFlag}
        type={"extra"}
      />
    </div>
  );
}

export default GroceryListManage;
