import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchFromBackend } from "./fetchFromBackend";
import { useCSRF } from "./CSRFContext";

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
  const { csrfToken } = useCSRF();
  const [plannedRecipes, setplannedRecipes] = useState<PlannedRecipe[]>([]);
  const { grocerylistid } = useParams();

  const formatted_type = type == "recipe" ? "Recipe" : "Extra";

  useEffect(() => {
    fetchPlannedRecipes(type, grocerylistid!);
  }, [type, grocerylistid, recipeUpdateFlag]);

  async function fetchPlannedRecipes(type: string, grocerylistid: string) {
    const res = await fetchFromBackend(
      `/recipes/get_planned_${type}s/?grocery_list=${grocerylistid}`,
      {
        headers: { "X-CSRFToken": csrfToken },
        method: "POST",
      }
    );
    const data = await res.json();
    setplannedRecipes(data);
  }

  async function deletePlannedRecipe(deleteUrl: string) {
    await fetchFromBackend(deleteUrl, { method: "DELETE" });
    fetchPlannedRecipes(type, grocerylistid!);
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
              onClick={() => deletePlannedRecipe(`/${recipe.delete_url}`)}
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
