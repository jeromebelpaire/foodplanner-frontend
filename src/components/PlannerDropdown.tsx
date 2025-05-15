import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { fetchFromBackend } from "./fetchFromBackend";
import { useAuth } from "./AuthContext";
import { Recipe, Ingredient, Unit } from "../types/Recipe";
import AsyncSelect from "react-select/async";

interface SelectOption {
  value: number;
  label: string;
}

const recipeConfig = {
  type: "recipe" as const,
  apiEndpoint: "/api/recipes/recipes/",
  postEndpoint: "/api/groceries/planned-recipes/",
  selectPlaceholder: "Select a Recipe",
  quantityLabel: "Guests",
  payloadIdKey: "recipe_id",
  payloadQuantityKey: "guests",
  getOptionLabel: (recipe: Recipe) => recipe.title,
  needsDateField: true,
  formattedName: "Recipe",
  needsUnitField: false,
};

const extraConfig = {
  type: "extra" as const,
  apiEndpoint: "/api/ingredients/ingredients/",
  postEndpoint: "/api/groceries/planned-extras/",
  selectPlaceholder: "Select an Extra Ingredient",
  quantityLabel: "Quantity",
  payloadIdKey: "ingredient_id",
  payloadQuantityKey: "quantity",
  getOptionLabel: (ingredient: Ingredient) => ingredient.name,
  needsDateField: false,
  formattedName: "Extra",
  needsUnitField: true,
};

const configs = {
  recipe: recipeConfig,
  extra: extraConfig,
} as const;

interface PlannerDropdownProps {
  onPlanned: () => void;
  type: "recipe" | "extra";
}

