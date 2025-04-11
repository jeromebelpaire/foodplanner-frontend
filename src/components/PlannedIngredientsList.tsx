import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchFromBackend } from "./fetchFromBackend";
import { useCSRF } from "./CSRFContext";

interface recipeUpdateFlagProps {
  recipeUpdateFlag: boolean;
}

function PlannedIngredientsList({ recipeUpdateFlag }: recipeUpdateFlagProps) {
  const { csrfToken } = useCSRF();
  interface IngredientInfo {
    name: string;
    quantity: number;
    unit: string;
    from_recipes: string;
    is_checked: boolean;
  }

  interface IngredientCollection {
    [key: string]: IngredientInfo;
  }

  const { grocerylistid } = useParams();
  const [plannedIngredients, setplannedIngredients] = useState<IngredientCollection>({});
  const [isUpdating, setIsUpdating] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    fetchPlannedIngredients(grocerylistid!);
  }, [grocerylistid, recipeUpdateFlag]);

  async function fetchPlannedIngredients(grocerylistid: string) {
    const res = await fetchFromBackend(
      `/recipes/get_planned_ingredients/?grocery_list=${grocerylistid}`
    );
    const data = await res.json();
    setplannedIngredients(data);
  }

  const handleCheckboxChange = async (ingredientKey: string) => {
    setIsUpdating((prev) => ({ ...prev, [ingredientKey]: true }));

    setplannedIngredients((prev) => ({
      ...prev,
      [ingredientKey]: {
        ...prev[ingredientKey],
        is_checked: !prev[ingredientKey].is_checked,
      },
    }));

    try {
      // Send update to backend
      await fetchFromBackend(`/recipes/update_grocerylistitem_state/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrfToken,
        },
        body: JSON.stringify({
          grocery_list_id: grocerylistid,
          ingredient_id: ingredientKey,
          is_checked: !plannedIngredients[ingredientKey].is_checked,
        }),
      });
    } catch (error) {
      console.error("Failed to update ingredient status:", error);

      // Revert the optimistic update if request failed
      setplannedIngredients((prev) => ({
        ...prev,
        [ingredientKey]: {
          ...prev[ingredientKey],
          is_checked: !prev[ingredientKey].is_checked,
        },
      }));

      alert("Failed to update item status. Please try again.");
    } finally {
      setIsUpdating((prev) => ({ ...prev, [ingredientKey]: false }));
    }
  };

  return (
    <>
      <h2 className="my-2">Shopping List</h2>
      <ul className="list-group">
        {Object.entries(plannedIngredients).map(([ingredientKey, ingredientInfo]) => (
          <li key={ingredientKey} className="list-group-item">
            <input
              type="checkbox"
              checked={ingredientInfo.is_checked || false}
              onChange={() => handleCheckboxChange(ingredientKey)}
              disabled={isUpdating[ingredientKey]}
            />
            {` ${ingredientInfo.quantity} ${ingredientInfo.unit} ${ingredientInfo.name} `}
            <span className="small-text">{`for ${ingredientInfo.from_recipes}`}</span>
          </li>
        ))}
      </ul>
    </>
  );
}

export default PlannedIngredientsList;
