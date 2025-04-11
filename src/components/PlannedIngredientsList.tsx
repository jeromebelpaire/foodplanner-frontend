import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchFromBackend } from "./fetchFromBackend";

interface recipeUpdateFlagProps {
  recipeUpdateFlag: boolean;
}

function PlannedIngredientsList({ recipeUpdateFlag }: recipeUpdateFlagProps) {
  interface IngredientInfo {
    name: string;
    quantity: number;
    unit: string;
    from_recipes: string;
  }

  interface IngredientCollection {
    [key: string]: IngredientInfo;
  }

  const { grocerylistid } = useParams();

  const [plannedIngredients, setplannedIngredients] = useState<IngredientCollection>({});

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

  return (
    <>
      <h2 className="my-2">Shopping List</h2>
      <ul className="list-group">
        {Object.entries(plannedIngredients).map(([ingredientKey, ingredientInfo]) => (
          <li key={ingredientKey} className="list-group-item">
            <input type="checkbox" />
            {` ${ingredientInfo.quantity} ${ingredientInfo.unit} ${ingredientInfo.name} `}
            <span className="small-text">{`for ${ingredientInfo.from_recipes}`}</span>
          </li>
        ))}
      </ul>
    </>
  );
}

export default PlannedIngredientsList;
