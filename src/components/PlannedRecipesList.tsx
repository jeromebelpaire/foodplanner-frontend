import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

interface PlannedRecipe {
  id?: string;
  str?: string;
  delete_url?: string;
}

interface PlannedRecipesListProps {
  onRecipePlanned: () => void;
  recipeUpdateFlag: boolean;
}

function PlannedRecipesList({ onRecipePlanned, recipeUpdateFlag }: PlannedRecipesListProps) {
  const [plannedRecipes, setplannedRecipes] = useState<PlannedRecipe[]>([]);
  const { grocerylistid } = useParams();

  useEffect(() => {
    fetchPlannedRecipes();
  }, [recipeUpdateFlag]);

  async function fetchPlannedRecipes() {
    const res = await fetch(
      `http://127.0.0.1:8000/recipes/get_planned_recipes/?grocery_list=${grocerylistid}`
    );
    const data = await res.json();
    setplannedRecipes(data);
  }

  async function deletePlannedRecipe(deleteUrl: string) {
    await fetch(deleteUrl, { method: "DELETE" });
    fetchPlannedRecipes(); //Optional: TODO check if necessary
    onRecipePlanned();
    console.log("deleted");
  }

  return (
    <>
      <h2 className="my-5">Planned Recipes</h2>
      <ul className="list-group" id="planned-recipes">
        {Object.values(plannedRecipes).map((recipe) => (
          <li className="list-group-item" key={recipe.id}>
            {" "}
            {recipe.str}{" "}
            <button
              className="btn btn-danger float-right delete-button"
              onClick={() => deletePlannedRecipe(`http://127.0.0.1:8000/${recipe.delete_url}`)}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}

export default PlannedRecipesList;
