import { useState, useEffect } from "react";
import { Recipe, Ingredient, RecipeIngredient } from "../types/Recipe";
import { fetchFromBackend } from "./fetchFromBackend";
import { useCSRF } from "./CSRFContext";

interface RecipeFormProps {
  recipe?: Recipe;
  onSave: (recipe: Recipe) => void;
  onCancel: () => void;
}

export const RecipeForm: React.FC<RecipeFormProps> = ({ recipe, onSave, onCancel }) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>([]);
  const [availableIngredients, setAvailableIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { csrfToken } = useCSRF();

  useEffect(() => {
    const fetchIngredients = async () => {
      try {
        const response = await fetchFromBackend("/api/ingredients/ingredients/", {
          credentials: "include",
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: Ingredient[] = await response.json();
        setAvailableIngredients(data);
      } catch (err) {
        setError("Failed to load ingredients. Please try again.");
        console.error(err);
      }
    };

    fetchIngredients();

    if (recipe) {
      setTitle(recipe.title);
      setContent(recipe.content);
      if (recipe.image && typeof recipe.image === "string") {
        setImagePreview(recipe.image as string);
      }
      if (recipe.recipe_ingredients) {
        const initialIngredients = recipe.recipe_ingredients.map((ri) => ({
          id: ri.id,
          ingredient_id: ri.ingredient?.id ?? ri.ingredient_id,
          quantity: ri.quantity,
          name: ri.ingredient?.name ?? ri.name,
          unit: ri.ingredient?.unit ?? ri.unit,
        }));
        setIngredients(initialIngredients);
      }
    }
  }, [recipe]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setImage(selectedFile);

      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setImage(null);
      if (!recipe?.image) {
        setImagePreview(null);
      } else if (typeof recipe.image === "string") {
        setImagePreview(recipe.image);
      }
    }
  };

  const handleAddIngredient = () => {
    setIngredients([
      ...ingredients,
      {
        ingredient_id: availableIngredients[0]?.id || 0,
        quantity: 1,
      },
    ]);
  };

  const handleRemoveIngredient = (index: number) => {
    const updatedIngredients = [...ingredients];
    updatedIngredients.splice(index, 1);
    setIngredients(updatedIngredients);
  };

  const handleIngredientChange = (
    index: number,
    field: keyof RecipeIngredient,
    value: string | number
  ) => {
    const updatedIngredients = [...ingredients];

    updatedIngredients[index] = {
      ...updatedIngredients[index],
      [field]: value,
      name:
        field === "ingredient_id"
          ? availableIngredients.find((ing) => ing.id === Number(value))?.name
          : updatedIngredients[index].name,
      unit:
        field === "ingredient_id"
          ? availableIngredients.find((ing) => ing.id === Number(value))?.unit
          : updatedIngredients[index].unit,
    };
    setIngredients(updatedIngredients);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const validIngredients = ingredients.filter((ing) => ing.ingredient_id > 0);
    if (validIngredients.length !== ingredients.length) {
      setError("Please select a valid ingredient for all items.");
      setLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("content", content);

      if (image) {
        formData.append("image", image);
      } else if (recipe?.id && !imagePreview) {
        formData.append("remove_image", "true");
      }

      const ingredientsPayload = validIngredients.map(({ ingredient_id, quantity }) => ({
        ingredient_id,
        quantity,
      }));
      formData.append("recipe_ingredients", JSON.stringify(ingredientsPayload));

      const url = recipe?.id ? `/api/recipes/recipes/${recipe.id}/` : "/api/recipes/recipes/";
      const method = recipe?.id ? "PUT" : "POST";

      const response = await fetchFromBackend(url, {
        method,
        body: formData,
        credentials: "include",
        headers: {
          "X-CSRFToken": csrfToken,
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Save Error Data:", errorData);
        throw new Error(`HTTP error! status: ${response.status} - ${JSON.stringify(errorData)}`);
      }

      const savedRecipe: Recipe = await response.json();
      onSave(savedRecipe);
    } catch (err) {
      console.error(err);
      setError(
        `Failed to save recipe. ${err instanceof Error ? err.message : "Please try again."}`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-xl font-bold">{recipe ? "Edit Recipe" : "Create New Recipe"}</h2>

      {error && <div className="p-2 bg-red-100 text-red-700 rounded">{error}</div>}

      <div>
        <label htmlFor="title" className="block font-medium">
          Title
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />
      </div>

      <div>
        <label htmlFor="content" className="block font-medium">
          Content
        </label>
        <textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full p-2 border rounded min-h-[150px]"
          required
        />
      </div>

      <div>
        <label htmlFor="image" className="block font-medium">
          Image
        </label>
        <input
          id="image"
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="w-full p-2 border rounded"
        />
        {imagePreview && (
          <div className="mt-2">
            <img src={imagePreview} alt="Preview" className="max-h-40 object-cover rounded" />
            {recipe?.id && (
              <button
                type="button"
                onClick={() => {
                  setImage(null);
                  setImagePreview(null);
                }}
                className="mt-1 text-xs text-red-600 hover:text-red-800"
              >
                Remove Image
              </button>
            )}
          </div>
        )}
      </div>

      <div>
        <div className="flex justify-between items-center">
          <label className="block font-medium">Ingredients</label>
          <button
            type="button"
            onClick={handleAddIngredient}
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            disabled={availableIngredients.length === 0}
          >
            Add Ingredient
          </button>
        </div>

        {availableIngredients.length === 0 && !error && (
          <p className="text-gray-500 italic mt-2">Loading available ingredients...</p>
        )}
        {ingredients.length === 0 && availableIngredients.length > 0 && (
          <p className="text-gray-500 italic mt-2">No ingredients added yet.</p>
        )}

        <div className="space-y-3 mt-2">
          {ingredients.map((ingredient, index) => {
            const selectedIngredientInfo = availableIngredients.find(
              (ing) => ing.id === ingredient.ingredient_id
            );
            return (
              <div
                key={index}
                className="flex items-center space-x-2 p-2 border rounded bg-gray-50"
              >
                <select
                  value={ingredient.ingredient_id}
                  onChange={(e) =>
                    handleIngredientChange(index, "ingredient_id", parseInt(e.target.value))
                  }
                  className="flex-grow p-2 border rounded"
                  required
                >
                  <option value="0" disabled>
                    Select Ingredient
                  </option>
                  {availableIngredients.map((ing) => (
                    <option key={ing.id} value={ing.id}>
                      {ing.name}
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  value={ingredient.quantity}
                  onChange={(e) =>
                    handleIngredientChange(index, "quantity", parseFloat(e.target.value) || 0)
                  }
                  placeholder="Quantity"
                  className="w-24 p-2 border rounded text-right"
                  min="0.01"
                  step="any"
                  required
                />
                <span
                  className="w-16 text-gray-600 truncate"
                  title={selectedIngredientInfo?.unit || ""}
                >
                  {selectedIngredientInfo?.unit || "unit"}
                </span>

                <button
                  type="button"
                  onClick={() => handleRemoveIngredient(index)}
                  className="p-1 text-red-500 hover:text-red-700"
                  title="Remove Ingredient"
                >
                  &times;
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex justify-end space-x-2 pt-4 border-t mt-6">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border rounded hover:bg-gray-100"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          disabled={loading || !title || !content}
        >
          {loading ? "Saving..." : recipe ? "Update Recipe" : "Create Recipe"}
        </button>
      </div>
    </form>
  );
};
