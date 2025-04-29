import { useState, useEffect, useCallback } from "react";
import { Recipe, Ingredient } from "../types/Recipe";
import { fetchFromBackend } from "./fetchFromBackend";
import { useAuth } from "./AuthContext";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import AsyncSelect from "react-select/async";

interface IngredientOption {
  value: number;
  label: string;
}

interface FormIngredientState {
  recipeIngredientId?: number;
  ingredientId: number | null;
  name?: string;
  unit: string;
  quantity: number;
}

interface RecipeFormProps {
  recipe?: Recipe;
  onSave: (recipe: Recipe) => void;
  onCancel: () => void;
}

const AVAILABLE_UNITS = ["g", "kg", "ml", "l", "tsp", "tbsp", "piece", "cup"];
const DEFAULT_UNIT = AVAILABLE_UNITS[0];

export const RecipeForm: React.FC<RecipeFormProps> = ({ recipe, onSave, onCancel }) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [ingredients, setIngredients] = useState<FormIngredientState[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { csrfToken } = useAuth();

  const editor = useEditor({
    extensions: [StarterKit],
    editorProps: {
      attributes: {
        class: "p-3",
      },
    },
    content: content,
    onUpdate: ({ editor }) => {
      setContent(editor.getHTML());
    },
  });

  useEffect(() => {
    if (!recipe) return;
    setTitle(recipe.title);
    setContent(recipe.content || "");
    if (recipe.image && typeof recipe.image === "string") {
      setImagePreview(recipe.image);
    }
    if (recipe.recipe_ingredients) {
      setIngredients(
        recipe.recipe_ingredients.map((ri) => ({
          recipeIngredientId: ri.id,
          ingredientId: ri.ingredient?.id ?? ri.ingredient_id,
          quantity: ri.quantity,
          name: ri.ingredient?.name ?? ri.name,
          unit: ri.unit || DEFAULT_UNIT,
        }))
      );
    }
  }, [recipe]);

  useEffect(() => {
    if (editor && recipe?.content) {
      editor.commands.setContent(recipe.content);
    }
  }, [editor, recipe?.content]);

  const loadIngredientOptions = useCallback(
    async (inputValue: string, callback: (options: IngredientOption[]) => void) => {
      if (!inputValue || inputValue.length < 2) {
        callback([]);
        return;
      }
      try {
        const response = await fetchFromBackend(
          `/api/ingredients/ingredients/?search=${encodeURIComponent(inputValue)}&limit=20`,
          { credentials: "include" }
        );
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        const options: IngredientOption[] = data.results.map((ing: Ingredient) => ({
          value: ing.id,
          label: ing.name,
        }));
        callback(options);
      } catch (err) {
        console.error("Failed to load ingredient options:", err);
        callback([]);
      }
    },
    []
  );

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
        ingredientId: null,
        quantity: 1,
        unit: DEFAULT_UNIT,
        name: "",
      },
    ]);
  };

  const handleRemoveIngredient = (index: number) => {
    const updatedIngredients = [...ingredients];
    updatedIngredients.splice(index, 1);
    setIngredients(updatedIngredients);
  };

  const handleIngredientSelectionChange = (
    index: number,
    selectedOption: IngredientOption | null
  ) => {
    const updatedIngredients = [...ingredients];
    if (selectedOption) {
      updatedIngredients[index] = {
        ...updatedIngredients[index],
        ingredientId: selectedOption.value,
        name: selectedOption.label,
      };
    } else {
      updatedIngredients[index] = {
        ...updatedIngredients[index],
        ingredientId: null,
        name: "",
      };
    }
    setIngredients(updatedIngredients);
  };

  const handleQuantityChange = (index: number, value: string) => {
    const updatedIngredients = [...ingredients];
    updatedIngredients[index] = {
      ...updatedIngredients[index],
      quantity: parseFloat(value) || 0,
    };
    setIngredients(updatedIngredients);
  };

  const handleUnitChange = (index: number, value: string) => {
    const updatedIngredients = [...ingredients];
    updatedIngredients[index] = {
      ...updatedIngredients[index],
      unit: value,
    };
    setIngredients(updatedIngredients);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const validIngredients = ingredients.filter(
      (ing) => ing.ingredientId !== null && ing.ingredientId > 0 && ing.quantity > 0 && ing.unit
    );

    if (validIngredients.length !== ingredients.length) {
      if (ingredients.length > 0) {
        setError(
          "Please select a valid ingredient, quantity > 0, and unit for all items, or remove unused rows."
        );
        setLoading(false);
        return;
      }
    }

    const incompleteIngredients = ingredients.some((ing) => ing.ingredientId === null || !ing.unit);
    if (incompleteIngredients) {
      setError("Please select an ingredient and unit for all added rows or remove unused rows.");
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

      const ingredientsPayload = validIngredients.map(({ ingredientId, quantity, unit }) => ({
        ingredient_id: ingredientId,
        quantity,
        unit,
      }));

      if (ingredientsPayload.length > 0) {
        formData.append("recipe_ingredients", JSON.stringify(ingredientsPayload));
      } else if (recipe?.id) {
        formData.append("recipe_ingredients", JSON.stringify([]));
      }

      const url = recipe?.id ? `/api/recipes/recipes/${recipe.id}/` : "/api/recipes/recipes/";
      const method = recipe?.id ? "PUT" : "POST";

      const response = await fetchFromBackend(url, {
        method,
        body: formData,
        credentials: "include",
        headers: {
          "X-CSRFToken": csrfToken!,
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Unknown error" }));
        console.error("Save Error Data:", errorData);
        const message = errorData.detail || errorData.message || JSON.stringify(errorData);
        throw new Error(`HTTP error! status: ${response.status} - ${message}`);
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

  const MenuBar = () => {
    if (!editor) {
      return null;
    }

    return (
      <div className="btn-toolbar mb-2" role="toolbar" aria-label="Text formatting">
        <div className="btn-group me-2" role="group" aria-label="Basic formatting">
          <button
            type="button"
            onMouseDown={(event) => {
              event.preventDefault();
              editor.chain().focus().toggleBold().run();
            }}
            disabled={!editor.can().chain().focus().toggleBold().run()}
            className={`btn btn-sm ${
              editor.isActive("bold") ? "btn-primary" : "btn-outline-primary"
            }`}
            title="Bold (Ctrl+B)"
          >
            Bold
          </button>
          <button
            type="button"
            onMouseDown={(event) => {
              event.preventDefault();
              editor.chain().focus().toggleItalic().run();
            }}
            disabled={!editor.can().chain().focus().toggleItalic().run()}
            className={`btn btn-sm ${
              editor.isActive("italic") ? "btn-primary" : "btn-outline-primary"
            }`}
            title="Italic (Ctrl+I)"
          >
            Italic
          </button>
        </div>
        <div className="btn-group me-2" role="group" aria-label="Headings">
          <button
            type="button"
            onMouseDown={(event) => {
              event.preventDefault();
              editor.chain().focus().toggleHeading({ level: 1 }).run();
            }}
            className={`btn btn-sm ${
              editor.isActive("heading", { level: 1 }) ? "btn-primary" : "btn-outline-primary"
            }`}
          >
            H1
          </button>
          <button
            type="button"
            onMouseDown={(event) => {
              event.preventDefault();
              editor.chain().focus().toggleHeading({ level: 2 }).run();
            }}
            className={`btn btn-sm ${
              editor.isActive("heading", { level: 2 }) ? "btn-primary" : "btn-outline-primary"
            }`}
          >
            H2
          </button>
        </div>
        <div className="btn-group me-2" role="group" aria-label="Lists">
          <button
            type="button"
            onMouseDown={(event) => {
              event.preventDefault();
              editor.chain().focus().toggleBulletList().run();
            }}
            className={`btn btn-sm ${
              editor.isActive("bulletList") ? "btn-primary" : "btn-outline-primary"
            }`}
            title="Bullet List"
          >
            Bullet List
          </button>
          <button
            type="button"
            onMouseDown={(event) => {
              event.preventDefault();
              editor.chain().focus().toggleOrderedList().run();
            }}
            className={`btn btn-sm ${
              editor.isActive("orderedList") ? "btn-primary" : "btn-outline-primary"
            }`}
            title="Numbered List"
          >
            Numbered List
          </button>
        </div>
        <div className="btn-group me-2" role="group" aria-label="Other">
          <button
            type="button"
            onMouseDown={(event) => {
              event.preventDefault();
              editor.chain().focus().setHorizontalRule().run();
            }}
            className="btn btn-sm btn-outline-primary"
            title="Horizontal Rule"
          >
            Horizontal Rule
          </button>
        </div>
      </div>
    );
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
          Instructions
        </label>
        <div className="border rounded">
          <MenuBar />
          <div className="p-2">
            <EditorContent
              editor={editor}
              className="form-control p-0 border-0"
              style={{ minHeight: "150px" }}
            />
          </div>
        </div>
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
          <div className="mt-2 position-relative d-inline-block">
            <img
              src={imagePreview}
              alt="Preview"
              className="img-thumbnail"
              style={{ maxHeight: "160px", objectFit: "cover" }}
            />
            <button
              type="button"
              onClick={() => {
                setImage(null);
                setImagePreview(null);
              }}
              className="btn btn-sm btn-danger position-absolute top-0 end-0 m-1"
              aria-label="Remove image"
              title="Remove image"
              style={{ lineHeight: 1 }}
            >
              &times;
            </button>
          </div>
        )}
      </div>

      <div className="mb-3">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <label className="form-label fw-medium mb-0">Ingredients</label>
          <button type="button" onClick={handleAddIngredient} className="btn btn-primary btn-sm">
            Add Ingredient
          </button>
        </div>

        {ingredients.length === 0 && (
          <p className="text-muted fst-italic">No ingredients added yet.</p>
        )}

        <div className="mb-3">
          {ingredients.map((ingredient, index) => {
            const currentSelectValue = ingredient.ingredientId
              ? { value: ingredient.ingredientId, label: ingredient.name || "Loading..." }
              : null;

            return (
              <div
                key={index}
                className="d-flex align-items-center gap-2 mb-2 p-2 border rounded bg-light"
              >
                <div style={{ flexGrow: 1 }}>
                  <AsyncSelect<IngredientOption>
                    cacheOptions
                    defaultOptions
                    loadOptions={loadIngredientOptions}
                    value={currentSelectValue}
                    onChange={(selectedOption) =>
                      handleIngredientSelectionChange(index, selectedOption)
                    }
                    placeholder="Search ingredient..."
                    isClearable
                    required
                  />
                </div>

                <input
                  type="number"
                  value={ingredient.quantity}
                  onChange={(e) => handleQuantityChange(index, e.target.value)}
                  placeholder="Qty"
                  className="form-control text-end"
                  style={{ width: "80px" }}
                  min="0.01"
                  step="any"
                  required
                  aria-label={`Quantity for ${ingredient.name || `ingredient ${index + 1}`}`}
                />

                <select
                  value={ingredient.unit}
                  onChange={(e) => handleUnitChange(index, e.target.value)}
                  className="form-select"
                  style={{ width: "90px" }}
                  required
                  aria-label={`Unit for ${ingredient.name || `ingredient ${index + 1}`}`}
                >
                  {AVAILABLE_UNITS.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => handleRemoveIngredient(index)}
                  className="btn btn-link text-danger p-1 flex-shrink-0"
                  title="Remove Ingredient"
                  aria-label={`Remove ${ingredient.name || `ingredient ${index + 1}`}`}
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
        <button
          type="submit"
          className="btn btn-success"
          disabled={
            loading ||
            !title ||
            !content ||
            ingredients.some((ing) => ing.ingredientId === null || !ing.unit)
          }
        >
          {loading ? "Saving..." : recipe ? "Update Recipe" : "Create Recipe"}
        </button>
      </div>
    </form>
  );
};
