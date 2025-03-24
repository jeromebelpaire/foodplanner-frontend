import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

interface recipeUpdateFlagProps {
  recipeUpdateFlag: boolean;
}

function PlannedIngredientsList({ recipeUpdateFlag }: recipeUpdateFlagProps) {
  interface IngredientInfo {
    quantity: number;
    unit: string;
    from_recipe: string;
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
    const res = await fetch(
      `http://127.0.0.1:8000/recipes/get_planned_ingredients/?grocery_list=${grocerylistid}`
    );
    const data = await res.json();
    setplannedIngredients(data);
  }

  return (
    <>
      {Object.entries(plannedIngredients).map(([ingredientName, ingredientInfo]) => (
        <li key={ingredientName} className="list-group-item">
          <input type="checkbox" />
          {` ${ingredientInfo.quantity} ${ingredientInfo.unit} ${ingredientName} `}
          <span className="small-text">{`for ${ingredientInfo.from_recipe}`}</span>
        </li>
      ))}
    </>
  );
}

export default PlannedIngredientsList;