export function PlannerDropdown({ onPlanned, type }: PlannerDropdownProps) {
  const config = configs[type];

  const { csrfToken } = useAuth();
  const { grocerylistid } = useParams<{ grocerylistid?: string }>();

  const [selectedItem, setSelectedItem] = useState<SelectOption | null>(null);
  const [quantity, setQuantity] = useState("");
  const [planDate, setPlanDate] = useState("");
  const [selectedUnitId, setSelectedUnitId] = useState<string>("");
  const [availableUnits, setAvailableUnits] = useState<Unit[]>([]);
  const [isPosting, setIsPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!grocerylistid) {
      setError("Grocery list ID is missing from URL.");
      return;
    }
    let isMounted = true;

    if (config.needsUnitField) {
      async function fetchUnits() {
        setError(null);
        try {
          const unitsRes = await fetchFromBackend("/api/ingredients/units/", {
            credentials: "include",
          });
          if (!unitsRes.ok) {
            throw new Error(`HTTP error fetching units! status: ${unitsRes.status}`);
          }
          const unitsData: Unit[] = await unitsRes.json();
          if (isMounted) {
            unitsData.sort((a, b) => a.name.localeCompare(b.name));
            setAvailableUnits(unitsData);
          }
        } catch (err) {
          console.error(`Failed to fetch units:`, err);
          if (isMounted) {
            setError(
              err instanceof Error ? err.message : `Could not load Units. Please try again.`
            );
          }
        }
      }
      fetchUnits();
    } else {
      setAvailableUnits([]);
      if (error?.includes("Units")) setError(null);
    }

    return () => {
      isMounted = false;
    };
  }, [grocerylistid, config.needsUnitField, error]);

  const handleSelectChange = (option: SelectOption | null) => {
    setSelectedItem(option);
    setQuantity("");
    setPlanDate("");
    setSelectedUnitId("");
    setError(null);
  };

  const handlePost = useCallback(async () => {
    if (!selectedItem || !quantity || !grocerylistid) {
      setError(`Please select a ${config.formattedName} and enter a ${config.quantityLabel}.`);
      return;
    }
    if (config.needsUnitField && !selectedUnitId) {
      setError("Please select a unit.");
      return;
    }

    setIsPosting(true);
    setError(null);

    const formData = new FormData();
    formData.append("grocery_list_id", grocerylistid);
    formData.append(config.payloadIdKey, selectedItem.value.toString());
    formData.append(config.payloadQuantityKey, quantity);
    if (planDate) {
      formData.append("planned_on", planDate);
    }
    if (config.needsUnitField) {
      formData.append("unit_id", selectedUnitId);
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
        setSelectedUnitId("");
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error("Failed to save the item:", response.status, errorData);
        const message =
          errorData.detail ||
          errorData.non_field_errors?.[0] ||
          (errorData.unit_id && `Unit: ${errorData.unit_id[0]}`) ||
          `Failed to plan ${config.formattedName}. Status: ${response.status}`;
        setError(message);
      }
    } catch (error) {
      console.error(`Error planning ${config.formattedName}:`, error);
      setError(`A network error occurred while planning the ${config.formattedName}.`);
    } finally {
      setIsPosting(false);
    }
  }, [
    selectedItem,
    quantity,
    planDate,
    selectedUnitId,
    grocerylistid,
    config,
    csrfToken,
    onPlanned,
  ]);

  const loadOptions = useCallback(
    (inputValue: string, callback: (options: SelectOption[]) => void): void => {
      if (!inputValue || inputValue.length < 2) {
        callback([]);
        return;
      }

      const searchUrl = `${config.apiEndpoint}?search=${encodeURIComponent(inputValue)}&limit=20`;

      fetchFromBackend(searchUrl, { credentials: "include" })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        })
        .then((data) => {
          const results = Array.isArray(data) ? data : data.results || [];
          const formattedOptions: SelectOption[] = results.map(
            (item: Recipe | Ingredient): SelectOption => {
              let label: string;
              if (config.type === "recipe" && "title" in item) {
                label = config.getOptionLabel(item as Recipe);
              } else if (config.type === "extra" && "name" in item) {
                label = config.getOptionLabel(item as Ingredient);
              } else {
                console.warn("Unexpected item type encountered in loadOptions:", item);
                label = `Item ID: ${item.id}`;
              }
              return {
                value: item.id,
                label: label,
              };
            }
          );
          callback(formattedOptions);
        })
        .catch((err) => {
          console.error(`Failed to load ${config.formattedName} options:`, err);
          callback([]);
        });
    },
    [config]
  );

  if (!grocerylistid) {
    return <div className="alert alert-warning">Missing Grocery List context.</div>;
  }

  return (
    <div className="my-4 p-3 border rounded shadow-sm bg-light">
      <h3 className="mb-3 h5">{`Plan a ${config.formattedName}`}</h3>
      {error && <div className="alert alert-danger small p-2 mb-2">{error}</div>}
      <div className="mb-2">
        <AsyncSelect<SelectOption>
          cacheOptions
          defaultOptions
          loadOptions={loadOptions}
          value={selectedItem}
          onChange={handleSelectChange}
          placeholder={config.selectPlaceholder}
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
              min={type === "recipe" ? "1" : "1"}
              step={type === "recipe" ? "1" : "any"}
              required
              aria-label={config.quantityLabel}
            />
          </div>

          {config.needsUnitField && (
            <div className="flex-grow-1">
              <label htmlFor={`${type}-unit`} className="form-label small mb-1 visually-hidden">
                Unit
              </label>
              <select
                id={`${type}-unit`}
                className="form-select form-select-sm"
                value={selectedUnitId}
                onChange={(e) => setSelectedUnitId(e.target.value)}
                required
                aria-label="Unit"
                disabled={availableUnits.length === 0}
              >
                <option value="" disabled>
                  Select Unit...
                </option>
                {availableUnits.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.name}
                  </option>
                ))}
              </select>
            </div>
          )}

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
                aria-label="Planned Date"
              />
            </div>
          )}

          <button
            onClick={handlePost}
            className="btn btn-primary btn-sm"
            disabled={isPosting || !quantity || (config.needsUnitField && !selectedUnitId)}
          >
            {isPosting ? "Planning..." : `Plan ${config.formattedName}`}
          </button>
        </div>
      )}
    </div>
  );
}
