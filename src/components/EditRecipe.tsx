import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Recipe } from "../types/Recipe";
import { RecipeForm } from "./RecipeForm";
import { fetchFromBackend } from "./fetchFromBackend";

export function EditRecipe() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchRecipe = async () => {
      if (!id) {
        setError("Recipe ID is missing.");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError("");
        const response = await fetchFromBackend(`/api/recipes/recipes/${id}/`);
        if (!response.ok) {
          if (response.status === 404) {
            setError("Recipe not found.");
          } else {
            throw new Error(`Recipe fetch failed: ${response.statusText}`);
          }
        } else {
          const data: Recipe = await response.json();
          setRecipe(data);
        }
      } catch (err) {
        console.error(err);
        if (!error) {
          setError(
            `Failed to load recipe. ${
              err instanceof Error ? err.message : "Please try again later."
            }`
          );
        }
      } finally {
        setLoading(false);
      }
    };

    fetchRecipe();
  }, [id, error]);

  const handleSave = (updatedRecipe: Recipe) => {
    if (updatedRecipe.id) {
      navigate(`/recipes/${updatedRecipe.id}`);
    } else {
      console.warn("Recipe updated but ID missing, navigating back to list.");
      navigate("/recipes");
    }
  };

  const handleCancel = () => {
    navigate(`/recipes/${id}`);
  };

  if (loading) return <div className="text-center p-3">Loading recipe for editing...</div>;
  if (error)
    return (
      <div className="container py-4">
        <div className="alert alert-danger">Error: {error}</div>
      </div>
    );
  if (!recipe) return <div className="text-center p-3">Recipe data could not be loaded.</div>;

  return (
    <div className="container py-4">
      <RecipeForm recipe={recipe} onSave={handleSave} onCancel={handleCancel} />
    </div>
  );
}
