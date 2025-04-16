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
    id: string;
    name: string;
    quantity: number;
    unit: string;
    from_recipes: string;
    is_checked: boolean;
  }

  const { grocerylistid } = useParams();
  const [plannedIngredients, setplannedIngredients] = useState<IngredientInfo[]>([]);
  const [isUpdating, setIsUpdating] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    fetchPlannedIngredients(grocerylistid!);
  }, [grocerylistid, recipeUpdateFlag]);

  async function fetchPlannedIngredients(grocerylistid: string) {
    const res = await fetchFromBackend(`/api/grocerylistitems/?grocery_list=${grocerylistid}`);
    const data = await res.json();
    setplannedIngredients(data);
  }

  const handleCheckboxChange = async (itemId: string) => {
    const currentItem = plannedIngredients.find((item) => item.id === itemId);
    if (!currentItem) return;

    const newValue = !currentItem.is_checked;
    setIsUpdating((prev) => ({ ...prev, [itemId]: true }));

    setplannedIngredients((currentIngredients) =>
      currentIngredients.map((item) =>
        item.id === itemId ? { ...item, is_checked: newValue } : item
      )
    );

    try {
      // Send update to backend
      const response = await fetchFromBackend(`/api/grocerylistitems/${itemId}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrfToken,
        },
        body: JSON.stringify({
          is_checked: newValue,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update item. Status: ${response.status}.}`);
      }
    } catch (error) {
      console.error("Failed to update ingredient status:", error);

      // Revert the optimistic update if request failed
      setplannedIngredients((currentIngredients) =>
        currentIngredients.map((item) =>
          item.id === itemId ? { ...item, is_checked: newValue } : item
        )
      );

      alert("Failed to update item status. Please try again.");
    } finally {
      setIsUpdating((prev) => ({ ...prev, [itemId]: false }));
    }
  };

  return (
    <>
      <h2 className="my-2">Shopping List</h2>
      <ul className="list-group">
        {Object.values(plannedIngredients).map((ingredientInfo) => (
          <li key={ingredientInfo.id} className="list-group-item">
            <input
              type="checkbox"
              checked={ingredientInfo.is_checked || false}
              onChange={() => handleCheckboxChange(ingredientInfo.id)}
              disabled={isUpdating[ingredientInfo.id]}
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
