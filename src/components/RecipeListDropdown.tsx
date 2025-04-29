import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import Select from "react-select";
import { fetchFromBackend } from "./fetchFromBackend";
import { useAuth } from "./AuthContext";
import { Recipe, Ingredient } from "../types/Recipe";

// Configuration for 'recipe' type
const recipeConfig = {
  type: "recipe",
  apiEndpoint: "/api/recipes/recipes/?limit=1000",
  postEndpoint: "/api/groceries/planned-recipes/",
  selectPlaceholder: "Select a Recipe",
  quantityLabel: "Guests",
  payloadIdKey: "recipe_id",
  payloadQuantityKey: "guests",
  getOptionLabel: (recipe: Recipe) => recipe.title,
  needsDateField: true,
  formattedName: "Recipe",
};

// Configuration for 'extra' type (Ingredient)
const extraConfig = {
  type: "extra",
  apiEndpoint: "/api/ingredients/ingredients/?limit=1000",
  postEndpoint: "/api/groceries/planned-extras/",
  selectPlaceholder: "Select an Extra Ingredient",
  quantityLabel: "Quantity",
  payloadIdKey: "ingredient_id",
  payloadQuantityKey: "quantity",
  getOptionLabel: (ingredient: Ingredient) => ingredient.name,
  needsDateField: false,
  formattedName: "Extra",
};

// Map types to their configurations
const configs = {
  recipe: recipeConfig,
  extra: extraConfig,
} as const;

interface PlannerDropdownProps {
  onPlanned: () => void;
  type: "recipe" | "extra";
}

function PlannerDropdown({ onPlanned, type }: PlannerDropdownProps) {
  // Select the configuration based on the type prop
  const config = configs[type];

  const { csrfToken } = useAuth();
  const { grocerylistid } = useParams<{ grocerylistid?: string }>();

  // Type guarded state variables
  const [items, setItems] = useState<(Recipe | Ingredient)[]>([]);
  const [selectedItem, setSelectedItem] = useState<{ value: number; label: string } | null>(null);
  const [quantity, setQuantity] = useState("");
  const [planDate, setPlanDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch items based on the selected config's endpoint
  useEffect(() => {
    // Ensure grocerylistid is present before doing anything
    if (!grocerylistid) {
      setError("Grocery list ID is missing from URL.");
      return;
    }

    let isMounted = true;
    async function fetchItems() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetchFromBackend(config.apiEndpoint, { credentials: "include" });
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        const data = await res.json();
        const fetchedItems = Array.isArray(data) ? data : data.results || [];

        if (isMounted) {
          setItems(fetchedItems);
        }
      } catch (err) {
        console.error(`Failed to fetch ${config.formattedName}s:`, err);
        if (isMounted) {
          setError(`Could not load ${config.formattedName}s. Please try again.`);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchItems();

    return () => {
      isMounted = false;
    };
  }, [config, grocerylistid]);

  const handleSelectChange = (option: { value: number; label: string } | null) => {
    setSelectedItem(option);
    setQuantity("");
    setPlanDate("");
    setError(null);
  };

  const handlePost = useCallback(async () => {
    if (!selectedItem || !quantity || !grocerylistid) {
      setError(`Please select a ${config.formattedName} and enter a ${config.quantityLabel}.`);
      return;
    }
    if (config.needsDateField && !planDate) {
      setError("Please select a date.");
      return;
    }

    setIsPosting(true);
    setError(null);

    const formData = new FormData();
    formData.append("grocery_list_id", grocerylistid);
    formData.append(config.payloadIdKey, selectedItem.value.toString());
    formData.append(config.payloadQuantityKey, quantity);
    if (config.needsDateField) {
      formData.append("planned_on", planDate);
    }

    try {
      const response = await fetchFromBackend(config.postEndpoint, {
        method: "POST",
        headers: { "X-CSRFToken": csrfToken! },
        body: formData,
        credentials: "include",
      });

      if (response.ok) {
        onPlanned();
        setSelectedItem(null);
        setQuantity("");
        setPlanDate("");
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error("Failed to save the item:", response.status, errorData);
        const message =
          errorData.detail ||
          errorData.non_field_errors?.[0] ||
          `Failed to plan ${config.formattedName}. Status: ${response.status}`;
        setError(message);
      }
    } catch (error) {
      console.error(`Error planning ${config.formattedName}:`, error);
      setError(`A network error occurred while planning the ${config.formattedName}.`);
    } finally {
      setIsPosting(false);
    }
  }, [selectedItem, quantity, planDate, grocerylistid, config, csrfToken, onPlanned]);

  // Generate options for react-select
  const options = items.map((item) => {
    // Type guard to ensure we use the correct option label based on the item type
    if (type === "recipe" && "title" in item) {
      return {
        value: item.id,
        label: recipeConfig.getOptionLabel(item as Recipe),
      };
    } else if (type === "extra" && "name" in item) {
      return {
        value: item.id,
        label: extraConfig.getOptionLabel(item as Ingredient),
      };
    }
    return {
      value: item.id,
      label: String(item.id), // Fallback
    };
  });

  if (!grocerylistid) {
    return <div className="alert alert-warning">Missing Grocery List context.</div>;
  }

  return (
    <div className="my-4 p-3 border rounded shadow-sm bg-light">
      <h3 className="mb-3 h5">{`Plan a ${config.formattedName}`}</h3>
      {error && <div className="alert alert-danger small p-2 mb-2">{error}</div>}
      <div className="mb-2">
        <Select
          options={options}
          value={selectedItem}
          onChange={handleSelectChange}
          placeholder={config.selectPlaceholder}
          isLoading={isLoading}
          isClearable
          inputId={`select-${type}`}
          aria-label={config.selectPlaceholder}
        />
      </div>

      {selectedItem && (
        <div className="d-flex flex-wrap align-items-end gap-2">
          <div className="flex-grow-1">
            <label htmlFor={`${type}-quantity`} className="form-label small mb-1 visually-hidden">
              {config.quantityLabel}
            </label>
            <input
              id={`${type}-quantity`}
              type="number"
              className="form-control form-control-sm"
              placeholder={config.quantityLabel}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              min={type === "recipe" ? "1" : "0.01"}
              step={type === "recipe" ? "1" : "any"}
              required
              aria-label={config.quantityLabel}
            />
          </div>

          {config.needsDateField && (
            <div className="flex-grow-1">
              <label htmlFor={`${type}-date`} className="form-label small mb-1 visually-hidden">
                Planned Date
              </label>
              <input
                id={`${type}-date`}
                type="date"
                className="form-control form-control-sm"
                value={planDate}
                onChange={(e) => setPlanDate(e.target.value)}
                required
                aria-label="Planned Date"
              />
            </div>
          )}

          <button
            onClick={handlePost}
            className="btn btn-primary btn-sm"
            disabled={isPosting || !quantity || (config.needsDateField && !planDate)}
          >
            {isPosting ? "Planning..." : `Plan ${config.formattedName}`}
          </button>
        </div>
      )}
    </div>
  );
}

export default PlannerDropdown;
