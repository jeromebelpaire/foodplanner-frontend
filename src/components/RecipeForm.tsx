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
    <form onSubmit={handleSubmit} className="mb-4">
      <h2 className="h4 fw-bold mb-3">{recipe ? "Edit Recipe" : "Create New Recipe"}</h2>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="mb-3">
        <label htmlFor="title" className="form-label fw-medium">
          Title
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="form-control"
          required
        />
      </div>

      <div className="mb-3">
        <label htmlFor="content" className="form-label fw-medium">
          Content
        </label>
        <textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="form-control"
          style={{ minHeight: "150px" }}
          required
        />
      </div>

      <div className="mb-3">
        <label htmlFor="image" className="form-label fw-medium">
          Image
        </label>
        <input
          id="image"
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="form-control"
        />
        {imagePreview && (
          <div className="mt-2">
            <img
              src={imagePreview}
              alt="Preview"
              className="img-thumbnail"
              style={{ maxHeight: "160px", objectFit: "cover" }}
            />
            {recipe?.id && (
              <button
                type="button"
                onClick={() => {
                  setImage(null);
                  setImagePreview(null);
                }}
                className="btn btn-link btn-sm text-danger p-0 mt-1"
              >
                Remove Image
              </button>
            )}
          </div>
        )}
      </div>

      <div className="mb-3">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <label className="form-label fw-medium mb-0">Ingredients</label>
          <button
            type="button"
            onClick={handleAddIngredient}
            className="btn btn-primary btn-sm"
            disabled={availableIngredients.length === 0}
          >
            Add Ingredient
          </button>
        </div>

        {availableIngredients.length === 0 && !error && (
          <p className="text-muted fst-italic">Loading available ingredients...</p>
        )}
        {ingredients.length === 0 && availableIngredients.length > 0 && (
          <p className="text-muted fst-italic">No ingredients added yet.</p>
        )}

        <div className="mb-3">
          {ingredients.map((ingredient, index) => {
            const selectedIngredientInfo = availableIngredients.find(
              (ing) => ing.id === ingredient.ingredient_id
            );
            return (
              <div
                key={index}
                className="d-flex align-items-center gap-2 mb-2 p-2 border rounded bg-light"
              >
                <select
                  value={ingredient.ingredient_id}
                  onChange={(e) =>
                    handleIngredientChange(index, "ingredient_id", parseInt(e.target.value))
                  }
                  className="form-select"
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
                  className="form-control text-end"
                  style={{ width: "100px" }}
                  min="0.01"
                  step="any"
                  required
                />
                <span
                  className="text-muted text-truncate"
                  style={{ width: "65px" }}
                  title={selectedIngredientInfo?.unit || ""}
                >
                  {selectedIngredientInfo?.unit || "unit"}
                </span>

                <button
                  type="button"
                  onClick={() => handleRemoveIngredient(index)}
                  className="btn btn-link text-danger p-1"
                  title="Remove Ingredient"
                >
                  &times;
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div className="d-flex justify-content-end gap-2 pt-3 border-top mt-4">
        <button
          type="button"
          onClick={onCancel}
          className="btn btn-outline-secondary"
          disabled={loading}
        >
          Cancel
        </button>
        <button type="submit" className="btn btn-success" disabled={loading || !title || !content}>
          {loading ? "Saving..." : recipe ? "Update Recipe" : "Create Recipe"}
        </button>
      </div>
    </form>
  );
};
