import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Select from "react-select";
import { fetchFromBackend } from "./fetchFromBackend";
import { useAuth } from "./AuthContext";

interface RecipyListDropdownProps {
  onRecipePlanned: () => void;
  type: string;
}

function RecipyListDropdown({ onRecipePlanned, type }: RecipyListDropdownProps) {
  interface Recipe {
    title?: string;
    id?: number;
    name?: string;
    unit?: string;
    //TODO fix this different names for recipes and ingredients
  }

  interface Option {
    value?: number;
    label?: string;
  }

  const { csrfToken } = useAuth();
  const formatted_type = type == "recipe" ? "Recipe" : "Extra";

  const [recipes, setrecipes] = useState<Recipe[]>([]);
  const [selectedRecipe, setselectedRecipe] = useState<Option | null>(null);
  const [quantity, setQuantity] = useState("");
  const [recipeDate, setrecipeDate] = useState("");

  const handleSelectChange = (option: Option | null) => {
    setselectedRecipe(option);
  };

  async function handlePost() {
    if (selectedRecipe && quantity && grocerylistid) {
      const formData = new FormData();
      formData.append("grocery_list_id", grocerylistid);
      formData.append(
        type == "recipe" ? "recipe_id" : "ingredient_id",
        selectedRecipe.value!.toString()
      );
      formData.append(type == "recipe" ? "guests" : "quantity", quantity);
      if (type === "recipe") {
        formData.append("planned_on", recipeDate);
      }

      try {
        const response = await fetchFromBackend(`/api/groceries/planned-${type}s/`, {
          method: "POST",
          headers: { "X-CSRFToken": csrfToken! },
          body: formData,
        });
        if (response.ok) {
          // const data = await response.json();
          // TODO apply optimistic UI pattern
          onRecipePlanned();
        } else {
          const errorData = await response.json();
          console.error(
            "Failed to save the item. Status:",
            response.status,
            "Response:",
            errorData
          );
        }
      } catch (error) {
        console.error("Error saving the item (Network or fetch error):", error);
      }
    }
  }

  useEffect(() => {
    fetchAllRecipes(type);
  }, [type]);

  const { grocerylistid } = useParams();

  async function fetchAllRecipes(type: string) {
    const url_suffix = type == "recipe" ? "recipes/recipes" : "ingredients/ingredients";
    const res = await fetchFromBackend(`/api/${url_suffix}/`);
    const data = await res.json();
    setrecipes(data);
  }

  const options = recipes.map((recipe) => ({
    value: recipe.id,
    label: type === "recipe" ? recipe.title : recipe.name + " (" + recipe.unit + ")",
  }));

  return (
    <div>
      <br />
      <h3 className="my-3">{`Plan a ${formatted_type}`}</h3>
      <Select
        options={options}
        value={selectedRecipe}
        onChange={handleSelectChange}
        placeholder={`Select a ${formatted_type}`}
      />
      {selectedRecipe && (
        <div style={{ marginTop: "1rem" }}>
          <input
            type="number"
            placeholder={type === "recipe" ? "Enter guests" : "Enter quantity"}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
          {type == "recipe" && (
            <input type="date" value={recipeDate} onChange={(e) => setrecipeDate(e.target.value)} />
          )}
          <button onClick={handlePost}>{`Plan ${formatted_type}`}</button>
        </div>
      )}
    </div>
  );
}

export default RecipyListDropdown;
