// src/components/NewRecipe.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { Recipe } from "../types/Recipe";
import { RecipeForm } from "./RecipeForm";

export const NewRecipe: React.FC = () => {
  const navigate = useNavigate();

  const handleSave = (newRecipe: Recipe) => {
    // Use optional chaining in case id is missing, though it should exist after creation
    if (newRecipe.id) {
      navigate(`/recipes/${newRecipe.id}`);
    } else {
      console.error("Recipe created but ID is missing, navigating back to list.");
      navigate("/recipes"); // Fallback navigation
    }
  };

  const handleCancel = () => {
    navigate("/recipes"); // Navigate back to the main list on cancel
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* Pass undefined recipe to indicate creation mode */}
      <RecipeForm onSave={handleSave} onCancel={handleCancel} />
    </div>
  );
};
