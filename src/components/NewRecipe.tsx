import { useNavigate } from "react-router-dom";
import { Recipe } from "../types/Recipe";
import { RecipeForm } from "./RecipeForm";

export function NewRecipe() {
  const navigate = useNavigate();

  const handleSave = (newRecipe: Recipe) => {
    if (newRecipe.id) {
      navigate(`/recipes/${newRecipe.id}`);
    } else {
      console.error("Recipe created but ID is missing, navigating back to list.");
      navigate("/recipes");
    }
  };

  const handleCancel = () => {
    navigate("/recipes");
  };

  return (
    <div className="container py-4">
      <RecipeForm onSave={handleSave} onCancel={handleCancel} />
    </div>
  );
}
