import { useState } from "react";
import GroceryListDropdown from "./GroceryListDropdown";
import PlannedIngredientsList from "./PlannedIngredientsList";
import RecipyListDropdown from "./RecipeListDropdown";

function GroceryListManage() {
  const [recipeUpdateFlag, setRecipeUpdateFlag] = useState(false);

  const handleRecipePlanned = () => {
    setRecipeUpdateFlag((prev) => !prev);
  };
  return (
    <div className="container py-5">
      <form id="create-grocerylist-select-form" method="post">
        {/* {% csrf_token %} */}
        <label htmlFor="name">Name:</label>
        <br />
        <input type="text" id="name" name="name" required />
        <br />
        <input type="submit" className="btn btn-primary my-1" value="Create New List" />
      </form>
      <GroceryListDropdown />
      <p>Please select and submit a grocery list first</p>
      <RecipyListDropdown onRecipePlanned={handleRecipePlanned} />
      {/* {% include 'recipes/recipe_form.html' %} */}
      <h2 className="my-5">Planned Recipes</h2>
      <ul className="list-group" id="planned-recipes"></ul>
      <h2 className="my-5">Ingredients</h2>
      {/* <ul id="ingredients" className="list-group"></ul> */}
      <PlannedIngredientsList recipeUpdateFlag={recipeUpdateFlag} />
      <h2 className="my-5">Extras</h2>
      <form id="extras-select-form" method="post">
        <p>Please select and submit a grocery list first</p>
        {/* {% include 'recipes/extras_form.html' %} */}
      </form>
      <ul className="list-group" id="planned-extras"></ul>
    </div>
  );
}

export default GroceryListManage;
