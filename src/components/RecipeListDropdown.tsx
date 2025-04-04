import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Select from "react-select";
import { fetchWithCSRF } from "./fetchWithCSRF";

interface RecipyListDropdownProps {
  onRecipePlanned: () => void;
  type: string;
}

function RecipyListDropdown({ onRecipePlanned, type }: RecipyListDropdownProps) {
  interface Recipe {
    title?: string;
    id?: number;
  }

  interface Option {
    value?: number;
    label?: string;
  }

  const formatted_type = type == "recipe" ? "Recipe" : "Extra";

  const [recipes, setrecipes] = useState<Recipe[]>([]);
  const [selectedRecipe, setselectedRecipe] = useState<Option | null>(null);
  const [quantity, setQuantity] = useState("");

  const handleSelectChange = (option: Option | null) => {
    setselectedRecipe(option);
  };

  async function handlePost() {
    if (selectedRecipe && quantity && grocerylistid) {
      const formData = new FormData();
      formData.append("grocery_list", grocerylistid);
      formData.append(`${type}s`, selectedRecipe.value!.toString());
      formData.append(type == "recipe" ? "guests" : "quantity", quantity);

      try {
        const response = await fetchWithCSRF(`/recipes/save_planned_${type}/`, {
          method: "POST",
          body: formData,
        });
        const data = await response.json();
        if (data.success) {
          // Optionally, clear your form or provide user feedback here.
          onRecipePlanned();
        } else {
          console.error("Failed to save the item", data);
        }
      } catch (error) {
        console.error("Error saving the item", error);
      }
    }
  }

  useEffect(() => {
    fetchAllRecipes();
  }, []);

  const { grocerylistid } = useParams();

  async function fetchAllRecipes() {
    const url_suffix = type == "recipe" ? "recipe" : "ingredient";
    const res = await fetchWithCSRF(`/recipes/get_${url_suffix}s/`);
    const data = await res.json();
    setrecipes(data[`${url_suffix}s`]);
  }

  const options = recipes.map((recipe) => ({
    value: recipe.id,
    label: recipe.title,
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
            placeholder="Enter quantity"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
          <button onClick={handlePost}>{`Plan ${formatted_type}`}</button>
        </div>
      )}
    </div>
  );
}

export default RecipyListDropdown;
