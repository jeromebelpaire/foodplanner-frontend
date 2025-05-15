import { useState, useEffect, useCallback } from "react";
import { Recipe, Ingredient } from "../types/Recipe";
import { fetchFromBackend } from "./fetchFromBackend";
import { useAuth } from "./AuthContext";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import AsyncSelect from "react-select/async";

const DEFAULT_SERVINGS = 4;

interface IngredientOption {
  value: number;
  label: string;
}

interface FormIngredientState {
  recipeIngredientId?: number;
  ingredientId: number | null;
  ingredientName?: string;
  unitId: number | null;
  quantity: number;
}

interface RecipeFormProps {
  recipe?: Recipe;
  onSave: (recipe: Recipe) => void;
  onCancel: () => void;
}

interface ApiUnit {
  id: number;
  name: string;
}

export function RecipeForm({ recipe, onSave, onCancel }: RecipeFormProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [ingredients, setIngredients] = useState<FormIngredientState[]>([]);
  const [availableUnits, setAvailableUnits] = useState<ApiUnit[]>([]);
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
    const fetchUnits = async () => {
      try {
        const response = await fetchFromBackend("/api/ingredients/units/", {
          credentials: "include",
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: ApiUnit[] = await response.json();
        data.sort((a, b) => a.name.localeCompare(b.name));
        setAvailableUnits(data);
      } catch (err) {
        console.error("Failed to fetch units:", err);
        setError("Could not load ingredient units. Please try reloading.");
      }
    };
    fetchUnits();
  }, []);

  useEffect(() => {
    if (!recipe) return;
    setTitle(recipe.title);
    setContent(recipe.content || "");
    if (recipe.image && typeof recipe.image === "string") {
      setImagePreview(recipe.image);
    } else {
      setImagePreview(null);
      setImage(null);
    }
    if (recipe.recipe_ingredients) {
      setIngredients(
        recipe.recipe_ingredients.map((ri) => ({
          recipeIngredientId: ri.id,
          ingredientId: ri.ingredient?.id ?? null,
          ingredientName: ri.ingredient?.name,
          quantity: ri.quantity * DEFAULT_SERVINGS,
          unitId: ri.unit?.id ?? null,
        }))
      );
    } else {
      setIngredients([]);
    }
  }, [recipe]);

  useEffect(() => {
    if (editor && recipe?.content && editor.getHTML() !== recipe.content) {
      editor.commands.setContent(recipe.content);
    }
  }, [editor, recipe?.content]);

  const loadIngredientOptions = useCallback(
    (inputValue: string, callback: (options: IngredientOption[]) => void): void => {
      if (!inputValue || inputValue.length < 2) {
        callback([]);
        return;
      }

      fetchFromBackend(
        `/api/ingredients/ingredients/?search=${encodeURIComponent(inputValue)}&limit=25`,
        { credentials: "include" }
      )
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        })
        .then((data) => {
          const options: IngredientOption[] = data.results.map((ing: Ingredient) => ({
            value: ing.id,
            label: ing.name,
          }));
          callback(options);
        })
        .catch((err) => {
          console.error("Failed to load ingredient options:", err);
          callback([]);
        });
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
      if (recipe?.image && typeof recipe.image === "string") {
        setImagePreview(recipe.image);
      } else {
        setImagePreview(null);
      }
    }
  };

  const handleAddIngredient = () => {
    setIngredients([
      ...ingredients,
      {
        ingredientId: null,
        quantity: 1,
        unitId: null,
        ingredientName: "",
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
        ingredientName: selectedOption.label,
      };
    } else {
      updatedIngredients[index] = {
        ...updatedIngredients[index],
        ingredientId: null,
        ingredientName: "",
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
    const unitId = value ? parseInt(value, 10) : null;
    updatedIngredients[index] = {
      ...updatedIngredients[index],
      unitId: unitId,
    };
    setIngredients(updatedIngredients);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const validIngredients = ingredients.filter(
      (ing) => ing.ingredientId !== null && ing.unitId !== null && ing.quantity > 0
    );

    const incompleteIngredients = ingredients.some(
      (ing) =>
        (ing.ingredientId !== null || ing.quantity > 0 || ing.unitId !== null) &&
        (ing.ingredientId === null || ing.unitId === null || !(ing.quantity > 0))
    );

    if (incompleteIngredients) {
      setError(
        "Please select a valid ingredient, quantity > 0, and unit for all items, or remove incomplete rows."
      );
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

      const ingredientsPayload = validIngredients.map(({ ingredientId, quantity, unitId }) => ({
        ingredient_id: ingredientId,
        quantity: quantity / DEFAULT_SERVINGS,
        unit_id: unitId,
      }));

      if (ingredientsPayload.length > 0 || recipe?.id) {
        formData.append("recipe_ingredients", JSON.stringify(ingredientsPayload));
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
        const errorData = await response.json().catch(() => ({ detail: "Unknown save error." }));
        console.error("Save Error Response:", errorData);
        const message =
          errorData.detail ||
          Object.entries(errorData)
            .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(", ") : value}`)
            .join("; ") ||
          "Failed to save recipe.";
        throw new Error(`HTTP error! status: ${response.status} - ${message}`);
      }

      const savedRecipe: Recipe = await response.json();
      onSave(savedRecipe);
    } catch (err) {
      console.error("Submit Error:", err);
      setError(
        `Failed to save recipe. ${
          err instanceof Error ? err.message : "An unknown error occurred."
        }`
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
        <div className="btn-group" role="group" aria-label="Other">
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
    <form onSubmit={handleSubmit} className="mb-4" noValidate>
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
          <div className="editor-wrapper p-2">
            <EditorContent
              id="content"
              editor={editor}
              className="form-control p-0 border-0 tiptap-editor"
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
              alt="Current recipe image"
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
        <p className="text-muted small">Quantities below are for {DEFAULT_SERVINGS} servings.</p>

        {ingredients.length === 0 && (
          <p className="text-muted fst-italic">No ingredients added yet.</p>
        )}

        <div className="vstack gap-2">
          {ingredients.map((ingredient, index) => {
            const ingredientDisplayName = ingredient.ingredientName || `ingredient ${index + 1}`;
            const currentSelectValue = ingredient.ingredientId
              ? { value: ingredient.ingredientId, label: ingredient.ingredientName || "Loading..." }
              : null;

            return (
              <div
                key={index}
                className="d-flex flex-wrap align-items-center gap-2 p-2 border rounded bg-light"
              >
                <div className="flex-grow-1" style={{ minWidth: "200px" }}>
                  <AsyncSelect<IngredientOption>
                    inputId={`ingredient-${index}`}
                    cacheOptions
                    defaultOptions
                    loadOptions={loadIngredientOptions}
                    value={currentSelectValue}
                    onChange={(selectedOption) =>
                      handleIngredientSelectionChange(index, selectedOption)
                    }
                    placeholder="Search ingredient..."
                    isClearable
                    aria-label={`Select ingredient for row ${index + 1}`}
                  />
                </div>

                <input
                  id={`quantity-${index}`}
                  type="number"
                  value={ingredient.quantity}
                  onChange={(e) => handleQuantityChange(index, e.target.value)}
                  placeholder="Qty"
                  className="form-control text-end"
                  style={{ width: "90px" }}
                  min="0.01"
                  step="any"
                  required
                  aria-label={`Quantity for ${ingredientDisplayName}`}
                />

                <select
                  id={`unit-${index}`}
                  value={ingredient.unitId ?? ""}
                  onChange={(e) => handleUnitChange(index, e.target.value)}
                  className={`form-select ${!ingredient.unitId ? "is-invalid" : ""}`}
                  style={{ width: "130px" }}
                  required
                  aria-label={`Unit for ${ingredientDisplayName}`}
                  disabled={availableUnits.length === 0}
                >
                  <option value="" disabled>
                    Choose a unit
                  </option>
                  {availableUnits.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.name}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => handleRemoveIngredient(index)}
                  className="btn btn-link text-danger p-1 flex-shrink-0"
                  title="Remove Ingredient"
                  aria-label={`Remove ${ingredientDisplayName}`}
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
            !editor?.getHTML() ||
            ingredients.some(
              (ing) =>
                (ing.ingredientId !== null || ing.unitId !== null || ing.quantity > 0) &&
                (ing.ingredientId === null || ing.unitId === null || !(ing.quantity > 0))
            )
          }
        >
          {loading ? "Saving..." : recipe ? "Update Recipe" : "Create Recipe"}
        </button>
      </div>
    </form>
  );
}
