import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchFromBackend } from "./fetchFromBackend";
import { useAuth } from "./AuthContext";
import { GroceryListItem } from "../types/Groceries";

interface recipeUpdateFlagProps {
  recipeUpdateFlag: boolean;
}

function PlannedIngredientsList({ recipeUpdateFlag }: recipeUpdateFlagProps) {
  const { csrfToken } = useAuth();

  const { grocerylistid } = useParams();
  const [plannedIngredients, setplannedIngredients] = useState<GroceryListItem[]>([]);
  const [isUpdating, setIsUpdating] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    fetchPlannedIngredients(grocerylistid!);
  }, [grocerylistid, recipeUpdateFlag]);

  async function fetchPlannedIngredients(grocerylistid: string) {
    const res = await fetchFromBackend(`/api/groceries/items/?grocery_list=${grocerylistid}`);
    const data = await res.json();
    setplannedIngredients(data);
  }

  const handleCheckboxChange = async (itemId: number) => {
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
      const response = await fetchFromBackend(`/api/groceries/items/${itemId}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrfToken!,
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
          item.id === itemId ? { ...item, is_checked: currentItem.is_checked } : item
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
            {` ${ingredientInfo.quantity} ${ingredientInfo.unit.name} ${ingredientInfo.ingredient.name} `}
            <span className="small-text">{`for ${ingredientInfo.from_recipes}`}</span>
          </li>
        ))}
      </ul>
    </>
  );
}

export default PlannedIngredientsList;
