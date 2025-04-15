import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchFromBackend } from "./fetchFromBackend";
import { useCSRF } from "./CSRFContext";

interface PlannedRecipe {
  id?: string;
  recipe_title?: string;
  guests?: number;
  planned_on?: string;
  ingredient_name?: string;
  ingredient_unit?: string;
  quantity?: number;
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
    const res = await fetchFromBackend(`/api/planned${type}s/?grocery_list=${grocerylistid}`);
    const data = await res.json();
    const dataWithDeleteUrl = data.map((item: PlannedRecipe) => ({
      ...item,
      delete_url: `api/planned${type}s/${item.id}/`,
    }));
    setplannedRecipes(dataWithDeleteUrl);
  }

  async function deletePlannedRecipe(deleteUrl: string) {
    await fetchFromBackend(`/${deleteUrl}`, {
      method: "DELETE",
      headers: { "X-CSRFToken": csrfToken },
    });
    fetchPlannedRecipes(type, grocerylistid!);
    onRecipePlanned();
  }

  function formatDate(dateString: string | undefined): string {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "long" });
  }

  return (
    <>
      <h4 className="my-4">{`Planned ${formatted_type}s:`}</h4>
      <ul className="list-group" id={`${type}s`}>
        {plannedRecipes.map((item) => (
          <li
            className="list-group-item d-flex justify-content-between align-items-center"
            key={item.id}
          >
            {type === "recipe" ? (
              <span>
                {formatDate(item.planned_on)} - {item.recipe_title} - {item.guests} guest
                {item.guests !== 1 ? "s" : ""}
              </span>
            ) : (
              <span>
                {item.ingredient_name} - {item.quantity} {item.ingredient_unit}
              </span>
            )}
            <button
              className="btn btn-danger btn-sm delete-button"
              onClick={() => deletePlannedRecipe(item.delete_url!)}
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
