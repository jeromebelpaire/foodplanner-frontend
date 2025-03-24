import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Select from "react-select";

interface RecipyListDropdownProps {
  onRecipePlanned: () => void;
}

function RecipyListDropdown({ onRecipePlanned }: RecipyListDropdownProps) {
  interface Recipe {
    title?: string;
    id?: number;
    slug?: string;
  }

  interface Option {
    value?: number;
    label?: string;
  }

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
      formData.append("recipes", selectedRecipe.value!.toString());
      formData.append("guests", quantity);

      try {
        const response = await fetch("http://127.0.0.1:8000/recipes/save_planned_recipe/", {
          method: "POST",
          body: formData,
          // If needed, include credentials or headers for CSRF
          // credentials: 'include',
          // headers: {
          //   "X-CSRFToken": getCookie("csrftoken"), // example if you have a getCookie function
          // },
        });
        const data = await response.json();
        if (data.success) {
          console.log("Planned recipe saved!");
          // Optionally, clear your form or provide user feedback here.
          onRecipePlanned();
        } else {
          console.error("Failed to save the planned recipe", data);
        }
      } catch (error) {
        console.error("Error saving planned recipe", error);
      }
    }
  }

  useEffect(() => {
    fetchAllRecipes();
  }, []);

  const { grocerylistid } = useParams();

  async function fetchAllRecipes() {
    const res = await fetch("http://127.0.0.1:8000/recipes/get_recipes/");
    const data = await res.json();
    setrecipes(data.recipes);
  }

  const options = recipes.map((recipe) => ({
    value: recipe.id,
    label: recipe.title,
  }));

  return (
    <div>
      <h3>Select a Recipe</h3>
      <Select
        options={options}
        value={selectedRecipe}
        onChange={handleSelectChange}
        placeholder="Select a Recipe"
      />
      {selectedRecipe && (
        <div style={{ marginTop: "1rem" }}>
          <input
            type="number"
            placeholder="Enter quantity"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
          <button onClick={handlePost}>Plan Recipe</button>
        </div>
      )}
    </div>
  );
}

export default RecipyListDropdown;
