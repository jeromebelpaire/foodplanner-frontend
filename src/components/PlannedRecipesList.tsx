import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchWithCSRF } from "./fetchWithCSRF";

interface PlannedRecipe {
  id?: string;
  str?: string;
  delete_url?: string;
}

interface PlannedRecipesListProps {
  onRecipePlanned: () => void;
  recipeUpdateFlag: boolean;
  type: string;
}

function PlannedRecipesList({ onRecipePlanned, recipeUpdateFlag, type }: PlannedRecipesListProps) {
  const [plannedRecipes, setplannedRecipes] = useState<PlannedRecipe[]>([]);
  const { grocerylistid } = useParams();

  const formatted_type = type == "recipe" ? "Recipe" : "Extra";

  useEffect(() => {
    fetchPlannedRecipes();
  }, [recipeUpdateFlag]);

  async function fetchPlannedRecipes() {
    const res = await fetchWithCSRF(
      `http://127.0.0.1:8000/recipes/get_planned_${type}s/?grocery_list=${grocerylistid}`,
      {
        method: "POST",
      }
    );
    const data = await res.json();
    setplannedRecipes(data);
  }

  async function deletePlannedRecipe(deleteUrl: string) {
    await fetchWithCSRF(deleteUrl, { method: "DELETE" });
    fetchPlannedRecipes(); //Optional: TODO check if necessary
    onRecipePlanned();
  }

  return (
    <>
      <h4 className="my-4">{`Planned ${formatted_type}s:`}</h4>
      <ul className="list-group" id={`${type}s`}>
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
