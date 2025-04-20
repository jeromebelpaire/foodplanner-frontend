// src/components/EditRecipe.tsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Recipe } from "../types/Recipe";
import { RecipeForm } from "./RecipeForm";
import { fetchFromBackend } from "./fetchFromBackend";

// Add export
export const EditRecipe: React.FC = () => {
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
        // Avoid setting recipe not found error if it was already set
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
  }, [id, error]); // Added error to dependency array to avoid potential issues if error state affects logic

  const handleSave = (updatedRecipe: Recipe) => {
    // Navigate to the recipe detail page after successful update
    if (updatedRecipe.id) {
      navigate(`/recipes/${updatedRecipe.id}`);
    } else {
      console.warn("Recipe updated but ID missing, navigating back to list.");
      navigate("/recipes"); // Fallback
    }
  };

  const handleCancel = () => {
    // Navigate back to the detail page of the recipe being edited
    navigate(`/recipes/${id}`);
  };

  // Improved loading/error display
  if (loading) return <div className="text-center p-6">Loading recipe for editing...</div>;
  // Error covers fetch errors and 404 specifically handled above
  if (error)
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="text-red-600 p-4 bg-red-100 rounded">Error: {error}</div>
      </div>
    );
  // Ensure recipe is loaded before rendering form
  if (!recipe) return <div className="text-center p-6">Recipe data could not be loaded.</div>; // Or handle as error

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* Pass the loaded recipe to the form */}
      <RecipeForm recipe={recipe} onSave={handleSave} onCancel={handleCancel} />
    </div>
  );
};
